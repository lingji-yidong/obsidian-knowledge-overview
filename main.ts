import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Platform,
  requestUrl,
  Setting,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";

/* ================= INTERFACES & SETTINGS ================= */

interface MySettings {
  apiKey: string;
  language: string;
  apiBaseUrl: string;
  modelOutline: string;
  modelChapter: string;
  concurrency: number;
  chapterConcurrency: number;
}

const DEFAULT_SETTINGS: MySettings = {
  apiKey: "",
  language: "en",
  apiBaseUrl: "https://api.openai.com/v1",
  modelOutline: "gpt-5.4-mini",
  modelChapter: "gpt-5.4-mini",
  concurrency: 2,
  chapterConcurrency: 3,
};

const MIN_CONCURRENCY = 1;
const MAX_COURSE_CONCURRENCY = 10;
const MAX_CHAPTER_CONCURRENCY = 20;
const MAX_API_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1500;

/* ================= PROMPTS ================= */

const LANGUAGE_OPTIONS: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  zh_tw: "繁體中文",
  ja: "日本語",
  ko: "한국어",
  vi: "Tiếng Việt",
  th: "ไทย",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  hi: "हिन्दी",
  ar: "العربية",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  sv: "Svenska",
  pl: "Polski",
  tr: "Türkçe",
  ru: "Русский",
};

function getLanguageLabel(language: string): string {
  return LANGUAGE_OPTIONS[language] ?? language;
}

function buildOutlinePrompt(courseName: string, language: string): string {
  const targetLanguage = getLanguageLabel(language);

  return `
請你作為大學課程助教，為指定課程整理一份高質量課程提綱。這份提綱用於快速建立背景知識，可服務於科研入門前的背景了解、課程複習、跨領域學習和專業交流準備。你需要考慮國際通用教學中這門課最主要的知識，包括經典內容、現代發展、核心概念、重要理論和典型應用。

輸出語言：${targetLanguage}
術語要求：主要內容使用「${targetLanguage}」。關鍵術語請用雙語展示，格式為（English Term, ${targetLanguage} Term）。

請按照以下格式輸出：
1. 一級章節標題
   - 子項目（English Term, ${targetLanguage} Term）
   - 子項目（English Term, ${targetLanguage} Term）

2. 一級章節標題
   - 子項目（English Term, ${targetLanguage} Term）
   - 子項目（English Term, ${targetLanguage} Term）

請確保：
1. 一級章節必須使用數字編號（1., 2., 3. 等）
2. 子項目使用短橫線（-）
3. 術語採用雙語對照格式：（English Term, ${targetLanguage} Term）
4. 內容應該涵蓋課程的核心概念、重要主題、基礎理論、典型方法和實際應用
5. 提綱應像正式教材或高質量課程 syllabus，不要寫成零散關鍵詞清單
6. 不要在正文中描述使用者的個人背景或準備流程；只輸出課程知識本身

請為以下課程生成大綱（10-20個章節是可接受範圍）：

Course: ${courseName}
`;
}

function buildChapterPrompt(
  courseName: string,
  chapterName: string,
  language: string,
): string {
  const targetLanguage = getLanguageLabel(language);

  return `請你作為大學課程助教，為指定課程章節撰寫一份高質量的核心濃縮知識筆記。這份筆記用於快速建立背景知識，可服務於科研入門前的背景了解、課程複習、跨領域學習和專業交流準備。本次課程是「${courseName}」。請針對指定章節提供教材式的概念講解、原理推導、重要定理、公式、例子和實際應用。

輸出語言：${targetLanguage}
術語要求：主要內容使用「${targetLanguage}」。關鍵術語請提供（English Term, ${targetLanguage} Term）雙語對照。

請為以下章節生成詳細的知識點：${chapterName}

要求：
1. 先用 1-3 段文字講清楚本章核心概念：它解決什麼問題、為什麼重要、和整門課的關係是什麼
2. 系統涵蓋該章節的核心概念、基本假設、重要定理、典型模型或算法
3. 不要只列短 bullet；每個核心概念都要有解釋性段落，必要時再配 bullet 做整理
4. 提供具體例子，說明概念如何使用；例子要有上下文，不要只給公式或關鍵詞
5. 說明實際應用場景，以及該章節知識在工程、研究或日常問題中的作用
6. 關鍵術語提供英文與目標語言對照
7. 對容易混淆的概念做對比說明，指出常見誤解
8. 公式必須使用 Obsidian 內建 KaTeX 可解析的 Markdown 寫法：
   - 行內公式使用單美元符號，例如：$E = mc^2$
   - 獨立展示公式使用雙美元符號，且 $$ 必須單獨成行，例如：

$$
f(x) = \\sum_{n=0}^{\\infty} a_n x^n
$$

   - 不要把公式放進以三個反引號開頭的 latex/math fenced code block
   - 不要使用 Obsidian/KaTeX 不常支持的宏包命令；優先使用標準 LaTeX/KaTeX 語法
   - 每個重要公式後要解釋符號含義和直覺
9. 建議使用以下結構：
   - 核心概念
   - 重要原理與定理
   - 公式與推導直覺
   - 例子
   - 實際應用
   - 易混淆點
   - 關鍵術語對照
10. 不要在正文中描述使用者的個人背景或準備流程；只輸出章節知識本身
`;
}

const HEADER_TEXT: Record<
  string,
  {
    outlineTitle: string;
    generatedAt: string;
    chapterNumber: string;
    generated: string;
  }
> = {
  en: {
    outlineTitle: "Outline",
    generatedAt: "Generated at",
    chapterNumber: "Chapter",
    generated: "Auto-generated review and interview notes. Edit freely.",
  },
  zh: {
    outlineTitle: "大綱",
    generatedAt: "自動生成時間",
    chapterNumber: "章節編號",
    generated: "自動生成的複習/面試知識點，可自由編輯補充",
  },
  zh_tw: {
    outlineTitle: "大綱",
    generatedAt: "自動生成時間",
    chapterNumber: "章節編號",
    generated: "自動生成的複習/面試知識點，可自由編輯補充",
  },
};

function getHeaderText(language: string): {
  outlineTitle: string;
  generatedAt: string;
  chapterNumber: string;
  generated: string;
} {
  return HEADER_TEXT[language] ?? HEADER_TEXT.en;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.floor(value), min), max);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

interface ChapterGenerationResult {
  chapterNum: string;
  title: string;
  fileName?: string;
  success: boolean;
  error?: string;
}

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* ================= UTILITY FUNCTIONS ================= */

function slugifyTitle(title: string): string {
  // 保留各語言字母、數字、空格和連字符，支援歐洲/亞洲語言標題。
  let safe = title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  // 將多個空格替換為單個下劃線
  return safe.replace(/\s+/g, "_") || "chapter";
}

function parseChapterTitles(outline: string): Array<[string, string]> {
  const lines = outline.split("\n");
  const chapters: Array<[string, string]> = [];

  const chapterPattern = /^\s*(\d+)\.\s*(.+?)(?:\s*$)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(chapterPattern);
    if (match) {
      const chapterNum = match[1];
      let title = match[2].trim();

      // 清理標題，移除可能的標點符號
      title = title.replace(/[：:]+$/, "").trim();

      if (title) {
        chapters.push([chapterNum, title]);
      }
    }
  }

  return chapters;
}

function parseFailedChapters(report: string): Array<[string, string]> {
  const chapters: Array<[string, string]> = [];
  const chapterPattern = /^\s*-\s*(\d+)\.\s*(.+?)\s*$/;

  for (const line of report.split("\n")) {
    const match = line.match(chapterPattern);
    if (!match) {
      continue;
    }

    chapters.push([match[1], match[2].trim()]);
  }

  return chapters;
}

/* ================= SEMAPHORE FOR CONCURRENCY CONTROL ================= */

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
    } else {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }
  }

  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve?.();
    } else {
      this.permits++;
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/* ================= PLUGIN CLASS ================= */

export default class KnowledgePlugin extends Plugin {
  settings!: MySettings;
  private progressStatusEl?: HTMLElement;
  private progressLabelEl?: HTMLElement;
  private progressFillEl?: HTMLElement;
  private progressNotice?: Notice;

  async onload() {
    await this.loadSettings();
    this.setupProgressStatus();

    this.addCommand({
      id: "generate-knowledge",
      name: "Generate Knowledge Overview",
      callback: () => {
        new InputModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "resume-failed-chapters",
      name: "Resume Failed Chapter Generation",
      callback: () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      },
    });

    const ribbonIcon = this.addRibbonIcon(
      "book-open",
      "Generate Knowledge Overview",
      () => {
        new InputModal(this.app, this).open();
      },
    );
    ribbonIcon.addClass("knowledge-ribbon-icon");

    const resumeRibbonIcon = this.addRibbonIcon(
      "refresh-cw",
      "Resume Failed Chapter Generation",
      () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      },
    );
    resumeRibbonIcon.addClass("knowledge-ribbon-icon");

    this.addSettingTab(new SettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.concurrency = clampInteger(
      this.settings.concurrency,
      MIN_CONCURRENCY,
      MAX_COURSE_CONCURRENCY,
    );
    this.settings.chapterConcurrency = clampInteger(
      this.settings.chapterConcurrency,
      MIN_CONCURRENCY,
      MAX_CHAPTER_CONCURRENCY,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
      this.progressFillEl.style.width = `${safePercent}%`;
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
      this.progressFillEl.style.width = "0%";
    }
    this.progressNotice?.hide();
    this.progressNotice = undefined;
  }

  finishProgress(label: string): void {
    this.showProgress(label, 100);
    window.setTimeout(() => this.hideProgress(), 5000);
  }

  /* ================= API CALLS ================= */

  async callLLM(prompt: string, model: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
      try {
        return await this.callLLMOnce(prompt, model);
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

  async callLLMOnce(prompt: string, model: string): Promise<string> {
    const res = await requestUrl({
      url: `${this.settings.apiBaseUrl}/chat/completions`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.settings.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (res.status < 200 || res.status >= 300) {
      throw new ApiError(`API Error: ${res.status} - ${res.text}`, res.status);
    }

    const data = res.json;
    return data.choices[0].message.content;
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
  ): Promise<string> {
    try {
      const prompt = buildChapterPrompt(
        courseName,
        chapterName,
        this.settings.language,
      );
      return await this.callLLM(prompt, this.settings.modelChapter);
    } catch (error) {
      console.error(`Error fetching chapter note for ${chapterName}:`, error);
      throw error;
    }
  }

  /* ================= CORE GENERATION LOGIC ================= */

  async generateChapterContent(
    courseFolder: TFolder,
    chapterInfo: [string, string],
    courseName: string,
    sem: Semaphore,
    onComplete?: (result: ChapterGenerationResult) => void,
  ): Promise<ChapterGenerationResult> {
    const [chapterNum, title] = chapterInfo;

    return await sem.run(async () => {
      let result: ChapterGenerationResult;
      try {
        // 生成章節知識點
        const chapterContent = await this.fetchChapterNote(courseName, title);

        // 創建文件名
        const numStr = String(parseInt(chapterNum)).padStart(2, "0");
        const slug = slugifyTitle(title);
        const fileName = `${numStr}_${slug}.md`;

        // 生成文件內容
        const headerText = getHeaderText(this.settings.language);
        const header = `# ${title}\n\n*${headerText.chapterNumber}: ${chapterNum}*\n\n*${headerText.generated}*\n\n---\n\n`;
        const fullContent = header + chapterContent;

        // 寫入文件
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
        const errorMsg = error instanceof Error ? error.message : String(error);
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
    failedChapters: ChapterGenerationResult[],
  ): Promise<void> {
    if (failedChapters.length === 0) {
      return;
    }

    const content = [
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
      new Notice("❌ API Key not set! Please configure it in settings.");
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
            updateProgress,
          ),
        ),
      );

      const failedResults = results.filter((result) => !result.success);
      const successCount = results.length - failedResults.length;

      if (failedResults.length > 0) {
        await this.writeFailureReport(courseFolder, courseFolder.path, failedResults);
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
      const errorMsg = error instanceof Error ? error.message : String(error);
      new Notice(`❌ Resume failed: ${errorMsg}`, 7000);
      this.finishProgress(`Resume failed: ${errorMsg}`);
      console.error("Resume generation error:", error);
    }
  }

  async generate(courseName: string) {
    if (!this.settings.apiKey) {
      new Notice("❌ API Key not set! Please configure it in settings.");
      return;
    }

    new Notice(`📚 Generating: ${courseName}`);
    this.showProgress(`Starting ${courseName}`, 1);

    try {
      // 1. 生成大綱
      this.showProgress(`Generating outline: ${courseName}`, 5);
      new Notice("⏳ Generating outline...");
      const outline = await this.fetchOutline(courseName);

      // 2. 創建課程資料夾
      const folderPath = normalizePath(courseName);
      let courseFolder: TFolder;

      const existing = this.app.vault.getAbstractFileByPath(folderPath);

      if (existing instanceof TFolder) {
        // 文件夾已存在，直接使用
        courseFolder = existing;
        new Notice(`📁 Using existing folder: ${courseName}`);
      } else if (existing) {
        // 同名文件存在，不能使用
        const errorMsg = `Path "${folderPath}" exists as a file, not a folder. Please rename or delete it manually.`;
        new Notice(`❌ ${errorMsg}`, 7000);
        throw new Error(errorMsg);
      } else {
        // 文件夾不存在，創建新的
        try {
          courseFolder = await this.app.vault.createFolder(folderPath);
          new Notice(`📁 Created folder: ${courseName}`);
        } catch (error) {
          throw new Error(`Failed to create folder "${folderPath}": ${error}`);
        }
      }

      // 3. 寫入大綱文件
      const headerText = getHeaderText(this.settings.language);
      const outlineContent = `# ${courseName} ${headerText.outlineTitle}\n\n*${headerText.generatedAt}: ${new Date().toLocaleString()}*\n\n${outline}`;
      const outlineFilePath = normalizePath(`${courseFolder.path}/Outlines.md`);
      await this.app.vault.create(outlineFilePath, outlineContent);
      this.showProgress(`Outline saved: ${courseName}`, 15);

      new Notice("✓ Outlines.md created");

      // 4. 解析章節標題
      const chapters = parseChapterTitles(outline);

      if (chapters.length === 0) {
        new Notice("⚠️ No chapters found in outline");
        this.finishProgress("No chapters found");
        return;
      }

      new Notice(`📖 Found ${chapters.length} chapters, generating content...`);
      this.showProgress(`0/${chapters.length} chapters generated`, 15);

      // 5. 並發生成章節知識點
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
          updateChapterProgress,
        ),
      );

      const results = await Promise.all(tasks);
      const failedResults = results.filter((result) => !result.success);
      await this.writeFailureReport(courseFolder, courseName, failedResults);

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
      const errorMsg = error instanceof Error ? error.message : String(error);
      new Notice(`❌ Error: ${errorMsg}`, 5000);
      this.finishProgress(`Failed: ${errorMsg}`);
      console.error("Generation error:", error);
    }
  }
}

/* ================= INPUT MODAL ================= */

class InputModal extends Modal {
  plugin: KnowledgePlugin;

  constructor(app: App, plugin: KnowledgePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("knowledge-input-modal");

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Enter subject (e.g. Signal Processing)",
    });

    const button = contentEl.createEl("button", {
      text: "Generate",
    });

    button.onclick = async () => {
      const subject = input.value.trim();
      if (!subject) {
        new Notice("Please enter a subject name");
        return;
      }
      this.close();
      void this.plugin.generate(subject);
    };

    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        button.click();
      }
    });
  }
}

class ResumeFailedModal extends Modal {
  plugin: KnowledgePlugin;
  initialCourseName: string;

  constructor(app: App, plugin: KnowledgePlugin, initialCourseName: string) {
    super(app);
    this.plugin = plugin;
    this.initialCourseName = initialCourseName;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("knowledge-input-modal");

    contentEl.createEl("p", {
      cls: "knowledge-modal-help",
      text: "Resume chapters listed in Failed_Chapters.md for a subject folder.",
    });

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Subject folder (e.g. Signal Processing)",
      value: this.initialCourseName,
    });

    const button = contentEl.createEl("button", {
      text: "Resume failed chapters",
    });

    button.onclick = async () => {
      const subject = input.value.trim();
      if (!subject) {
        new Notice("Please enter a subject folder name");
        return;
      }

      this.close();
      void this.plugin.resumeFailedChapters(subject);
    };

    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        button.click();
      }
    });
  }
}

/* ================= SETTINGS TAB ================= */

class SettingTab extends PluginSettingTab {
  plugin: KnowledgePlugin;

  constructor(app: App, plugin: KnowledgePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("knowledge-settings");

    containerEl.createEl("h2", { text: "Knowledge Overview Settings" });

    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Your OpenAI API key (keep it secret)")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("API Base URL")
      .setDesc("API base URL (default: https://api.openai.com/v1)")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.apiBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.apiBaseUrl = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Outline Model")
      .setDesc("LLM model for generating course outlines")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.modelOutline)
          .onChange(async (value) => {
            this.plugin.settings.modelOutline = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Chapter Model")
      .setDesc("LLM model for generating chapter details")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.modelChapter)
          .onChange(async (value) => {
            this.plugin.settings.modelChapter = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Concurrency")
      .setDesc(
        "Manual concurrency for course-level API calls. Keep it small by default; use higher values only with a stable provider and sufficient rate limits.",
      )
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = String(MIN_CONCURRENCY);
        text.inputEl.max = String(MAX_COURSE_CONCURRENCY);
        text.inputEl.step = "1";

        return text
          .setPlaceholder(String(DEFAULT_SETTINGS.concurrency))
          .setValue(String(this.plugin.settings.concurrency))
          .onChange(async (value) => {
            this.plugin.settings.concurrency = clampInteger(
              Number(value),
              MIN_CONCURRENCY,
              MAX_COURSE_CONCURRENCY,
            );
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Chapter Concurrency")
      .setDesc(
        "Manual concurrency for chapter generation. Start with 2-3; increase only if your API provider is stable under parallel requests.",
      )
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = String(MIN_CONCURRENCY);
        text.inputEl.max = String(MAX_CHAPTER_CONCURRENCY);
        text.inputEl.step = "1";

        return text
          .setPlaceholder(String(DEFAULT_SETTINGS.chapterConcurrency))
          .setValue(String(this.plugin.settings.chapterConcurrency))
          .onChange(async (value) => {
            this.plugin.settings.chapterConcurrency = clampInteger(
              Number(value),
              MIN_CONCURRENCY,
              MAX_CHAPTER_CONCURRENCY,
            );
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Language")
      .setDesc("Output language preference")
      .addDropdown((dropdown) => {
        Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
          dropdown.addOption(value, label);
        });

        return dropdown
          .setValue(this.plugin.settings.language)
          .onChange(async (v) => {
            this.plugin.settings.language = v;
            await this.plugin.saveSettings();
          });
      });
  }
}
