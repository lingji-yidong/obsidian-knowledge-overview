/* THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY. */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => KnowledgePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  apiKey: "",
  language: "en",
  apiBaseUrl: "https://api.openai.com/v1",
  modelOutline: "gpt-4o-mini",
  modelChapter: "gpt-4o-mini",
  concurrency: 2,
  chapterConcurrency: 3
};
var MIN_CONCURRENCY = 1;
var MAX_COURSE_CONCURRENCY = 10;
var MAX_CHAPTER_CONCURRENCY = 20;
var MAX_API_RETRIES = 2;
var RETRY_BASE_DELAY_MS = 1500;
var LANGUAGE_OPTIONS = {
  en: "English",
  zh: "\u7B80\u4F53\u4E2D\u6587",
  zh_tw: "\u7E41\u9AD4\u4E2D\u6587",
  ja: "\u65E5\u672C\u8A9E",
  ko: "\uD55C\uAD6D\uC5B4",
  vi: "Ti\u1EBFng Vi\u1EC7t",
  th: "\u0E44\u0E17\u0E22",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  hi: "\u0939\u093F\u0928\u094D\u0926\u0940",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
  de: "Deutsch",
  fr: "Fran\xE7ais",
  es: "Espa\xF1ol",
  it: "Italiano",
  pt: "Portugu\xEAs",
  nl: "Nederlands",
  sv: "Svenska",
  pl: "Polski",
  tr: "T\xFCrk\xE7e",
  ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439"
};
function getLanguageLabel(language) {
  var _a;
  return (_a = LANGUAGE_OPTIONS[language]) != null ? _a : language;
}
function buildOutlinePrompt(courseName, language) {
  const targetLanguage = getLanguageLabel(language);
  return `
\u6211\u6B63\u5728\u6E96\u5099\u8AB2\u7A0B\u8907\u7FD2\u548C\u6280\u8853/\u5B78\u8853\u9762\u8A66\uFF0C\u9700\u8981\u4F60\u5E6B\u5FD9\u5217\u51FA\u5927\u5B78\u672C\u79D1\u4EE5\u4E0A\u6C34\u6E96\u7684\u9AD8\u8CEA\u91CF\u63D0\u7DB1\u3002\u7D66\u4F60\u4E00\u500B\u8AB2\u7A0B\u540D\uFF0C\u4F60\u9700\u8981\u8003\u616E\u570B\u969B\u901A\u7528\u6559\u5B78\u4E2D\u9019\u9580\u8AB2\u7684\u4E3B\u8981\u77E5\u8B58\uFF0C\u5305\u62EC\u7D93\u5178\u5167\u5BB9\u548C\u73FE\u4EE3\u767C\u5C55\u3002

\u8F38\u51FA\u8A9E\u8A00\uFF1A${targetLanguage}
\u8853\u8A9E\u8981\u6C42\uFF1A\u4E3B\u8981\u5167\u5BB9\u4F7F\u7528\u300C${targetLanguage}\u300D\u3002\u95DC\u9375\u8853\u8A9E\u8ACB\u7528\u96D9\u8A9E\u5C55\u793A\uFF0C\u683C\u5F0F\u70BA\uFF08English Term, ${targetLanguage} Term\uFF09\uFF0C\u65B9\u4FBF\u8907\u7FD2\u548C\u9762\u8A66\u8868\u9054\u3002

\u8ACB\u6309\u7167\u4EE5\u4E0B\u683C\u5F0F\u8F38\u51FA\uFF1A
1. \u4E00\u7D1A\u7AE0\u7BC0\u6A19\u984C
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09

2. \u4E00\u7D1A\u7AE0\u7BC0\u6A19\u984C
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09

\u8ACB\u78BA\u4FDD\uFF1A
1. \u4E00\u7D1A\u7AE0\u7BC0\u5FC5\u9808\u4F7F\u7528\u6578\u5B57\u7DE8\u865F\uFF081., 2., 3. \u7B49\uFF09
2. \u5B50\u9805\u76EE\u4F7F\u7528\u77ED\u6A6B\u7DDA\uFF08-\uFF09
3. \u8853\u8A9E\u63A1\u7528\u96D9\u8A9E\u5C0D\u7167\u683C\u5F0F\uFF1A\uFF08English Term, ${targetLanguage} Term\uFF09
4. \u5167\u5BB9\u61C9\u8A72\u6DB5\u84CB\u8AB2\u7A0B\u7684\u6838\u5FC3\u6982\u5FF5\u548C\u91CD\u8981\u4E3B\u984C
5. \u4E0D\u8981\u52A0\u5165\u7279\u5B9A\u5BE9\u6838\u6D41\u7A0B\u6216\u7559\u5B78\u7533\u8ACB\u5834\u666F\u7684\u6558\u8FF0\uFF1B\u5167\u5BB9\u61C9\u805A\u7126\u4E00\u822C\u8907\u7FD2\u3001\u77E5\u8B58\u68B3\u7406\u548C\u9762\u8A66\u6E96\u5099

\u8ACB\u70BA\u4EE5\u4E0B\u8AB2\u7A0B\u751F\u6210\u5927\u7DB1\uFF0810-20\u500B\u7AE0\u7BC0\u662F\u53EF\u63A5\u53D7\u7BC4\u570D\uFF09\uFF1A

Course: ${courseName}
`;
}
function buildChapterPrompt(courseName, chapterName, language) {
  const targetLanguage = getLanguageLabel(language);
  return `\u6211\u6B63\u5728\u6E96\u5099\u8AB2\u7A0B\u8907\u7FD2\u548C\u6280\u8853/\u5B78\u8853\u9762\u8A66\uFF0C\u9700\u8981\u8907\u7FD2\u5927\u5B78\u672C\u79D1\u4EE5\u4E0A\u8AB2\u7A0B\u77E5\u8B58\u3002\u672C\u6B21\u8907\u7FD2\u7684\u79D1\u76EE\u662F\u300C${courseName}\u300D\uFF0C\u8ACB\u4F60\u91DD\u5C0D\u6307\u5B9A\u7AE0\u7BC0\u63D0\u4F9B\u6838\u5FC3\u6FC3\u7E2E\u77E5\u8B58\u3001\u9762\u8A66\u5E38\u554F\u89D2\u5EA6\u3001\u53EF\u53E3\u982D\u8868\u9054\u7684\u89E3\u91CB\uFF0C\u4EE5\u53CA\u4F8B\u5B50\u8AAA\u660E\u5BE6\u969B\u61C9\u7528\u3002

\u8F38\u51FA\u8A9E\u8A00\uFF1A${targetLanguage}
\u8853\u8A9E\u8981\u6C42\uFF1A\u4E3B\u8981\u5167\u5BB9\u4F7F\u7528\u300C${targetLanguage}\u300D\u3002\u95DC\u9375\u8853\u8A9E\u8ACB\u63D0\u4F9B\uFF08English Term, ${targetLanguage} Term\uFF09\u96D9\u8A9E\u5C0D\u7167\uFF0C\u65B9\u4FBF\u9762\u8A66\u6642\u5207\u63DB\u8868\u9054\u3002

\u8ACB\u70BA\u4EE5\u4E0B\u7AE0\u7BC0\u751F\u6210\u8A73\u7D30\u7684\u77E5\u8B58\u9EDE\uFF1A${chapterName}

\u8981\u6C42\uFF1A
1. \u6DB5\u84CB\u8A72\u7AE0\u7BC0\u7684\u6838\u5FC3\u6982\u5FF5\u548C\u91CD\u8981\u5B9A\u7406
2. \u88DC\u5145\u9762\u8A66\u5E38\u554F\u554F\u984C\u3001\u8FFD\u554F\u65B9\u5411\u548C\u7C21\u6F54\u56DE\u7B54\u8981\u9EDE
3. \u63D0\u4F9B\u5177\u9AD4\u4F8B\u5B50\u548C\u5BE6\u969B\u61C9\u7528
4. \u95DC\u9375\u8853\u8A9E\u63D0\u4F9B\u82F1\u6587\u8207\u76EE\u6A19\u8A9E\u8A00\u5C0D\u7167
5. \u5C0D\u5BB9\u6613\u6DF7\u6DC6\u7684\u6982\u5FF5\u505A\u5C0D\u6BD4\u8AAA\u660E
6. \u516C\u5F0F\u4F7F\u7528 $$...$$ \u683C\u5F0F\uFF0C\u517C\u5BB9 Obsidian \u5167\u5EFA KaTeX
7. \u5167\u5BB9\u7D50\u69CB\u6E05\u6670\uFF0C\u4FBF\u65BC\u8907\u7FD2\u8A18\u61B6\u548C\u9762\u8A66\u524D\u5FEB\u901F\u700F\u89BD
8. \u4E0D\u8981\u52A0\u5165\u7279\u5B9A\u5BE9\u6838\u6D41\u7A0B\u6216\u7559\u5B78\u7533\u8ACB\u5834\u666F\u7684\u6558\u8FF0
`;
}
var HEADER_TEXT = {
  en: {
    outlineTitle: "Outline",
    generatedAt: "Generated at",
    chapterNumber: "Chapter",
    generated: "Auto-generated review and interview notes. Edit freely."
  },
  zh: {
    outlineTitle: "\u5927\u7DB1",
    generatedAt: "\u81EA\u52D5\u751F\u6210\u6642\u9593",
    chapterNumber: "\u7AE0\u7BC0\u7DE8\u865F",
    generated: "\u81EA\u52D5\u751F\u6210\u7684\u8907\u7FD2/\u9762\u8A66\u77E5\u8B58\u9EDE\uFF0C\u53EF\u81EA\u7531\u7DE8\u8F2F\u88DC\u5145"
  },
  zh_tw: {
    outlineTitle: "\u5927\u7DB1",
    generatedAt: "\u81EA\u52D5\u751F\u6210\u6642\u9593",
    chapterNumber: "\u7AE0\u7BC0\u7DE8\u865F",
    generated: "\u81EA\u52D5\u751F\u6210\u7684\u8907\u7FD2/\u9762\u8A66\u77E5\u8B58\u9EDE\uFF0C\u53EF\u81EA\u7531\u7DE8\u8F2F\u88DC\u5145"
  }
};
function getHeaderText(language) {
  var _a;
  return (_a = HEADER_TEXT[language]) != null ? _a : HEADER_TEXT.en;
}
function clampInteger(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(Math.floor(value), min), max);
}
function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}
var ApiError = class extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
};
function slugifyTitle(title) {
  let safe = title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  return safe.replace(/\s+/g, "_") || "chapter";
}
function parseChapterTitles(outline) {
  const lines = outline.split("\n");
  const chapters = [];
  const chapterPattern = /^\s*(\d+)\.\s*(.+?)(?:\s*$)/;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed)
      continue;
    const match = trimmed.match(chapterPattern);
    if (match) {
      const chapterNum = match[1];
      let title = match[2].trim();
      title = title.replace(/[：:]+$/, "").trim();
      if (title) {
        chapters.push([chapterNum, title]);
      }
    }
  }
  return chapters;
}
function parseFailedChapters(report) {
  const chapters = [];
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
var Semaphore = class {
  constructor(permits) {
    this.queue = [];
    this.permits = permits;
  }
  async acquire() {
    if (this.permits > 0) {
      this.permits--;
    } else {
      await new Promise((resolve) => {
        this.queue.push(resolve);
      });
    }
  }
  release() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve == null ? void 0 : resolve();
    } else {
      this.permits++;
    }
  }
  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
};
var KnowledgePlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.setupProgressStatus();
    this.addCommand({
      id: "generate-knowledge",
      name: "Generate Knowledge Overview",
      callback: () => {
        new InputModal(this.app, this).open();
      }
    });
    this.addCommand({
      id: "resume-failed-chapters",
      name: "Resume Failed Chapter Generation",
      callback: () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      }
    });
    const ribbonIcon = this.addRibbonIcon(
      "book-open",
      "Generate Knowledge Overview",
      () => {
        new InputModal(this.app, this).open();
      }
    );
    ribbonIcon.addClass("knowledge-ribbon-icon");
    const resumeRibbonIcon = this.addRibbonIcon(
      "refresh-cw",
      "Resume Failed Chapter Generation",
      () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      }
    );
    resumeRibbonIcon.addClass("knowledge-ribbon-icon");
    this.addSettingTab(new SettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.concurrency = clampInteger(
      this.settings.concurrency,
      MIN_CONCURRENCY,
      MAX_COURSE_CONCURRENCY
    );
    this.settings.chapterConcurrency = clampInteger(
      this.settings.chapterConcurrency,
      MIN_CONCURRENCY,
      MAX_CHAPTER_CONCURRENCY
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  getActiveCourseName() {
    var _a, _b;
    const activeFile = this.app.workspace.getActiveFile();
    return (_b = (_a = activeFile == null ? void 0 : activeFile.parent) == null ? void 0 : _a.path) != null ? _b : "";
  }
  setupProgressStatus() {
    this.progressStatusEl = this.addStatusBarItem();
    this.progressStatusEl.addClass("knowledge-progress-status");
    if (import_obsidian.Platform.isMobile) {
      this.progressStatusEl.addClass("knowledge-progress-mobile");
    }
    this.progressStatusEl.empty();
    this.progressLabelEl = this.progressStatusEl.createSpan({
      cls: "knowledge-progress-label"
    });
    const track = this.progressStatusEl.createDiv({
      cls: "knowledge-progress-track"
    });
    this.progressFillEl = track.createDiv({
      cls: "knowledge-progress-fill"
    });
    this.hideProgress();
  }
  showProgress(label, percent) {
    const safePercent = clampInteger(percent, 0, 100);
    const message = `${label} (${safePercent}%)`;
    if (this.progressStatusEl && this.progressLabelEl && this.progressFillEl) {
      this.progressStatusEl.removeClass("knowledge-progress-hidden");
      this.progressLabelEl.setText(label);
      this.progressFillEl.style.width = `${safePercent}%`;
    }
    if (!this.progressNotice) {
      this.progressNotice = new import_obsidian.Notice(message, 0);
      this.progressNotice.containerEl.addClass("knowledge-progress-notice");
    } else {
      this.progressNotice.setMessage(message);
    }
  }
  hideProgress() {
    var _a, _b;
    (_a = this.progressStatusEl) == null ? void 0 : _a.addClass("knowledge-progress-hidden");
    if (this.progressFillEl) {
      this.progressFillEl.style.width = "0%";
    }
    (_b = this.progressNotice) == null ? void 0 : _b.hide();
    this.progressNotice = void 0;
  }
  finishProgress(label) {
    this.showProgress(label, 100);
    window.setTimeout(() => this.hideProgress(), 5e3);
  }
  /* ================= API CALLS ================= */
  async callLLM(prompt, model) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
      try {
        return await this.callLLMOnce(prompt, model);
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === MAX_API_RETRIES;
        const status = error instanceof ApiError ? error.status : void 0;
        const retryable = status === void 0 || isRetryableStatus(status);
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
  async callLLMOnce(prompt, model) {
    const res = await (0, import_obsidian.requestUrl)({
      url: `${this.settings.apiBaseUrl}/chat/completions`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.settings.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (res.status < 200 || res.status >= 300) {
      throw new ApiError(`API Error: ${res.status} - ${res.text}`, res.status);
    }
    const data = res.json;
    return data.choices[0].message.content;
  }
  async fetchOutline(courseName) {
    try {
      const prompt = buildOutlinePrompt(courseName, this.settings.language);
      return await this.callLLM(prompt, this.settings.modelOutline);
    } catch (error) {
      console.error(`Error fetching outline for ${courseName}:`, error);
      throw error;
    }
  }
  async fetchChapterNote(courseName, chapterName) {
    try {
      const prompt = buildChapterPrompt(
        courseName,
        chapterName,
        this.settings.language
      );
      return await this.callLLM(prompt, this.settings.modelChapter);
    } catch (error) {
      console.error(`Error fetching chapter note for ${chapterName}:`, error);
      throw error;
    }
  }
  /* ================= CORE GENERATION LOGIC ================= */
  async generateChapterContent(courseFolder, chapterInfo, courseName, sem, onComplete) {
    const [chapterNum, title] = chapterInfo;
    return await sem.run(async () => {
      let result;
      try {
        const chapterContent = await this.fetchChapterNote(courseName, title);
        const numStr = String(parseInt(chapterNum)).padStart(2, "0");
        const slug = slugifyTitle(title);
        const fileName = `${numStr}_${slug}.md`;
        const headerText = getHeaderText(this.settings.language);
        const header = `# ${title}

*${headerText.chapterNumber}: ${chapterNum}*

*${headerText.generated}*

---

`;
        const fullContent = header + chapterContent;
        const filePath = (0, import_obsidian.normalizePath)(`${courseFolder.path}/${fileName}`);
        const existing = this.app.vault.getAbstractFileByPath(filePath);
        if (existing instanceof import_obsidian.TFile) {
          await this.app.vault.modify(existing, fullContent);
        } else if (existing) {
          throw new Error(`Path "${filePath}" exists and is not a file`);
        } else {
          await this.app.vault.create(filePath, fullContent);
        }
        new import_obsidian.Notice(`\u2713 ${fileName}`);
        result = {
          chapterNum,
          title,
          fileName,
          success: true
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        new import_obsidian.Notice(
          `\u2717 Error generating chapter ${chapterNum}: ${errorMsg}`,
          5e3
        );
        console.error(
          `Error generating chapter ${chapterNum} (${title}):`,
          error
        );
        result = {
          chapterNum,
          title,
          success: false,
          error: errorMsg
        };
      } finally {
        onComplete == null ? void 0 : onComplete(result);
      }
      return result;
    });
  }
  async writeFailureReport(courseFolder, courseName, failedChapters) {
    if (failedChapters.length === 0) {
      return;
    }
    const content = [
      `# ${courseName} Failed Chapters`,
      "",
      `Generated at: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
      "",
      "The plugin retried transient API failures before writing this report.",
      "You can run generation again later after lowering concurrency or switching to a more stable provider.",
      "",
      ...failedChapters.reduce((lines, chapter) => {
        var _a;
        lines.push(`- ${chapter.chapterNum}. ${chapter.title}`);
        lines.push(`  - Error: ${(_a = chapter.error) != null ? _a : "Unknown error"}`);
        return lines;
      }, []),
      ""
    ].join("\n");
    const reportPath = (0, import_obsidian.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    if (existing instanceof import_obsidian.TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(reportPath, content);
    }
  }
  async clearFailureReport(courseFolder, courseName) {
    const reportPath = (0, import_obsidian.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    const content = [
      `# ${courseName} Failed Chapters`,
      "",
      `Resolved at: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
      "",
      "All previously failed chapters were generated successfully.",
      ""
    ].join("\n");
    if (existing instanceof import_obsidian.TFile) {
      await this.app.vault.modify(existing, content);
    }
  }
  async resumeFailedChapters(courseName) {
    if (!this.settings.apiKey) {
      new import_obsidian.Notice("\u274C API Key not set! Please configure it in settings.");
      return;
    }
    const folderPath = (0, import_obsidian.normalizePath)(courseName.trim());
    if (!folderPath) {
      new import_obsidian.Notice("Please enter a subject folder name");
      return;
    }
    const courseFolder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(courseFolder instanceof import_obsidian.TFolder)) {
      new import_obsidian.Notice(`\u274C Folder not found: ${folderPath}`, 7e3);
      return;
    }
    const reportPath = (0, import_obsidian.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
    if (!(reportFile instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`No Failed_Chapters.md found in ${courseFolder.path}`, 7e3);
      return;
    }
    const report = await this.app.vault.read(reportFile);
    const chapters = parseFailedChapters(report);
    if (chapters.length === 0) {
      new import_obsidian.Notice("No failed chapters found to resume");
      this.finishProgress("No failed chapters found");
      return;
    }
    new import_obsidian.Notice(`\u{1F501} Resuming ${chapters.length} failed chapters`);
    this.showProgress(`Resuming failed chapters: 0/${chapters.length}`, 5);
    try {
      const chapterSem = new Semaphore(this.settings.chapterConcurrency);
      let completedChapters = 0;
      let failedChapters = 0;
      const updateProgress = (result) => {
        completedChapters += 1;
        if (!result.success) {
          failedChapters += 1;
        }
        const percent = 5 + Math.round(completedChapters / chapters.length * 90);
        this.showProgress(
          `Resumed ${completedChapters}/${chapters.length}, ${failedChapters} failed`,
          percent
        );
      };
      const results = await Promise.all(
        chapters.map(
          (chapterInfo) => this.generateChapterContent(
            courseFolder,
            chapterInfo,
            courseFolder.path,
            chapterSem,
            updateProgress
          )
        )
      );
      const failedResults = results.filter((result) => !result.success);
      const successCount = results.length - failedResults.length;
      if (failedResults.length > 0) {
        await this.writeFailureReport(courseFolder, courseFolder.path, failedResults);
        new import_obsidian.Notice(
          `\u26A0\uFE0F Resume finished: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          1e4
        );
        this.finishProgress(
          `Resume finished: ${successCount}/${chapters.length} generated, ${failedResults.length} failed`
        );
      } else {
        await this.clearFailureReport(courseFolder, courseFolder.path);
        new import_obsidian.Notice(`\u2705 Resume complete: ${chapters.length} chapters generated`);
        this.finishProgress(`Resume complete: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      new import_obsidian.Notice(`\u274C Resume failed: ${errorMsg}`, 7e3);
      this.finishProgress(`Resume failed: ${errorMsg}`);
      console.error("Resume generation error:", error);
    }
  }
  async generate(courseName) {
    if (!this.settings.apiKey) {
      new import_obsidian.Notice("\u274C API Key not set! Please configure it in settings.");
      return;
    }
    new import_obsidian.Notice(`\u{1F4DA} Generating: ${courseName}`);
    this.showProgress(`Starting ${courseName}`, 1);
    try {
      this.showProgress(`Generating outline: ${courseName}`, 5);
      new import_obsidian.Notice("\u23F3 Generating outline...");
      const outline = await this.fetchOutline(courseName);
      const folderPath = (0, import_obsidian.normalizePath)(courseName);
      let courseFolder;
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      if (existing instanceof import_obsidian.TFolder) {
        courseFolder = existing;
        new import_obsidian.Notice(`\u{1F4C1} Using existing folder: ${courseName}`);
      } else if (existing) {
        const errorMsg = `Path "${folderPath}" exists as a file, not a folder. Please rename or delete it manually.`;
        new import_obsidian.Notice(`\u274C ${errorMsg}`, 7e3);
        throw new Error(errorMsg);
      } else {
        try {
          courseFolder = await this.app.vault.createFolder(folderPath);
          new import_obsidian.Notice(`\u{1F4C1} Created folder: ${courseName}`);
        } catch (error) {
          throw new Error(`Failed to create folder "${folderPath}": ${error}`);
        }
      }
      const headerText = getHeaderText(this.settings.language);
      const outlineContent = `# ${courseName} ${headerText.outlineTitle}

*${headerText.generatedAt}: ${(/* @__PURE__ */ new Date()).toLocaleString()}*

${outline}`;
      const outlineFilePath = (0, import_obsidian.normalizePath)(`${courseFolder.path}/Outlines.md`);
      await this.app.vault.create(outlineFilePath, outlineContent);
      this.showProgress(`Outline saved: ${courseName}`, 15);
      new import_obsidian.Notice("\u2713 Outlines.md created");
      const chapters = parseChapterTitles(outline);
      if (chapters.length === 0) {
        new import_obsidian.Notice("\u26A0\uFE0F No chapters found in outline");
        this.finishProgress("No chapters found");
        return;
      }
      new import_obsidian.Notice(`\u{1F4D6} Found ${chapters.length} chapters, generating content...`);
      this.showProgress(`0/${chapters.length} chapters generated`, 15);
      const chapterSem = new Semaphore(this.settings.chapterConcurrency);
      let completedChapters = 0;
      let failedChapters = 0;
      const updateChapterProgress = (result) => {
        completedChapters += 1;
        if (!result.success) {
          failedChapters += 1;
        }
        const percent = 15 + Math.round(completedChapters / chapters.length * 80);
        this.showProgress(
          `${completedChapters}/${chapters.length} chapters done, ${failedChapters} failed`,
          percent
        );
      };
      const tasks = chapters.map(
        (chapterInfo) => this.generateChapterContent(
          courseFolder,
          chapterInfo,
          courseName,
          chapterSem,
          updateChapterProgress
        )
      );
      const results = await Promise.all(tasks);
      const failedResults = results.filter((result) => !result.success);
      await this.writeFailureReport(courseFolder, courseName, failedResults);
      const successCount = results.length - failedResults.length;
      if (failedResults.length > 0) {
        new import_obsidian.Notice(
          `\u26A0\uFE0F Done with failures: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          1e4
        );
        this.finishProgress(
          `Done: ${successCount}/${chapters.length} chapters generated, ${failedResults.length} failed`
        );
      } else {
        await this.clearFailureReport(courseFolder, courseName);
        new import_obsidian.Notice(
          `\u2705 Done! Generated ${chapters.length} chapters for ${courseName}`
        );
        this.finishProgress(`Done: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      new import_obsidian.Notice(`\u274C Error: ${errorMsg}`, 5e3);
      this.finishProgress(`Failed: ${errorMsg}`);
      console.error("Generation error:", error);
    }
  }
};
var InputModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("knowledge-input-modal");
    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Enter subject (e.g. Signal Processing)"
    });
    const button = contentEl.createEl("button", {
      text: "Generate"
    });
    button.onclick = async () => {
      const subject = input.value.trim();
      if (!subject) {
        new import_obsidian.Notice("Please enter a subject name");
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
};
var ResumeFailedModal = class extends import_obsidian.Modal {
  constructor(app, plugin, initialCourseName) {
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
      text: "Resume chapters listed in Failed_Chapters.md for a subject folder."
    });
    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Subject folder (e.g. Signal Processing)",
      value: this.initialCourseName
    });
    const button = contentEl.createEl("button", {
      text: "Resume failed chapters"
    });
    button.onclick = async () => {
      const subject = input.value.trim();
      if (!subject) {
        new import_obsidian.Notice("Please enter a subject folder name");
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
};
var SettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("knowledge-settings");
    containerEl.createEl("h2", { text: "Knowledge Overview Settings" });
    new import_obsidian.Setting(containerEl).setName("OpenAI API Key").setDesc("Your OpenAI API key (keep it secret)").addText(
      (text) => text.setPlaceholder("sk-...").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("API Base URL").setDesc("API base URL (default: https://api.openai.com/v1)").addText(
      (text) => text.setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
        this.plugin.settings.apiBaseUrl = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Outline Model").setDesc("LLM model for generating course outlines").addText(
      (text) => text.setValue(this.plugin.settings.modelOutline).onChange(async (value) => {
        this.plugin.settings.modelOutline = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Chapter Model").setDesc("LLM model for generating chapter details").addText(
      (text) => text.setValue(this.plugin.settings.modelChapter).onChange(async (value) => {
        this.plugin.settings.modelChapter = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Concurrency").setDesc(
      "Manual concurrency for course-level API calls. Keep it small by default; use higher values only with a stable provider and sufficient rate limits."
    ).addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = String(MIN_CONCURRENCY);
      text.inputEl.max = String(MAX_COURSE_CONCURRENCY);
      text.inputEl.step = "1";
      return text.setPlaceholder(String(DEFAULT_SETTINGS.concurrency)).setValue(String(this.plugin.settings.concurrency)).onChange(async (value) => {
        this.plugin.settings.concurrency = clampInteger(
          Number(value),
          MIN_CONCURRENCY,
          MAX_COURSE_CONCURRENCY
        );
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Chapter Concurrency").setDesc(
      "Manual concurrency for chapter generation. Start with 2-3; increase only if your API provider is stable under parallel requests."
    ).addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = String(MIN_CONCURRENCY);
      text.inputEl.max = String(MAX_CHAPTER_CONCURRENCY);
      text.inputEl.step = "1";
      return text.setPlaceholder(String(DEFAULT_SETTINGS.chapterConcurrency)).setValue(String(this.plugin.settings.chapterConcurrency)).onChange(async (value) => {
        this.plugin.settings.chapterConcurrency = clampInteger(
          Number(value),
          MIN_CONCURRENCY,
          MAX_CHAPTER_CONCURRENCY
        );
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Language").setDesc("Output language preference").addDropdown((dropdown) => {
      Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
        dropdown.addOption(value, label);
      });
      return dropdown.setValue(this.plugin.settings.language).onChange(async (v) => {
        this.plugin.settings.language = v;
        await this.plugin.saveSettings();
      });
    });
  }
};
