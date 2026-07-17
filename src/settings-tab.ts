import { App, PluginSettingTab, Setting } from "obsidian";
import {
  getDefaultLabel,
  getSettingDescriptionText,
  LANGUAGE_OPTIONS,
} from "./i18n";
import {
  DEFAULT_SETTINGS,
  MAX_CHAPTER_CONCURRENCY,
  MIN_CONCURRENCY,
} from "./settings";
import { clampInteger, parseOptionalPositiveInteger } from "./utils";
import type KnowledgePlugin from "./plugin";
import type { KnowledgeType } from "./instructionalTypes";

const KNOWLEDGE_TYPE_OPTIONS: Record<KnowledgeType | "auto", string> = {
  auto: "Auto",
  conceptual: "Conceptual",
  mathematical: "Mathematical",
  procedural: "Procedural",
  empirical: "Empirical / research",
  craft: "Craft / technique",
  historical: "Historical / cultural",
  hybrid: "Hybrid",
};

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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
    const settingDescriptions = getSettingDescriptionText(
      this.plugin.settings.language,
    );
    const defaultLabel = getDefaultLabel(this.plugin.settings.language);

    new Setting(containerEl)
      .setName("API key")
      .setDesc(settingDescriptions.apiKey)
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
        `${settingDescriptions.apiBaseUrl} ${defaultLabel}: ${DEFAULT_SETTINGS.apiBaseUrl}`,
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
      .setDesc(settingDescriptions.outlineModel)
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
      .setDesc(settingDescriptions.chapterModel)
      .addText((text) =>
        text
          .setValue(this.plugin.settings.modelChapter)
          .onChange(async (value) => {
            this.plugin.settings.modelChapter = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Knowledge type")
      .setDesc(settingDescriptions.knowledgeType)
      .addDropdown((dropdown) => {
        Object.entries(KNOWLEDGE_TYPE_OPTIONS).forEach(([value, label]) => {
          dropdown.addOption(value, label);
        });

        return dropdown
          .setValue(this.plugin.settings.knowledgeTypeOverride)
          .onChange(async (value) => {
            this.plugin.settings.knowledgeTypeOverride = value as
              | KnowledgeType
              | "auto";
            this.plugin.settings.autoDetectKnowledgeType = value === "auto";
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Minimum chapter characters")
      .setDesc(settingDescriptions.minimumChapterCharacters)
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.step = "100";

        return text
          .setPlaceholder(String(DEFAULT_SETTINGS.minChapterChars))
          .setValue(String(this.plugin.settings.minChapterChars))
          .onChange(async (value) => {
            this.plugin.settings.minChapterChars =
              parseOptionalPositiveInteger(value) ?? DEFAULT_SETTINGS.minChapterChars;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Auto-expand short chapters")
      .setDesc(settingDescriptions.autoExpandShortChapters)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoExpandShortChapters)
          .onChange(async (value) => {
            this.plugin.settings.autoExpandShortChapters = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Max completion tokens")
      .setDesc(settingDescriptions.maxCompletionTokens)
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
      .setName("Temperature")
      .setDesc(settingDescriptions.temperature)
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.step = "0.1";

        return text
          .setPlaceholder("omit")
          .setValue(
            this.plugin.settings.temperature === null
              ? ""
              : String(this.plugin.settings.temperature),
          )
          .onChange(async (value) => {
            this.plugin.settings.temperature = parseOptionalNumber(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Reasoning effort")
      .setDesc(settingDescriptions.reasoningEffort)
      .addDropdown((dropdown) => {
        dropdown.addOption("", "Unset");
        ["minimal", "low", "medium", "high"].forEach((value) => {
          dropdown.addOption(value, value);
        });

        return dropdown
          .setValue(this.plugin.settings.reasoningEffort ?? "")
          .onChange(async (value) => {
            this.plugin.settings.reasoningEffort =
              value === ""
                ? null
                : (value as "minimal" | "low" | "medium" | "high");
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Verbosity")
      .setDesc(settingDescriptions.verbosity)
      .addDropdown((dropdown) => {
        dropdown.addOption("", "Unset");
        ["low", "medium", "high"].forEach((value) => {
          dropdown.addOption(value, value);
        });

        return dropdown
          .setValue(this.plugin.settings.verbosity ?? "")
          .onChange(async (value) => {
            this.plugin.settings.verbosity =
              value === "" ? null : (value as "low" | "medium" | "high");
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Chapter concurrency")
      .setDesc(settingDescriptions.chapterConcurrency)
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
      .setDesc(settingDescriptions.language)
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
