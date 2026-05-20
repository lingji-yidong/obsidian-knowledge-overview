import { App, Modal, Notice } from "obsidian";
import type KnowledgePlugin from "./plugin";

export class InputModal extends Modal {
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

