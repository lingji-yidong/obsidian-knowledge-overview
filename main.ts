import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
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
  modelOutline: "gpt-4o-mini",
  modelChapter: "gpt-4o-mini",
  concurrency: 2,
  chapterConcurrency: 3,
};

const MIN_CONCURRENCY = 1;
const MAX_COURSE_CONCURRENCY = 10;
const MAX_CHAPTER_CONCURRENCY = 20;

/* ================= PROMPTS ================= */

const LANGUAGE_OPTIONS: Record<string, string> = {
  en: "English",
  zh: "中文",
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
我正在準備課程複習和技術/學術面試，需要你幫忙列出大學本科以上水準的高質量提綱。給你一個課程名，你需要考慮國際通用教學中這門課的主要知識，包括經典內容和現代發展。

輸出語言：${targetLanguage}
術語要求：主要內容使用「${targetLanguage}」。關鍵術語請用雙語展示，格式為（English Term, ${targetLanguage} Term），方便複習和面試表達。

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
4. 內容應該涵蓋課程的核心概念和重要主題
5. 不要加入特定審核流程或留學申請場景的敘述；內容應聚焦一般複習、知識梳理和面試準備

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

  return `我正在準備課程複習和技術/學術面試，需要複習大學本科以上課程知識。本次複習的科目是「${courseName}」，請你針對指定章節提供核心濃縮知識、面試常問角度、可口頭表達的解釋，以及例子說明實際應用。

輸出語言：${targetLanguage}
術語要求：主要內容使用「${targetLanguage}」。關鍵術語請提供（English Term, ${targetLanguage} Term）雙語對照，方便面試時切換表達。

請為以下章節生成詳細的知識點：${chapterName}

要求：
1. 涵蓋該章節的核心概念和重要定理
2. 補充面試常問問題、追問方向和簡潔回答要點
3. 提供具體例子和實際應用
4. 關鍵術語提供英文與目標語言對照
5. 對容易混淆的概念做對比說明
6. 公式使用 $$...$$ 格式，兼容 Obsidian 內建 KaTeX
7. 內容結構清晰，便於複習記憶和面試前快速瀏覽
8. 不要加入特定審核流程或留學申請場景的敘述
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

  setupProgressStatus(): void {
    this.progressStatusEl = this.addStatusBarItem();
    this.progressStatusEl.addClass("knowledge-progress-status");
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
    if (!this.progressStatusEl || !this.progressLabelEl || !this.progressFillEl) {
      return;
    }

    const safePercent = clampInteger(percent, 0, 100);
    this.progressStatusEl.removeClass("knowledge-progress-hidden");
    this.progressLabelEl.setText(label);
    this.progressFillEl.style.width = `${safePercent}%`;
  }

  hideProgress(): void {
    this.progressStatusEl?.addClass("knowledge-progress-hidden");
    if (this.progressFillEl) {
      this.progressFillEl.style.width = "0%";
    }
  }

  finishProgress(label: string): void {
    this.showProgress(label, 100);
    window.setTimeout(() => this.hideProgress(), 5000);
  }

  /* ================= API CALLS ================= */

  async callLLM(prompt: string, model: string): Promise<string> {
    const res = await fetch(`${this.settings.apiBaseUrl}/chat/completions`, {
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

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`API Error: ${res.status} - ${error}`);
    }

    const data = await res.json();
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
    onComplete?: () => void,
  ): Promise<void> {
    const [chapterNum, title] = chapterInfo;

    await sem.run(async () => {
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
        await this.app.vault.create(filePath, fullContent);

        new Notice(`✓ ${fileName}`);
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
      } finally {
        onComplete?.();
      }
    });
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
      const updateChapterProgress = () => {
        completedChapters += 1;
        const percent = 15 + Math.round((completedChapters / chapters.length) * 80);
        this.showProgress(
          `${completedChapters}/${chapters.length} chapters generated`,
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

      await Promise.all(tasks);

      new Notice(
        `✅ Done! Generated ${chapters.length} chapters for ${courseName}`,
      );
      this.finishProgress(`Done: ${chapters.length} chapters generated`);
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
