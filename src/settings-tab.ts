import { App, PluginSettingTab, Setting } from "obsidian";
import { LANGUAGE_OPTIONS } from "./i18n";
import {
  DEFAULT_SETTINGS,
  MAX_CHAPTER_CONCURRENCY,
  MAX_COURSE_CONCURRENCY,
  MIN_CONCURRENCY,
} from "./settings";
import { clampInteger, parseOptionalPositiveInteger } from "./utils";
import type KnowledgePlugin from "./plugin";

export class SettingTab extends PluginSettingTab {
  plugin: KnowledgePlugin;

  constructor(app: App, plugin: KnowledgePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("knowledge-settings");

    new Setting(containerEl)
      .setName("API key")
      .setDesc("Your provider API key. The default endpoint uses Google's OpenAI-compatible Gemini API.")
      .addText((text) =>
        text
          .setPlaceholder("API key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("API base URL")
      .setDesc(
        `OpenAI-compatible API base URL. Default: ${DEFAULT_SETTINGS.apiBaseUrl}`,
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.apiBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.apiBaseUrl = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Outline model")
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
      .setName("Chapter model")
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
      .setName("Max completion tokens")
      .setDesc(
        "Optional output token limit passed as max_completion_tokens. Leave empty to omit it; set a larger value if your provider truncates long chapters.",
      )
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.step = "1";

        return text
          .setPlaceholder("None")
          .setValue(
            this.plugin.settings.maxCompletionTokens === null
              ? ""
              : String(this.plugin.settings.maxCompletionTokens),
          )
          .onChange(async (value) => {
            this.plugin.settings.maxCompletionTokens =
              parseOptionalPositiveInteger(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Concurrency")
      .setDesc(
        "Manual concurrency for course-level API calls. Default is 1 for stability on free or rate-limited providers.",
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
      .setName("Chapter concurrency")
      .setDesc(
        "Manual concurrency for chapter generation. Default is 1; increase only if your provider is stable under parallel requests.",
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
            this.plugin.refreshLocalizedUi();
          });
      });
  }
}
