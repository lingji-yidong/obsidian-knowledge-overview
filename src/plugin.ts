import {
  Notice,
  Platform,
  Plugin,
  TFile,
  TFolder,
  normalizePath,
  setTooltip,
} from "obsidian";
import {
  GenerationCancelledError,
  callChatCompletion,
  type ChatRequestEvent,
} from "./api";
import {
  evaluateChapterQuality,
  getChapterQualityWarnings,
} from "./chapterQuality";
import { numberChapterHeadings } from "./chapter-numbering";
import { normalizeObsidianMathDelimiters } from "./chapter-markdown";
import {
  MAX_BLUEPRINT_CHAPTERS,
  buildFallbackChapterSpec,
  parseBlueprintComment,
  parseCourseBlueprint,
  renderCourseOutline,
  resolveBlueprintMaxCompletionTokens,
  serializeBlueprintComment,
} from "./courseBlueprint";
import {
  applyMinimumChapterChars,
  DENSITY_PRESETS,
  KNOWLEDGE_DEPTH_LABELS,
} from "./densityPresets";
import {
  GenerationCancellation,
  LogicalRequestBudget,
} from "./generationControl";
import {
  renderGenerationProvenance,
  type GenerationProvenance,
} from "./generationProvenance";
import { getHeaderText, getUiText, type UiText } from "./i18n";
import {
  buildBlueprintPlan,
  buildManualPlan,
  selectAdapter,
} from "./instructionalPlanner";
import type {
  ChapterContext,
  ChapterSpec,
  CourseBlueprint,
  KnowledgeDepth,
} from "./instructionalTypes";
import { InputModal, ResumeFailedModal } from "./modals";
import {
  buildChapterPrompt,
  buildInstructionalSystemPrompt,
  buildOutlinePrompt,
} from "./prompts";
import { SettingTab } from "./settings-tab";
import {
  DEFAULT_SETTINGS,
  MAX_CHAPTER_CONCURRENCY,
  MIN_CONCURRENCY,
  type MySettings,
} from "./settings";
import {
  type ChapterGenerationResult,
  Semaphore,
  clampInteger,
  errorToMessage,
  parseFailedChapterDepth,
  parseFailedChapters,
  parseOptionalPositiveInteger,
  slugifyTitle,
} from "./utils";

interface RunTelemetry {
  logicalRequests: number;
  physicalRequests: number;
  retries: number;
  compatibilityFallbacks: number;
  promptChars: number;
  outputChars: number;
  promptTokens: number;
  completionTokens: number;
}

interface GenerationRun {
  id: string;
  kind: "generate" | "resume";
  config: Readonly<MySettings>;
  cancellation: GenerationCancellation;
  requestBudget: LogicalRequestBudget;
  requestSemaphore: Semaphore;
  telemetry: RunTelemetry;
  currentPercent: number;
}

interface GeneratedChapter {
  content: string;
  qualityWarnings: string[];
  provenance: GenerationProvenance;
}

interface LlmCompletion extends GenerationProvenance {
  content: string;
}

export default class KnowledgePlugin extends Plugin {
  settings!: MySettings;
  private progressStatusEl?: HTMLElement;
  private progressLabelEl?: HTMLElement;
  private progressFillEl?: HTMLElement;
  private progressNotice?: Notice;
  private generateRibbonIcon?: HTMLElement;
  private resumeRibbonIcon?: HTMLElement;
  private commandsRegistered = false;
  private activeRun?: GenerationRun;
  private progressRunId?: string;
  private progressHideTimer?: number;

  async onload(): Promise<void> {
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

  onunload(): void {
    this.activeRun?.cancellation.cancel();
    if (this.progressHideTimer !== undefined) {
      window.clearTimeout(this.progressHideTimer);
    }
    this.progressNotice?.hide();
  }

  async loadSettings(): Promise<void> {
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
    if (
      this.settings.thinkingMode !== "auto" &&
      this.settings.thinkingMode !== "enabled" &&
      this.settings.thinkingMode !== "disabled"
    ) {
      this.settings.thinkingMode = DEFAULT_SETTINGS.thinkingMode;
    }
  }

  async saveSettings(): Promise<void> {
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
      this.removeCommand("cancel-knowledge-generation");
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

    this.addCommand({
      id: "cancel-knowledge-generation",
      name: uiText.cancelActiveGeneration,
      icon: "circle-stop",
      callback: () => this.cancelActiveGeneration(),
    });

    this.commandsRegistered = true;
  }

  private updateRibbonLabel(
    ribbonIcon: HTMLElement | undefined,
    label: string,
  ): void {
    if (!ribbonIcon) return;

    setTooltip(ribbonIcon, label, { placement: "right" });
    ribbonIcon.setAttr("aria-label", label);
    ribbonIcon.setAttr("title", label);
  }

  getActiveCourseName(): string {
    return this.app.workspace.getActiveFile()?.parent?.path ?? "";
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

  showProgress(label: string, percent: number, runId?: string): void {
    if (runId && this.progressRunId !== runId) return;

    const safePercent = clampInteger(percent, 0, 100);
    const message = `${label} (${safePercent}%)`;
    const activeRun = this.activeRun;
    if (activeRun && activeRun.id === runId) {
      activeRun.currentPercent = safePercent;
    }

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

  hideProgress(runId?: string): void {
    if (runId && this.progressRunId !== runId) return;

    this.progressStatusEl?.addClass("knowledge-progress-hidden");
    this.progressFillEl?.setCssProps({
      "--knowledge-progress-width": "0%",
    });
    this.progressNotice?.hide();
    this.progressNotice = undefined;
  }

  finishProgress(label: string, runId: string): void {
    this.showProgress(label, 100, runId);
    if (this.progressHideTimer !== undefined) {
      window.clearTimeout(this.progressHideTimer);
    }
    this.progressHideTimer = window.setTimeout(
      () => this.hideProgress(runId),
      5000,
    );
  }

  cancelActiveGeneration(): void {
    if (!this.activeRun) {
      new Notice("No active knowledge generation to cancel");
      return;
    }

    this.activeRun.cancellation.cancel();
    this.showProgress(
      "Cancelling after active requests finish",
      this.activeRun.currentPercent,
      this.activeRun.id,
    );
    new Notice("Cancellation requested; queued requests will not start");
  }

  private startRun(
    kind: GenerationRun["kind"],
    maxLogicalRequests: number,
  ): GenerationRun | null {
    if (this.activeRun) {
      new Notice(
        "Another knowledge generation is already active. Cancel it before starting a new one.",
        7000,
      );
      return null;
    }

    const config = Object.freeze({ ...this.settings });
    const run: GenerationRun = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      config,
      cancellation: new GenerationCancellation(),
      requestBudget: new LogicalRequestBudget(maxLogicalRequests),
      requestSemaphore: new Semaphore(config.chapterConcurrency),
      telemetry: {
        logicalRequests: 0,
        physicalRequests: 0,
        retries: 0,
        compatibilityFallbacks: 0,
        promptChars: 0,
        outputChars: 0,
        promptTokens: 0,
        completionTokens: 0,
      },
      currentPercent: 0,
    };

    if (this.progressHideTimer !== undefined) {
      window.clearTimeout(this.progressHideTimer);
      this.progressHideTimer = undefined;
    }
    this.activeRun = run;
    this.progressRunId = run.id;
    return run;
  }

  private endRun(run: GenerationRun): void {
    new Notice(
      `Requests: ${run.telemetry.logicalRequests} logical, ${run.telemetry.physicalRequests} HTTP, ${run.telemetry.retries} retries`,
      6000,
    );
    if (this.activeRun?.id === run.id) {
      this.activeRun = undefined;
    }
  }

  private handleRequestEvent(run: GenerationRun, event: ChatRequestEvent): void {
    if (event.kind === "request") {
      run.telemetry.physicalRequests += 1;
      run.telemetry.promptChars += event.promptChars ?? 0;
    } else if (event.kind === "success") {
      run.telemetry.outputChars += event.outputChars ?? 0;
      run.telemetry.promptTokens += event.promptTokens ?? 0;
      run.telemetry.completionTokens += event.completionTokens ?? 0;
    } else if (event.kind === "retry") {
      run.telemetry.retries += 1;
      this.showProgress(
        `Provider retry queued in ${event.delayMs ?? 0} ms`,
        run.currentPercent,
        run.id,
      );
    } else if (event.kind === "compatibility") {
      run.telemetry.compatibilityFallbacks += 1;
    }
  }

  private async callLLM(
    prompt: string,
    model: string,
    run: GenerationRun,
    systemPrompt?: string,
    maxCompletionTokens = run.config.maxCompletionTokens,
  ): Promise<LlmCompletion> {
    run.cancellation.throwIfCancelled();
    run.requestBudget.consume();
    run.telemetry.logicalRequests += 1;

    let provenance: GenerationProvenance = { model };

    const content = await callChatCompletion(
      {
        apiKey: run.config.apiKey,
        apiBaseUrl: run.config.apiBaseUrl,
        model,
        userPrompt: prompt,
        systemPrompt,
        maxCompletionTokens,
        temperature: run.config.temperature,
        reasoningEffort: run.config.reasoningEffort,
        verbosity: run.config.verbosity,
        thinkingMode: run.config.thinkingMode,
      },
      {
        shouldCancel: () => run.cancellation.isCancelled,
        scheduleRequest: (request) =>
          run.requestSemaphore.run(async () => {
            run.cancellation.throwIfCancelled();
            const stalledTimer = window.setTimeout(() => {
              this.showProgress(
                "Provider request is still running",
                run.currentPercent,
                run.id,
              );
            }, 60000);
            try {
              return await request();
            } finally {
              window.clearTimeout(stalledTimer);
            }
          }),
        onEvent: (event) => {
          this.handleRequestEvent(run, event);
          if (event.kind === "success") {
            provenance = {
              model: event.model ?? model,
              promptTokens: event.promptTokens,
              completionTokens: event.completionTokens,
              totalTokens: event.totalTokens,
              reasoningTokens: event.reasoningTokens,
            };
          }
        },
      },
    );

    return { content, ...provenance };
  }

  private async fetchCourseBlueprint(
    courseName: string,
    depth: KnowledgeDepth,
    run: GenerationRun,
  ): Promise<CourseBlueprint> {
    const prompt = buildOutlinePrompt(courseName, run.config.language, depth);
    const outlineMaxTokens = resolveBlueprintMaxCompletionTokens(
      run.config.maxCompletionTokens,
    );
    const response = await this.callLLM(
      prompt,
      run.config.modelOutline,
      run,
      "You design coherent course blueprints. Return strict JSON only.",
      outlineMaxTokens,
    );
    return parseCourseBlueprint(response.content, courseName, depth, {
      enforceMinimumChapters: true,
    });
  }

  private async fetchChapterNote(
    context: ChapterContext,
    depth: KnowledgeDepth,
    run: GenerationRun,
  ): Promise<GeneratedChapter> {
    const density = applyMinimumChapterChars(
      DENSITY_PRESETS[depth],
      run.config.minChapterChars,
    );
    const override = run.config.knowledgeTypeOverride;
    const plan =
      !run.config.autoDetectKnowledgeType || override !== "auto"
        ? buildManualPlan(
            override === "auto" ? "conceptual" : override,
            depth,
          )
        : buildBlueprintPlan(
            context.chapter.knowledgeType,
            context.chapter.secondaryKnowledgeTypes,
            depth,
          );
    const adapter = selectAdapter(plan);
    const prompt = buildChapterPrompt({
      context,
      language: run.config.language,
      depth,
      plan,
      adapter,
      density,
    });
    const completion = await this.callLLM(
      prompt,
      run.config.modelChapter,
      run,
      buildInstructionalSystemPrompt(),
    );
    const normalizedContent = normalizeObsidianMathDelimiters(
      completion.content,
    );
    const numberedContent = numberChapterHeadings(
      normalizedContent,
      context.chapter.chapterNumber,
    );
    const qualityReport = evaluateChapterQuality(numberedContent, density);

    return {
      content: numberedContent,
      qualityWarnings: getChapterQualityWarnings(qualityReport),
      provenance: {
        model: completion.model,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        totalTokens: completion.totalTokens,
        reasoningTokens: completion.reasoningTokens,
      },
    };
  }

  private buildChapterContext(
    blueprint: CourseBlueprint,
    chapter: ChapterSpec,
  ): ChapterContext {
    const index = blueprint.chapters.findIndex(
      (candidate) =>
        candidate.chapterNumber === chapter.chapterNumber ||
        candidate.title === chapter.title,
    );

    return {
      blueprint,
      chapter,
      previousChapter: index > 0 ? blueprint.chapters[index - 1] : undefined,
      nextChapter:
        index >= 0 && index < blueprint.chapters.length - 1
          ? blueprint.chapters[index + 1]
          : undefined,
    };
  }

  private async generateChapterContent(
    courseFolder: TFolder,
    context: ChapterContext,
    run: GenerationRun,
    depth: KnowledgeDepth,
    onComplete?: (result: ChapterGenerationResult) => void,
  ): Promise<ChapterGenerationResult> {
    const { chapter } = context;
    let result: ChapterGenerationResult;

    try {
      const generated = await this.fetchChapterNote(context, depth, run);
      const numStr = String(Number.parseInt(chapter.chapterNumber, 10)).padStart(
        2,
        "0",
      );
      const fileName = `${numStr}_${slugifyTitle(chapter.title)}.md`;
      const headerText = getHeaderText(run.config.language);
      const header = `# ${chapter.title}\n\n*${headerText.chapterNumber}: ${chapter.chapterNumber}*\n\n*${headerText.generated}*\n\n---\n\n`;
      const filePath = normalizePath(`${courseFolder.path}/${fileName}`);
      const existing = this.app.vault.getAbstractFileByPath(filePath);
      const fullContent = [
        `${header}${generated.content.trimEnd()}`,
        renderGenerationProvenance(generated.provenance),
        "",
      ].join("\n\n");

      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, fullContent);
      } else if (existing) {
        throw new Error(`Path "${filePath}" exists and is not a file`);
      } else {
        await this.app.vault.create(filePath, fullContent);
      }

      if (generated.qualityWarnings.length > 0) {
        new Notice(
          `⚠ ${fileName}: ${generated.qualityWarnings.join("; ")}`,
          8000,
        );
      } else {
        new Notice(`✓ ${fileName}`);
      }
      result = {
        chapterNum: chapter.chapterNumber,
        title: chapter.title,
        fileName,
        success: true,
        qualityWarnings: generated.qualityWarnings,
      };
    } catch (error) {
      const errorMsg = errorToMessage(error);
      if (!(error instanceof GenerationCancelledError)) {
        new Notice(
          `✗ Error generating chapter ${chapter.chapterNumber}: ${errorMsg}`,
          5000,
        );
        console.error(
          `Error generating chapter ${chapter.chapterNumber} (${chapter.title}):`,
          error,
        );
      }
      result = {
        chapterNum: chapter.chapterNumber,
        title: chapter.title,
        success: false,
        error: errorMsg,
      };
    } finally {
      onComplete?.(result!);
    }

    return result!;
  }

  private async writeFailureReport(
    courseFolder: TFolder,
    courseName: string,
    depth: KnowledgeDepth,
    failedChapters: ChapterGenerationResult[],
  ): Promise<void> {
    if (failedChapters.length === 0) return;

    const content = [
      "---",
      `knowledgeDepth: ${depth}`,
      "---",
      "",
      `# ${courseName} Failed Chapters`,
      "",
      `Generated at: ${new Date().toLocaleString()}`,
      "",
      "Only the chapters below need to be resumed.",
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

  private async clearFailureReport(
    courseFolder: TFolder,
    courseName: string,
  ): Promise<void> {
    const reportPath = normalizePath(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    if (!(existing instanceof TFile)) return;

    await this.app.vault.modify(
      existing,
      [
        `# ${courseName} Failed Chapters`,
        "",
        `Resolved at: ${new Date().toLocaleString()}`,
        "",
        "All previously failed chapters were generated successfully.",
        "",
      ].join("\n"),
    );
  }

  private async readSavedBlueprint(
    courseFolder: TFolder,
  ): Promise<CourseBlueprint | null> {
    const outlinePath = normalizePath(`${courseFolder.path}/Outlines.md`);
    const outlineFile = this.app.vault.getAbstractFileByPath(outlinePath);
    if (!(outlineFile instanceof TFile)) return null;

    return parseBlueprintComment(await this.app.vault.read(outlineFile));
  }

  async resumeFailedChapters(courseName: string): Promise<void> {
    if (!this.settings.apiKey) {
      new Notice("❌ API key not set! Please configure it in settings.");
      return;
    }
    if (this.activeRun) {
      new Notice("Another knowledge generation is already active", 7000);
      return;
    }

    const folderPath = normalizePath(courseName.trim());
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
    const failedChapterEntries = parseFailedChapters(report).slice(
      0,
      MAX_BLUEPRINT_CHAPTERS,
    );
    const depth =
      parseFailedChapterDepth(report) ?? DEFAULT_SETTINGS.knowledgeDepth;
    if (failedChapterEntries.length === 0) {
      new Notice("No failed chapters found to resume");
      return;
    }

    const savedBlueprint = await this.readSavedBlueprint(courseFolder);
    const blueprint: CourseBlueprint =
      savedBlueprint ?? {
        schemaVersion: 1,
        courseName: courseFolder.name,
        courseGoal: `Build a practical overview of ${courseFolder.name}.`,
        prerequisites: [],
        canonicalTerms: [],
        chapters: failedChapterEntries.map(([chapterNumber, title]) =>
          buildFallbackChapterSpec(
            courseFolder.name,
            chapterNumber,
            title,
            depth,
          ),
        ),
      };
    const chapters = failedChapterEntries.map(([chapterNumber, title]) => {
      return (
        blueprint.chapters.find(
          (chapter) =>
            chapter.chapterNumber === chapterNumber || chapter.title === title,
        ) ??
        buildFallbackChapterSpec(
          blueprint.courseName,
          chapterNumber,
          title,
          depth,
        )
      );
    });
    const run = this.startRun("resume", chapters.length);
    if (!run) return;

    new Notice(`🔁 Resuming ${chapters.length} failed chapters`);
    this.showProgress(`Resuming failed chapters: 0/${chapters.length}`, 5, run.id);

    try {
      let completed = 0;
      let failed = 0;
      const results = await Promise.all(
        chapters.map((chapter) =>
          this.generateChapterContent(
            courseFolder,
            this.buildChapterContext(blueprint, chapter),
            run,
            depth,
            (result) => {
              completed += 1;
              if (!result.success) failed += 1;
              this.showProgress(
                `Resumed ${completed}/${chapters.length}, ${failed} failed`,
                5 + Math.round((completed / chapters.length) * 90),
                run.id,
              );
            },
          ),
        ),
      );
      const failedResults = results.filter((result) => !result.success);
      if (failedResults.length > 0) {
        await this.writeFailureReport(
          courseFolder,
          blueprint.courseName,
          depth,
          failedResults,
        );
      } else {
        await this.clearFailureReport(courseFolder, blueprint.courseName);
      }

      const successCount = results.length - failedResults.length;
      if (run.cancellation.isCancelled) {
        this.finishProgress(
          `Cancelled: ${successCount}/${chapters.length} chapters saved`,
          run.id,
        );
      } else if (failedResults.length > 0) {
        this.finishProgress(
          `Resume finished: ${successCount}/${chapters.length} generated`,
          run.id,
        );
      } else {
        this.finishProgress(
          `Resume complete: ${chapters.length} chapters generated`,
          run.id,
        );
      }
    } catch (error) {
      const message = errorToMessage(error);
      this.finishProgress(`Resume failed: ${message}`, run.id);
      if (!(error instanceof GenerationCancelledError)) {
        console.error("Resume generation error:", error);
      }
    } finally {
      this.endRun(run);
    }
  }

  async generate(
    courseName: string,
    depth: KnowledgeDepth = DEFAULT_SETTINGS.knowledgeDepth,
  ): Promise<void> {
    if (!this.settings.apiKey) {
      new Notice("❌ API key not set! Please configure it in settings.");
      return;
    }

    const normalizedCourseName = courseName.trim();
    if (!normalizedCourseName) {
      new Notice("Please enter a subject name");
      return;
    }

    const run = this.startRun("generate", MAX_BLUEPRINT_CHAPTERS + 1);
    if (!run) return;

    new Notice(`📚 Generating: ${normalizedCourseName}`);
    this.showProgress(`Generating course blueprint`, 5, run.id);

    try {
      const blueprint = await this.fetchCourseBlueprint(
        normalizedCourseName,
        depth,
        run,
      );
      const folderPath = normalizePath(normalizedCourseName);
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      let courseFolder: TFolder;

      if (existing instanceof TFolder) {
        courseFolder = existing;
      } else if (existing) {
        throw new Error(`Path "${folderPath}" exists as a file`);
      } else {
        courseFolder = await this.app.vault.createFolder(folderPath);
      }

      const headerText = getHeaderText(run.config.language);
      const depthLabel = KNOWLEDGE_DEPTH_LABELS[depth];
      const outlineContent = [
        `# ${blueprint.courseName} ${headerText.outlineTitle}`,
        "",
        `*${headerText.generatedAt}: ${new Date().toLocaleString()}*`,
        "",
        `*Chapter depth: ${depthLabel} (${depth})*`,
        "",
        `> ${blueprint.courseGoal}`,
        "",
        renderCourseOutline(blueprint),
        "",
        serializeBlueprintComment(blueprint),
      ].join("\n");
      const outlinePath = normalizePath(`${courseFolder.path}/Outlines.md`);
      const existingOutline = this.app.vault.getAbstractFileByPath(outlinePath);
      if (existingOutline instanceof TFile) {
        await this.app.vault.modify(existingOutline, outlineContent);
      } else if (existingOutline) {
        throw new Error(`Path "${outlinePath}" exists and is not a file`);
      } else {
        await this.app.vault.create(outlinePath, outlineContent);
      }

      const chapters = blueprint.chapters;
      let completed = 0;
      let failed = 0;
      this.showProgress(`0/${chapters.length} chapters generated`, 15, run.id);
      const results = await Promise.all(
        chapters.map((chapter) =>
          this.generateChapterContent(
            courseFolder,
            this.buildChapterContext(blueprint, chapter),
            run,
            depth,
            (result) => {
              completed += 1;
              if (!result.success) failed += 1;
              this.showProgress(
                `${completed}/${chapters.length} chapters done, ${failed} failed`,
                15 + Math.round((completed / chapters.length) * 80),
                run.id,
              );
            },
          ),
        ),
      );
      const failedResults = results.filter((result) => !result.success);
      if (failedResults.length > 0) {
        await this.writeFailureReport(
          courseFolder,
          blueprint.courseName,
          depth,
          failedResults,
        );
      } else {
        await this.clearFailureReport(courseFolder, blueprint.courseName);
      }

      const successCount = results.length - failedResults.length;
      if (run.cancellation.isCancelled) {
        this.finishProgress(
          `Cancelled: ${successCount}/${chapters.length} chapters saved`,
          run.id,
        );
      } else if (failedResults.length > 0) {
        this.finishProgress(
          `Done: ${successCount}/${chapters.length} generated`,
          run.id,
        );
      } else {
        this.finishProgress(
          `Done: ${chapters.length} chapters generated`,
          run.id,
        );
      }
    } catch (error) {
      const message = errorToMessage(error);
      if (error instanceof GenerationCancelledError) {
        this.finishProgress("Generation cancelled", run.id);
      } else {
        new Notice(`❌ Error: ${message}`, 5000);
        this.finishProgress(`Failed: ${message}`, run.id);
        console.error("Generation error:", error);
      }
    } finally {
      this.endRun(run);
    }
  }
}
