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
import type {
  ReasoningEffort,
  ThinkingMode,
  Verbosity,
} from "./chatCompletion";

const KNOWLEDGE_TYPE_OPTIONS: Record<KnowledgeType | "auto", string> = {
  auto: "Auto",
  conceptual: "Conceptual",
  mathematical: "Mathematical",
  procedural: "Procedural",
  empirical: "Empirical / research",
  craft: "Craft / technique",
  historical: "Historical / cultural",
  interpretive: "Interpretive / textual",
  argumentative: "Argumentative / normative",
  case_based: "Case based / social science",
  hybrid: "Hybrid",
};

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface CompatibleSettingDefinition {
  name: string;
  desc: string;
  render: (setting: Setting) => void;
}

export class SettingTab extends PluginSettingTab {
  plugin: KnowledgePlugin;

  constructor(app: App, plugin: KnowledgePlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.containerEl.addClass("knowledge-settings");
  }

  /**
   * Describe settings for Obsidian 1.13 search while retaining the legacy
   * display path for Obsidian 1.12.7. Both paths share these render callbacks.
   */
  getSettingDefinitions(): CompatibleSettingDefinition[] {
    const settingDescriptions = getSettingDescriptionText(
      this.plugin.settings.language,
    );
    const defaultLabel = getDefaultLabel(this.plugin.settings.language);

    return [
      {
        name: "API key",
        desc: settingDescriptions.apiKey,
        render: (setting) => {
          setting.addText((text) =>
            text
              .setPlaceholder("API key")
              .setValue(this.plugin.settings.apiKey)
              .onChange(async (value) => {
                this.plugin.settings.apiKey = value;
                await this.plugin.saveSettings();
              }),
          );
        },
      },
      {
        name: "API base URL",
        desc: `${settingDescriptions.apiBaseUrl} ${defaultLabel}: ${DEFAULT_SETTINGS.apiBaseUrl}`,
        render: (setting) => {
          setting.addText((text) =>
            text
              .setValue(this.plugin.settings.apiBaseUrl)
              .onChange(async (value) => {
                this.plugin.settings.apiBaseUrl = value;
                await this.plugin.saveSettings();
              }),
          );
        },
      },
      {
        name: "Outline model",
        desc: settingDescriptions.outlineModel,
        render: (setting) => {
          setting.addText((text) =>
            text
              .setValue(this.plugin.settings.modelOutline)
              .onChange(async (value) => {
                this.plugin.settings.modelOutline = value;
                await this.plugin.saveSettings();
              }),
          );
        },
      },
      {
        name: "Chapter model",
        desc: settingDescriptions.chapterModel,
        render: (setting) => {
          setting.addText((text) =>
            text
              .setValue(this.plugin.settings.modelChapter)
              .onChange(async (value) => {
                this.plugin.settings.modelChapter = value;
                await this.plugin.saveSettings();
              }),
          );
        },
      },
      {
        name: "Knowledge type",
        desc: settingDescriptions.knowledgeType,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
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
        },
      },
      {
        name: "Minimum chapter characters",
        desc: settingDescriptions.minimumChapterCharacters,
        render: (setting) => {
          setting.addText((text) => {
            text.inputEl.type = "number";
            text.inputEl.min = "1";
            text.inputEl.step = "100";

            return text
              .setPlaceholder(String(DEFAULT_SETTINGS.minChapterChars))
              .setValue(String(this.plugin.settings.minChapterChars))
              .onChange(async (value) => {
                this.plugin.settings.minChapterChars =
                  parseOptionalPositiveInteger(value) ??
                  DEFAULT_SETTINGS.minChapterChars;
                await this.plugin.saveSettings();
              });
          });
        },
      },
      {
        name: "Max completion tokens",
        desc: settingDescriptions.maxCompletionTokens,
        render: (setting) => {
          setting.addText((text) => {
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
        },
      },
      {
        name: "Temperature",
        desc: settingDescriptions.temperature,
        render: (setting) => {
          setting.addText((text) => {
            text.inputEl.type = "number";
            text.inputEl.step = "0.1";

            return text
              .setPlaceholder("Omit")
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
        },
      },
      {
        name: "Reasoning effort",
        desc: settingDescriptions.reasoningEffort,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            dropdown.addOption("", "Unset");
            ["none", "minimal", "low", "medium", "high", "xhigh", "max"].forEach(
              (value) => {
                dropdown.addOption(value, value);
              },
            );

            return dropdown
              .setValue(this.plugin.settings.reasoningEffort ?? "")
              .onChange(async (value) => {
                this.plugin.settings.reasoningEffort =
                  value === "" ? null : (value as ReasoningEffort);
                await this.plugin.saveSettings();
              });
          });
        },
      },
      {
        name: "Verbosity",
        desc: settingDescriptions.verbosity,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            dropdown.addOption("", "Unset");
            ["low", "medium", "high"].forEach((value) => {
              dropdown.addOption(value, value);
            });

            return dropdown
              .setValue(this.plugin.settings.verbosity ?? "")
              .onChange(async (value) => {
                this.plugin.settings.verbosity =
                  value === "" ? null : (value as Verbosity);
                await this.plugin.saveSettings();
              });
          });
        },
      },
      {
        name: "Thinking mode",
        desc: "Auto omits the provider-specific toggle. Use enabled or disabled only when your provider documents support.",
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            dropdown.addOption("auto", "Auto");
            dropdown.addOption("enabled", "Enabled");
            dropdown.addOption("disabled", "Disabled");

            return dropdown
              .setValue(this.plugin.settings.thinkingMode)
              .onChange(async (value) => {
                this.plugin.settings.thinkingMode = value as ThinkingMode;
                await this.plugin.saveSettings();
              });
          });
        },
      },
      {
        name: "Chapter concurrency",
        desc: settingDescriptions.chapterConcurrency,
        render: (setting) => {
          setting.addText((text) => {
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
        },
      },
      {
        name: "Language",
        desc: settingDescriptions.language,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
              dropdown.addOption(value, label);
            });

            return dropdown
              .setValue(this.plugin.settings.language)
              .onChange(async (value) => {
                this.plugin.settings.language = value;
                await this.plugin.saveSettings();
                this.plugin.refreshLocalizedUi();
              });
          });
        },
      },
    ];
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    for (const definition of this.getSettingDefinitions()) {
      const setting = new Setting(containerEl)
        .setName(definition.name)
        .setDesc(definition.desc);
      definition.render(setting);
    }
  }
}
