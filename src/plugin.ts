import {
  Notice,
  Platform,
  Plugin,
  TFile,
  TFolder,
  normalizePath,
  setTooltip,
} from "obsidian";
import { ApiError, callChatCompletion, isRetryableStatus } from "./api";
import {
  evaluateChapterQuality,
  formatQualityReport,
  shouldRepairChapter,
} from "./chapterQuality";
import {
  applyMinimumChapterChars,
  DENSITY_PRESETS,
  KNOWLEDGE_DEPTH_LABELS,
} from "./densityPresets";
import { getHeaderText, getUiText, type UiText } from "./i18n";
import {
  buildManualPlan,
  buildPlanningPrompt,
  parsePlanningResponse,
  selectAdapter,
} from "./instructionalPlanner";
import type { ChapterGenerationPlan, KnowledgeDepth } from "./instructionalTypes";
import { InputModal, ResumeFailedModal } from "./modals";
import {
  buildChapterPrompt,
  buildChapterRepairPrompt,
  buildInstructionalSystemPrompt,
  buildOutlinePrompt,
} from "./prompts";
import { normalizeKnownMarkdownHeadings } from "./sectionHeadings";
import { SettingTab } from "./settings-tab";
import {
  DEFAULT_SETTINGS,
  MAX_API_RETRIES,
  MAX_CHAPTER_CONCURRENCY,
  MIN_CONCURRENCY,
  RETRY_BASE_DELAY_MS,
  type MySettings,
} from "./settings";
import {
  ChapterGenerationResult,
  Semaphore,
  clampInteger,
  errorToMessage,
  parseChapterTitles,
  parseFailedChapterDepth,
  parseFailedChapters,
  parseOptionalPositiveInteger,
  sleep,
  slugifyTitle,
} from "./utils";

export default class KnowledgePlugin extends Plugin {
  settings!: MySettings;
  private progressStatusEl?: HTMLElement;
  private progressLabelEl?: HTMLElement;
  private progressFillEl?: HTMLElement;
  private progressNotice?: Notice;
  private generateRibbonIcon?: HTMLElement;
  private resumeRibbonIcon?: HTMLElement;
  private commandsRegistered = false;

  async onload() {
    await this.loadSettings();
    this.setupProgressStatus();
    const uiText = getUiText(this.settings.language);

    this.registerLocalizedCommands(uiText);

    this.generateRibbonIcon = this.addRibbonIcon(
      "book-open",
      uiText.generateKnowledge,
      () => {
        new InputModal(this.app, this).open();
      },
    );
    this.generateRibbonIcon.addClass("knowledge-ribbon-icon");

    this.resumeRibbonIcon = this.addRibbonIcon(
      "refresh-cw",
      uiText.resumeFailedChapters,
      () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      },
    );
    this.resumeRibbonIcon.addClass("knowledge-ribbon-icon");

    this.addSettingTab(new SettingTab(this.app, this));
  }

  async loadSettings() {
    const loadedSettings = (await this.loadData()) as Partial<MySettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings ?? {});
    this.settings.chapterConcurrency = clampInteger(
      this.settings.chapterConcurrency,
      MIN_CONCURRENCY,
      MAX_CHAPTER_CONCURRENCY,
    );
    this.settings.maxCompletionTokens = parseOptionalPositiveInteger(
      this.settings.maxCompletionTokens,
    );
    this.settings.minChapterChars =
      parseOptionalPositiveInteger(this.settings.minChapterChars) ??
      DEFAULT_SETTINGS.minChapterChars;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshLocalizedUi(): void {
    const uiText = getUiText(this.settings.language);
    this.registerLocalizedCommands(uiText);
    this.updateRibbonLabel(this.generateRibbonIcon, uiText.generateKnowledge);
    this.updateRibbonLabel(this.resumeRibbonIcon, uiText.resumeFailedChapters);
  }

  private registerLocalizedCommands(uiText: UiText): void {
    if (this.commandsRegistered) {
      this.removeCommand("generate-knowledge");
      this.removeCommand("resume-failed-chapters");
    }

    this.addCommand({
      id: "generate-knowledge",
      name: uiText.generateKnowledge,
      icon: "book-open",
      callback: () => {
        new InputModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "resume-failed-chapters",
      name: uiText.resumeFailedChapters,
      icon: "refresh-cw",
      callback: () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      },
    });

    this.commandsRegistered = true;
  }

  private updateRibbonLabel(
    ribbonIcon: HTMLElement | undefined,
    label: string,
  ): void {
    if (!ribbonIcon) {
      return;
    }

    setTooltip(ribbonIcon, label, { placement: "right" });
    ribbonIcon.setAttr("aria-label", label);
    ribbonIcon.setAttr("title", label);
  }

  getActiveCourseName(): string {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile?.parent?.path ?? "";
  }

  setupProgressStatus(): void {
    this.progressStatusEl = this.addStatusBarItem();
    this.progressStatusEl.addClass("knowledge-progress-status");
    if (Platform.isMobile) {
      this.progressStatusEl.addClass("knowledge-progress-mobile");
    }
    this.progressStatusEl.empty();

    this.progressLabelEl = this.progressStatusEl.createSpan({
      cls: "knowledge-progress-label",
    });

    const track = this.progressStatusEl.createDiv({
      cls: "knowledge-progress-track",
    });
    this.progressFillEl = track.createDiv({
      cls: "knowledge-progress-fill",
    });

    this.hideProgress();
  }

  showProgress(label: string, percent: number): void {
    const safePercent = clampInteger(percent, 0, 100);
    const message = `${label} (${safePercent}%)`;

    if (this.progressStatusEl && this.progressLabelEl && this.progressFillEl) {
      this.progressStatusEl.removeClass("knowledge-progress-hidden");
      this.progressLabelEl.setText(label);
      this.progressFillEl.setCssProps({
        "--knowledge-progress-width": `${safePercent}%`,
      });
    }

    if (!this.progressNotice) {
      this.progressNotice = new Notice(message, 0);
      this.progressNotice.containerEl.addClass("knowledge-progress-notice");
    } else {
      this.progressNotice.setMessage(message);
    }
  }

  hideProgress(): void {
    this.progressStatusEl?.addClass("knowledge-progress-hidden");
    if (this.progressFillEl) {
      this.progressFillEl.setCssProps({
        "--knowledge-progress-width": "0%",
      });
    }
    this.progressNotice?.hide();
    this.progressNotice = undefined;
  }

  finishProgress(label: string): void {
    this.showProgress(label, 100);
    window.setTimeout(() => this.hideProgress(), 5000);
  }

  async callLLM(
    prompt: string,
    model: string,
    systemPrompt?: string,
  ): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
      try {
        return await callChatCompletion({
          apiKey: this.settings.apiKey,
          apiBaseUrl: this.settings.apiBaseUrl,
          model,
          userPrompt: prompt,
          systemPrompt,
          maxCompletionTokens: this.settings.maxCompletionTokens,
          temperature: this.settings.temperature,
          reasoningEffort: this.settings.reasoningEffort,
          verbosity: this.settings.verbosity,
        });
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === MAX_API_RETRIES;
        const status = error instanceof ApiError ? error.status : undefined;
        const retryable = status === undefined || isRetryableStatus(status);

        if (isLastAttempt || !retryable) {
          throw error;
        }

        const delay = RETRY_BASE_DELAY_MS * (attempt + 1);
        this.showProgress(`Retrying API request ${attempt + 1}/${MAX_API_RETRIES}`, 10);
        await sleep(delay);
      }
    }

    throw lastError;
  }

  async fetchOutline(courseName: string): Promise<string> {
    try {
      const prompt = buildOutlinePrompt(courseName, this.settings.language);
      return await this.callLLM(prompt, this.settings.modelOutline);
    } catch (error) {
      console.error(`Error fetching outline for ${courseName}:`, error);
      throw error;
    }
  }

  async fetchChapterNote(
    courseName: string,
    chapterName: string,
    depth: KnowledgeDepth,
  ): Promise<string> {
    try {
      const density = applyMinimumChapterChars(
        DENSITY_PRESETS[depth],
        this.settings.minChapterChars,
      );
      const plan = await this.planChapter(courseName, chapterName, depth);
      const adapter = selectAdapter(plan);
      const systemPrompt = buildInstructionalSystemPrompt();
      const prompt = buildChapterPrompt({
        courseName,
        chapterName,
        language: this.settings.language,
        depth,
        plan,
        adapter,
        density,
      });
      let chapter = await this.callLLM(
        prompt,
        this.settings.modelChapter,
        systemPrompt,
      );
      chapter = normalizeKnownMarkdownHeadings(
        chapter,
        this.settings.language,
      );
      const qualityReport = evaluateChapterQuality(chapter, density, adapter);

      if (
        this.settings.autoExpandShortChapters &&
        shouldRepairChapter(qualityReport)
      ) {
        const repairPrompt = buildChapterRepairPrompt({
          courseName,
          chapterName,
          language: this.settings.language,
          density,
          plan,
          adapter,
          qualityReport,
          formattedQualityReport: formatQualityReport(qualityReport),
          existingChapter: chapter,
        });
        chapter = await this.callLLM(
          repairPrompt,
          this.settings.modelChapter,
          systemPrompt,
        );
        chapter = normalizeKnownMarkdownHeadings(
          chapter,
          this.settings.language,
        );
      }

      return chapter;
    } catch (error) {
      console.error(`Error fetching chapter note for ${chapterName}:`, error);
      throw error;
    }
  }

  async planChapter(
    courseName: string,
    chapterName: string,
    depth: KnowledgeDepth,
  ): Promise<ChapterGenerationPlan> {
    const override = this.settings.knowledgeTypeOverride;

    if (!this.settings.autoDetectKnowledgeType || override !== "auto") {
      return buildManualPlan(override === "auto" ? "conceptual" : override, depth);
    }

    const prompt = buildPlanningPrompt(
      courseName,
      chapterName,
      this.settings.language,
      depth,
    );
    const response = await this.callLLM(
      prompt,
      this.settings.modelChapter,
      "You classify learning chapters. Return strict JSON only.",
    );

    return parsePlanningResponse(response, courseName, chapterName, depth);
  }

  async generateChapterContent(
    courseFolder: TFolder,
    chapterInfo: [string, string],
    courseName: string,
    sem: Semaphore,
    depth: KnowledgeDepth,
    onComplete?: (result: ChapterGenerationResult) => void,
  ): Promise<ChapterGenerationResult> {
    const [chapterNum, title] = chapterInfo;

    return await sem.run(async () => {
      let result: ChapterGenerationResult;
      try {
        const chapterContent = await this.fetchChapterNote(
          courseName,
          title,
          depth,
        );
        const numStr = String(parseInt(chapterNum)).padStart(2, "0");
        const slug = slugifyTitle(title);
        const fileName = `${numStr}_${slug}.md`;
        const headerText = getHeaderText(this.settings.language);
        const header = `# ${title}\n\n*${headerText.chapterNumber}: ${chapterNum}*\n\n*${headerText.generated}*\n\n---\n\n`;
        const fullContent = header + chapterContent;
        const filePath = normalizePath(`${courseFolder.path}/${fileName}`);
        const existing = this.app.vault.getAbstractFileByPath(filePath);

        if (existing instanceof TFile) {
          await this.app.vault.modify(existing, fullContent);
        } else if (existing) {
          throw new Error(`Path "${filePath}" exists and is not a file`);
        } else {
          await this.app.vault.create(filePath, fullContent);
        }

        new Notice(`✓ ${fileName}`);
        result = {
          chapterNum,
          title,
          fileName,
          success: true,
        };
      } catch (error) {
        const errorMsg = errorToMessage(error);
        new Notice(
          `✗ Error generating chapter ${chapterNum}: ${errorMsg}`,
          5000,
        );
        console.error(
          `Error generating chapter ${chapterNum} (${title}):`,
          error,
        );
        result = {
          chapterNum,
          title,
          success: false,
          error: errorMsg,
        };
      } finally {
        onComplete?.(result!);
      }

      return result!;
    });
  }

  async writeFailureReport(
    courseFolder: TFolder,
    courseName: string,
    depth: KnowledgeDepth,
    failedChapters: ChapterGenerationResult[],
  ): Promise<void> {
    if (failedChapters.length === 0) {
      return;
    }

    const content = [
      "---",
      `knowledgeDepth: ${depth}`,
      "---",
      "",
      `# ${courseName} Failed Chapters`,
      "",
      `Generated at: ${new Date().toLocaleString()}`,
      "",
      "The plugin retried transient API failures before writing this report.",
      "You can run generation again later after lowering concurrency or switching to a more stable provider.",
      "",
      ...failedChapters.reduce<string[]>((lines, chapter) => {
        lines.push(`- ${chapter.chapterNum}. ${chapter.title}`);
        lines.push(`  - Error: ${chapter.error ?? "Unknown error"}`);
        return lines;
      }, []),
      "",
    ].join("\n");

    const reportPath = normalizePath(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);

    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(reportPath, content);
    }
  }

  async clearFailureReport(courseFolder: TFolder, courseName: string): Promise<void> {
    const reportPath = normalizePath(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    const content = [
      `# ${courseName} Failed Chapters`,
      "",
      `Resolved at: ${new Date().toLocaleString()}`,
      "",
      "All previously failed chapters were generated successfully.",
      "",
    ].join("\n");

    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
    }
  }

  async resumeFailedChapters(courseName: string): Promise<void> {
    if (!this.settings.apiKey) {
      new Notice("❌ API key not set! Please configure it in settings.");
      return;
    }

    const folderPath = normalizePath(courseName.trim());
    if (!folderPath) {
      new Notice("Please enter a subject folder name");
      return;
    }

    const courseFolder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(courseFolder instanceof TFolder)) {
      new Notice(`❌ Folder not found: ${folderPath}`, 7000);
      return;
    }

    const reportPath = normalizePath(`${courseFolder.path}/Failed_Chapters.md`);
    const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
    if (!(reportFile instanceof TFile)) {
      new Notice(`No Failed_Chapters.md found in ${courseFolder.path}`, 7000);
      return;
    }

    const report = await this.app.vault.read(reportFile);
    const chapters = parseFailedChapters(report);
    const depth =
      parseFailedChapterDepth(report) ?? DEFAULT_SETTINGS.knowledgeDepth;

    if (chapters.length === 0) {
      new Notice("No failed chapters found to resume");
      this.finishProgress("No failed chapters found");
      return;
    }

    new Notice(`🔁 Resuming ${chapters.length} failed chapters`);
    this.showProgress(`Resuming failed chapters: 0/${chapters.length}`, 5);

    try {
      const chapterSem = new Semaphore(this.settings.chapterConcurrency);
      let completedChapters = 0;
      let failedChapters = 0;
      const updateProgress = (result: ChapterGenerationResult) => {
        completedChapters += 1;
        if (!result.success) {
          failedChapters += 1;
        }

        const percent = 5 + Math.round((completedChapters / chapters.length) * 90);
        this.showProgress(
          `Resumed ${completedChapters}/${chapters.length}, ${failedChapters} failed`,
          percent,
        );
      };

      const results = await Promise.all(
        chapters.map((chapterInfo) =>
          this.generateChapterContent(
            courseFolder,
            chapterInfo,
            courseFolder.path,
            chapterSem,
            depth,
            updateProgress,
          ),
        ),
      );

      const failedResults = results.filter((result) => !result.success);
      const successCount = results.length - failedResults.length;

      if (failedResults.length > 0) {
        await this.writeFailureReport(
          courseFolder,
          courseFolder.path,
          depth,
          failedResults,
        );
        new Notice(
          `⚠️ Resume finished: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          10000,
        );
        this.finishProgress(
          `Resume finished: ${successCount}/${chapters.length} generated, ${failedResults.length} failed`,
        );
      } else {
        await this.clearFailureReport(courseFolder, courseFolder.path);
        new Notice(`✅ Resume complete: ${chapters.length} chapters generated`);
        this.finishProgress(`Resume complete: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = errorToMessage(error);
      new Notice(`❌ Resume failed: ${errorMsg}`, 7000);
      this.finishProgress(`Resume failed: ${errorMsg}`);
      console.error("Resume generation error:", error);
    }
  }

  async generate(
    courseName: string,
    depth: KnowledgeDepth = DEFAULT_SETTINGS.knowledgeDepth,
  ) {
    if (!this.settings.apiKey) {
      new Notice("❌ API key not set! Please configure it in settings.");
      return;
    }

    new Notice(`📚 Generating: ${courseName}`);
    this.showProgress(`Starting ${courseName}`, 1);

    try {
      this.showProgress(`Generating outline: ${courseName}`, 5);
      new Notice("⏳ Generating outline...");
      const outline = await this.fetchOutline(courseName);
      const folderPath = normalizePath(courseName);
      let courseFolder: TFolder;
      const existing = this.app.vault.getAbstractFileByPath(folderPath);

      if (existing instanceof TFolder) {
        courseFolder = existing;
        new Notice(`📁 Using existing folder: ${courseName}`);
      } else if (existing) {
        const errorMsg = `Path "${folderPath}" exists as a file, not a folder. Please rename or delete it manually.`;
        new Notice(`❌ ${errorMsg}`, 7000);
        throw new Error(errorMsg);
      } else {
        try {
          courseFolder = await this.app.vault.createFolder(folderPath);
          new Notice(`📁 Created folder: ${courseName}`);
        } catch (error) {
          throw new Error(
            `Failed to create folder "${folderPath}": ${errorToMessage(error)}`,
          );
        }
      }

      const headerText = getHeaderText(this.settings.language);
      const depthLabel = KNOWLEDGE_DEPTH_LABELS[depth];
      const outlineContent = `# ${courseName} ${headerText.outlineTitle}\n\n*${headerText.generatedAt}: ${new Date().toLocaleString()}*\n\n*Chapter depth: ${depthLabel} (${depth})*\n\n${outline}`;
      const outlineFilePath = normalizePath(`${courseFolder.path}/Outlines.md`);
      const existingOutline = this.app.vault.getAbstractFileByPath(outlineFilePath);

      if (existingOutline instanceof TFile) {
        await this.app.vault.modify(existingOutline, outlineContent);
      } else if (existingOutline) {
        throw new Error(`Path "${outlineFilePath}" exists and is not a file`);
      } else {
        await this.app.vault.create(outlineFilePath, outlineContent);
      }

      this.showProgress(`Outline saved: ${courseName}`, 15);
      new Notice("✓ Outlines.md created");

      const chapters = parseChapterTitles(outline);
      if (chapters.length === 0) {
        new Notice("⚠️ no chapters found in outline");
        this.finishProgress("No chapters found");
        return;
      }

      new Notice(`📖 Found ${chapters.length} chapters, generating content...`);
      this.showProgress(`0/${chapters.length} chapters generated`, 15);

      const chapterSem = new Semaphore(this.settings.chapterConcurrency);
      let completedChapters = 0;
      let failedChapters = 0;
      const updateChapterProgress = (result: ChapterGenerationResult) => {
        completedChapters += 1;
        if (!result.success) {
          failedChapters += 1;
        }
        const percent = 15 + Math.round((completedChapters / chapters.length) * 80);
        this.showProgress(
          `${completedChapters}/${chapters.length} chapters done, ${failedChapters} failed`,
          percent,
        );
      };

      const tasks = chapters.map((chapterInfo) =>
        this.generateChapterContent(
          courseFolder,
          chapterInfo,
          courseName,
          chapterSem,
          depth,
          updateChapterProgress,
        ),
      );

      const results = await Promise.all(tasks);
      const failedResults = results.filter((result) => !result.success);
      await this.writeFailureReport(
        courseFolder,
        courseName,
        depth,
        failedResults,
      );

      const successCount = results.length - failedResults.length;
      if (failedResults.length > 0) {
        new Notice(
          `⚠️ Done with failures: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          10000,
        );
        this.finishProgress(
          `Done: ${successCount}/${chapters.length} chapters generated, ${failedResults.length} failed`,
        );
      } else {
        await this.clearFailureReport(courseFolder, courseName);
        new Notice(
          `✅ Done! Generated ${chapters.length} chapters for ${courseName}`,
        );
        this.finishProgress(`Done: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = errorToMessage(error);
      new Notice(`❌ Error: ${errorMsg}`, 5000);
      this.finishProgress(`Failed: ${errorMsg}`);
      console.error("Generation error:", error);
    }
  }
}
