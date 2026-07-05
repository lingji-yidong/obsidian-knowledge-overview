import { App, Modal, Notice, setIcon } from "obsidian";
import { KNOWLEDGE_DEPTH_LABELS } from "./densityPresets";
import { getKnowledgeDepthDescriptionText } from "./i18n";
import { DEFAULT_SETTINGS } from "./settings";
import type KnowledgePlugin from "./plugin";
import type { KnowledgeDepth } from "./instructionalTypes";

interface DepthChoice {
  value: KnowledgeDepth;
  icon: string;
}

const DEPTH_CHOICES: DepthChoice[] = [
  {
    value: "scan",
    icon: "map",
  },
  {
    value: "onboarding",
    icon: "list-checks",
  },
  {
    value: "learn",
    icon: "graduation-cap",
  },
  {
    value: "review",
    icon: "refresh-cw",
  },
];

export class InputModal extends Modal {
  plugin: KnowledgePlugin;

  constructor(app: App, plugin: KnowledgePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("knowledge-generate-modal");
    contentEl.empty();
    contentEl.addClass("knowledge-input-modal");
    const depthDescriptions = getKnowledgeDepthDescriptionText(
      this.plugin.settings.language,
    );

    contentEl.createEl("h2", {
      cls: "knowledge-modal-title",
      text: "Generate knowledge overview",
    });

    const subjectGroup = contentEl.createDiv({
      cls: "knowledge-field-group",
    });
    subjectGroup.createEl("label", {
      cls: "knowledge-field-label",
      text: "Subject",
    });

    const input = subjectGroup.createEl("input", {
      type: "text",
      placeholder: "Enter subject (e.g. Signal Processing)",
    });

    const depthGroup = contentEl.createDiv({
      cls: "knowledge-field-group",
    });
    const depthHeader = depthGroup.createDiv({
      cls: "knowledge-depth-header",
    });
    depthHeader.createEl("span", {
      cls: "knowledge-field-label",
      text: "Chapter depth",
    });
    depthHeader.createEl("span", {
      cls: "knowledge-field-hint",
      text: "Choose intent for this run",
    });

    let selectedDepth: KnowledgeDepth = DEFAULT_SETTINGS.knowledgeDepth;
    const depthGrid = depthGroup.createDiv({
      cls: "knowledge-depth-grid",
    });
    const depthButtons: Partial<Record<KnowledgeDepth, HTMLButtonElement>> = {};

    const updateDepthSelection = (nextDepth: KnowledgeDepth) => {
      selectedDepth = nextDepth;
      DEPTH_CHOICES.forEach(({ value }) => {
        const depthButton = depthButtons[value];
        if (!depthButton) {
          return;
        }

        const selected = value === selectedDepth;
        depthButton.toggleClass("is-selected", selected);
        depthButton.setAttr("aria-pressed", selected ? "true" : "false");
      });
    };

    DEPTH_CHOICES.forEach(({ value, icon }) => {
      const depthButton = depthGrid.createEl("button", {
        cls: "knowledge-depth-card",
        type: "button",
      });
      depthButton.setAttr("aria-pressed", "false");

      const iconEl = depthButton.createSpan({
        cls: "knowledge-depth-icon",
      });
      setIcon(iconEl, icon);

      depthButton.createSpan({
        cls: "knowledge-depth-title",
        text: KNOWLEDGE_DEPTH_LABELS[value],
      });
      depthButton.createSpan({
        cls: "knowledge-depth-description",
        text: depthDescriptions[value],
      });

      depthButton.onclick = () => updateDepthSelection(value);
      depthButtons[value] = depthButton;
    });
    updateDepthSelection(selectedDepth);

    const footer = contentEl.createDiv({
      cls: "knowledge-modal-footer",
    });
    const cancelButton = footer.createEl("button", {
      cls: "knowledge-secondary-button",
      text: "Cancel",
    });
    cancelButton.onclick = () => this.close();

    const button = footer.createEl("button", {
      cls: "knowledge-primary-button",
      text: "Generate",
    });

    button.onclick = async () => {
      const subject = input.value.trim();
      if (!subject) {
        new Notice("Please enter a subject name");
        return;
      }
      this.close();
      void this.plugin.generate(subject, selectedDepth);
    };

    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        button.click();
      }
    });
  }
}

export class ResumeFailedModal extends Modal {
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
