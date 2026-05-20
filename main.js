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
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);

// src/plugin.ts
var import_obsidian4 = require("obsidian");

// src/api.ts
var import_obsidian = require("obsidian");

// src/settings.ts
var DEFAULT_SETTINGS = {
  apiKey: "",
  language: "en",
  apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  modelOutline: "gemini-3.5-flash",
  modelChapter: "gemini-3.5-flash",
  maxCompletionTokens: null,
  concurrency: 1,
  chapterConcurrency: 1
};
var MIN_CONCURRENCY = 1;
var MAX_COURSE_CONCURRENCY = 10;
var MAX_CHAPTER_CONCURRENCY = 20;
var MAX_API_RETRIES = 2;
var RETRY_BASE_DELAY_MS = 1500;

// src/api.ts
var ApiError = class extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
};
var CompletionTruncatedError = class extends Error {
  constructor() {
    super(
      "API response was truncated because the model reached its output token limit. Increase Max completion tokens or choose a model/provider with a larger output limit."
    );
    this.name = "CompletionTruncatedError";
  }
};
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}
function buildChatCompletionsUrl(apiBaseUrl) {
  const trimmed = apiBaseUrl.trim();
  const fallback = DEFAULT_SETTINGS.apiBaseUrl;
  const withoutTrailingSlash = (trimmed || fallback).replace(/\/+$/, "");
  const withoutEndpoint = withoutTrailingSlash.replace(
    /(?:\/chat)?\/completions$/i,
    ""
  );
  const normalizedSlashes = withoutEndpoint.replace(/([^:]\/)\/+/g, "$1").replace(/\/+$/, "");
  const hasPath = /^https?:\/\/[^/]+\/.+/i.test(normalizedSlashes);
  const baseUrl = hasPath ? normalizedSlashes : `${normalizedSlashes}/v1`;
  return `${baseUrl}/chat/completions`;
}
function isChatCompletionResponse(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const choices = value.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return false;
  }
  return typeof choices[0] === "object" && choices[0] !== null;
}
function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return null;
  }
  const parts = content.map((part) => {
    if (typeof part === "string") {
      return part;
    }
    if (!part || typeof part !== "object") {
      return "";
    }
    const maybeText = part;
    if (typeof maybeText.text === "string") {
      return maybeText.text;
    }
    if (typeof maybeText.content === "string") {
      return maybeText.content;
    }
    return "";
  }).join("");
  return parts || null;
}
function extractChatCompletionContent(data) {
  var _a;
  const firstChoice = data.choices[0];
  const messageContent = extractTextContent((_a = firstChoice.message) == null ? void 0 : _a.content);
  if (messageContent !== null) {
    return messageContent;
  }
  return extractTextContent(firstChoice.text);
}
async function callChatCompletion(apiKey, apiBaseUrl, model, prompt, maxCompletionTokens) {
  const body = {
    model,
    messages: [{ role: "user", content: prompt }]
  };
  if (maxCompletionTokens !== null) {
    body.max_completion_tokens = maxCompletionTokens;
  }
  const res = await (0, import_obsidian.requestUrl)({
    url: buildChatCompletionsUrl(apiBaseUrl),
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (res.status < 200 || res.status >= 300) {
    throw new ApiError(`API Error: ${res.status} - ${res.text}`, res.status);
  }
  const data = res.json;
  if (!isChatCompletionResponse(data)) {
    throw new Error("API response did not include a message content");
  }
  const content = extractChatCompletionContent(data);
  if (content === null) {
    throw new Error("API response did not include a message content");
  }
  if (data.choices[0].finish_reason === "length") {
    throw new CompletionTruncatedError();
  }
  return content;
}

// src/i18n.ts
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
  fi: "Suomi",
  pl: "Polski",
  tr: "T\xFCrk\xE7e",
  ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439"
};
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
  },
  ja: {
    outlineTitle: "\u30A2\u30A6\u30C8\u30E9\u30A4\u30F3",
    generatedAt: "\u751F\u6210\u65E5\u6642",
    chapterNumber: "\u7AE0",
    generated: "\u81EA\u52D5\u751F\u6210\u3055\u308C\u305F\u5FA9\u7FD2\u30FB\u9762\u63A5\u7528\u30CE\u30FC\u30C8\u3067\u3059\u3002\u81EA\u7531\u306B\u7DE8\u96C6\u3067\u304D\u307E\u3059\u3002"
  },
  ko: {
    outlineTitle: "\uAC1C\uC694",
    generatedAt: "\uC0DD\uC131 \uC2DC\uAC04",
    chapterNumber: "\uC7A5",
    generated: "\uC790\uB3D9 \uC0DD\uC131\uB41C \uBCF5\uC2B5 \uBC0F \uC778\uD130\uBDF0 \uB178\uD2B8\uC785\uB2C8\uB2E4. \uC790\uC720\uB86D\uAC8C \uC218\uC815\uD558\uC138\uC694."
  },
  vi: {
    outlineTitle: "D\xE0n \xFD",
    generatedAt: "\u0110\u01B0\u1EE3c t\u1EA1o l\xFAc",
    chapterNumber: "Ch\u01B0\u01A1ng",
    generated: "Ghi ch\xFA \xF4n t\u1EADp v\xE0 ph\u1ECFng v\u1EA5n \u0111\u01B0\u1EE3c t\u1EA1o t\u1EF1 \u0111\u1ED9ng. B\u1EA1n c\xF3 th\u1EC3 ch\u1EC9nh s\u1EEDa."
  },
  th: {
    outlineTitle: "\u0E42\u0E04\u0E23\u0E07\u0E23\u0E48\u0E32\u0E07",
    generatedAt: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D",
    chapterNumber: "\u0E1A\u0E17",
    generated: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E31\u0E21\u0E20\u0E32\u0E29\u0E13\u0E4C\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23"
  },
  id: {
    outlineTitle: "Garis besar",
    generatedAt: "Dibuat pada",
    chapterNumber: "Bab",
    generated: "Catatan ulasan dan wawancara yang dibuat otomatis. Silakan edit."
  },
  ms: {
    outlineTitle: "Rangka",
    generatedAt: "Dijana pada",
    chapterNumber: "Bab",
    generated: "Nota ulang kaji dan temu duga yang dijana automatik. Sila edit."
  },
  hi: {
    outlineTitle: "\u0930\u0942\u092A\u0930\u0947\u0916\u093E",
    generatedAt: "\u092C\u0928\u093E\u092F\u093E \u0917\u092F\u093E",
    chapterNumber: "\u0905\u0927\u094D\u092F\u093E\u092F",
    generated: "\u0938\u094D\u0935\u0924\u0903 \u092C\u0928\u093E\u090F \u0917\u090F \u092A\u0941\u0928\u0930\u093E\u0935\u0932\u094B\u0915\u0928 \u0914\u0930 \u0938\u093E\u0915\u094D\u0937\u093E\u0924\u094D\u0915\u093E\u0930 \u0928\u094B\u091F\u094D\u0938\u0964 \u0907\u0928\u094D\u0939\u0947\u0902 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930 \u0930\u0942\u092A \u0938\u0947 \u0938\u0902\u092A\u093E\u0926\u093F\u0924 \u0915\u0930\u0947\u0902\u0964"
  },
  ar: {
    outlineTitle: "\u0627\u0644\u0645\u062E\u0637\u0637",
    generatedAt: "\u062A\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 \u0641\u064A",
    chapterNumber: "\u0627\u0644\u0641\u0635\u0644",
    generated: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0645\u0642\u0627\u0628\u0644\u0629 \u0645\u0648\u0644\u062F\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627. \u064A\u0645\u0643\u0646\u0643 \u062A\u0639\u062F\u064A\u0644\u0647\u0627 \u0628\u062D\u0631\u064A\u0629."
  },
  de: {
    outlineTitle: "Gliederung",
    generatedAt: "Erstellt am",
    chapterNumber: "Kapitel",
    generated: "Automatisch erstellte Lern- und Interviewnotizen. Frei bearbeitbar."
  },
  fr: {
    outlineTitle: "Plan",
    generatedAt: "G\xE9n\xE9r\xE9 le",
    chapterNumber: "Chapitre",
    generated: "Notes de r\xE9vision et d'entretien g\xE9n\xE9r\xE9es automatiquement. Modifiez-les librement."
  },
  es: {
    outlineTitle: "Esquema",
    generatedAt: "Generado el",
    chapterNumber: "Cap\xEDtulo",
    generated: "Notas de repaso y entrevista generadas autom\xE1ticamente. Ed\xEDtalas libremente."
  },
  it: {
    outlineTitle: "Schema",
    generatedAt: "Generato il",
    chapterNumber: "Capitolo",
    generated: "Note di ripasso e colloquio generate automaticamente. Modificale liberamente."
  },
  pt: {
    outlineTitle: "Esbo\xE7o",
    generatedAt: "Gerado em",
    chapterNumber: "Cap\xEDtulo",
    generated: "Notas de revis\xE3o e entrevista geradas automaticamente. Edite livremente."
  },
  nl: {
    outlineTitle: "Overzicht",
    generatedAt: "Gegenereerd op",
    chapterNumber: "Hoofdstuk",
    generated: "Automatisch gegenereerde herhalings- en interviewnotities. Vrij te bewerken."
  },
  sv: {
    outlineTitle: "Disposition",
    generatedAt: "Skapad",
    chapterNumber: "Kapitel",
    generated: "Automatiskt skapade repetitions- och intervjunoteringar. Redigera fritt."
  },
  fi: {
    outlineTitle: "J\xE4sennys",
    generatedAt: "Luotu",
    chapterNumber: "Luku",
    generated: "Automaattisesti luodut kertaus- ja haastattelumuistiinpanot. Muokkaa vapaasti."
  },
  pl: {
    outlineTitle: "Konspekt",
    generatedAt: "Wygenerowano",
    chapterNumber: "Rozdzia\u0142",
    generated: "Automatycznie wygenerowane notatki do powt\xF3rki i rozmowy. Edytuj swobodnie."
  },
  tr: {
    outlineTitle: "Taslak",
    generatedAt: "Olu\u015Fturulma zaman\u0131",
    chapterNumber: "B\xF6l\xFCm",
    generated: "Otomatik olu\u015Fturulmu\u015F tekrar ve m\xFClakat notlar\u0131. Serbest\xE7e d\xFCzenleyin."
  },
  ru: {
    outlineTitle: "\u041F\u043B\u0430\u043D",
    generatedAt: "\u0421\u043E\u0437\u0434\u0430\u043D\u043E",
    chapterNumber: "\u0413\u043B\u0430\u0432\u0430",
    generated: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 \u0434\u043B\u044F \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u044F \u0438 \u0438\u043D\u0442\u0435\u0440\u0432\u044C\u044E. \u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E."
  }
};
var UI_TEXT = {
  en: {
    generateKnowledge: "Generate Knowledge Overview",
    resumeFailedChapters: "Resume Failed Chapter Generation"
  },
  zh: {
    generateKnowledge: "\u751F\u6210\u77E5\u8BC6\u6982\u89C8",
    resumeFailedChapters: "\u7EE7\u7EED\u751F\u6210\u5931\u8D25\u7AE0\u8282"
  },
  zh_tw: {
    generateKnowledge: "\u751F\u6210\u77E5\u8B58\u6982\u89BD",
    resumeFailedChapters: "\u7E7C\u7E8C\u751F\u6210\u5931\u6557\u7AE0\u7BC0"
  },
  ja: {
    generateKnowledge: "\u77E5\u8B58\u6982\u8981\u3092\u751F\u6210",
    resumeFailedChapters: "\u5931\u6557\u3057\u305F\u7AE0\u306E\u751F\u6210\u3092\u518D\u958B"
  },
  ko: {
    generateKnowledge: "\uC9C0\uC2DD \uAC1C\uC694 \uC0DD\uC131",
    resumeFailedChapters: "\uC2E4\uD328\uD55C \uC7A5 \uC0DD\uC131 \uC7AC\uAC1C"
  },
  vi: {
    generateKnowledge: "T\u1EA1o t\u1ED5ng quan ki\u1EBFn th\u1EE9c",
    resumeFailedChapters: "Ti\u1EBFp t\u1EE5c t\u1EA1o c\xE1c ch\u01B0\u01A1ng l\u1ED7i"
  },
  th: {
    generateKnowledge: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49",
    resumeFailedChapters: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1A\u0E17\u0E17\u0E35\u0E48\u0E25\u0E49\u0E21\u0E40\u0E2B\u0E25\u0E27\u0E15\u0E48\u0E2D"
  },
  id: {
    generateKnowledge: "Buat ringkasan pengetahuan",
    resumeFailedChapters: "Lanjutkan pembuatan bab gagal"
  },
  ms: {
    generateKnowledge: "Jana gambaran pengetahuan",
    resumeFailedChapters: "Sambung penjanaan bab yang gagal"
  },
  hi: {
    generateKnowledge: "\u091C\u094D\u091E\u093E\u0928 \u0905\u0935\u0932\u094B\u0915\u0928 \u092C\u0928\u093E\u090F\u0902",
    resumeFailedChapters: "\u0935\u093F\u092B\u0932 \u0905\u0927\u094D\u092F\u093E\u092F\u094B\u0902 \u0915\u093E \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902"
  },
  ar: {
    generateKnowledge: "\u0625\u0646\u0634\u0627\u0621 \u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0645\u0639\u0631\u0641\u064A\u0629",
    resumeFailedChapters: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0641\u0627\u0634\u0644\u0629"
  },
  de: {
    generateKnowledge: "Wissens\xFCbersicht erstellen",
    resumeFailedChapters: "Fehlgeschlagene Kapitel fortsetzen"
  },
  fr: {
    generateKnowledge: "G\xE9n\xE9rer une vue d'ensemble",
    resumeFailedChapters: "Reprendre les chapitres \xE9chou\xE9s"
  },
  es: {
    generateKnowledge: "Generar resumen de conocimiento",
    resumeFailedChapters: "Reanudar cap\xEDtulos fallidos"
  },
  it: {
    generateKnowledge: "Genera panoramica della conoscenza",
    resumeFailedChapters: "Riprendi capitoli non riusciti"
  },
  pt: {
    generateKnowledge: "Gerar vis\xE3o geral do conhecimento",
    resumeFailedChapters: "Retomar cap\xEDtulos com falha"
  },
  nl: {
    generateKnowledge: "Kennisoverzicht genereren",
    resumeFailedChapters: "Mislukte hoofdstukken hervatten"
  },
  sv: {
    generateKnowledge: "Skapa kunskaps\xF6versikt",
    resumeFailedChapters: "\xC5teruppta misslyckade kapitel"
  },
  fi: {
    generateKnowledge: "Luo tietokatsaus",
    resumeFailedChapters: "Jatka ep\xE4onnistuneiden lukujen luontia"
  },
  pl: {
    generateKnowledge: "Wygeneruj przegl\u0105d wiedzy",
    resumeFailedChapters: "Wzn\xF3w nieudane rozdzia\u0142y"
  },
  tr: {
    generateKnowledge: "Bilgi genel bak\u0131\u015F\u0131 olu\u015Ftur",
    resumeFailedChapters: "Ba\u015Far\u0131s\u0131z b\xF6l\xFCmleri s\xFCrd\xFCr"
  },
  ru: {
    generateKnowledge: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u0431\u0437\u043E\u0440 \u0437\u043D\u0430\u043D\u0438\u0439",
    resumeFailedChapters: "\u0412\u043E\u0437\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0435 \u0433\u043B\u0430\u0432\u044B"
  }
};
function getLanguageLabel(language) {
  var _a;
  return (_a = LANGUAGE_OPTIONS[language]) != null ? _a : language;
}
function getHeaderText(language) {
  var _a;
  return (_a = HEADER_TEXT[language]) != null ? _a : HEADER_TEXT.en;
}
function getUiText(language) {
  var _a;
  return (_a = UI_TEXT[language]) != null ? _a : UI_TEXT.en;
}

// src/modals.ts
var import_obsidian2 = require("obsidian");
var InputModal = class extends import_obsidian2.Modal {
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
        new import_obsidian2.Notice("Please enter a subject name");
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
var ResumeFailedModal = class extends import_obsidian2.Modal {
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
        new import_obsidian2.Notice("Please enter a subject folder name");
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

// src/prompts.ts
function buildOutlinePrompt(courseName, language) {
  const targetLanguage = getLanguageLabel(language);
  return `
\u8ACB\u4F60\u4F5C\u70BA\u5927\u5B78\u8AB2\u7A0B\u52A9\u6559\uFF0C\u70BA\u6307\u5B9A\u8AB2\u7A0B\u6574\u7406\u4E00\u4EFD\u9AD8\u8CEA\u91CF\u8AB2\u7A0B\u63D0\u7DB1\u3002\u9019\u4EFD\u63D0\u7DB1\u7528\u65BC\u5FEB\u901F\u5EFA\u7ACB\u80CC\u666F\u77E5\u8B58\uFF0C\u53EF\u670D\u52D9\u65BC\u79D1\u7814\u5165\u9580\u524D\u7684\u80CC\u666F\u4E86\u89E3\u3001\u8AB2\u7A0B\u8907\u7FD2\u3001\u8DE8\u9818\u57DF\u5B78\u7FD2\u548C\u5C08\u696D\u4EA4\u6D41\u6E96\u5099\u3002\u4F60\u9700\u8981\u8003\u616E\u570B\u969B\u901A\u7528\u6559\u5B78\u4E2D\u9019\u9580\u8AB2\u6700\u4E3B\u8981\u7684\u77E5\u8B58\uFF0C\u5305\u62EC\u7D93\u5178\u5167\u5BB9\u3001\u73FE\u4EE3\u767C\u5C55\u3001\u6838\u5FC3\u6982\u5FF5\u3001\u91CD\u8981\u7406\u8AD6\u548C\u5178\u578B\u61C9\u7528\u3002

\u8F38\u51FA\u8A9E\u8A00\uFF1A${targetLanguage}
\u8853\u8A9E\u8981\u6C42\uFF1A\u4E3B\u8981\u5167\u5BB9\u4F7F\u7528\u300C${targetLanguage}\u300D\u3002\u95DC\u9375\u8853\u8A9E\u8ACB\u7528\u96D9\u8A9E\u5C55\u793A\uFF0C\u683C\u5F0F\u70BA\uFF08English Term, ${targetLanguage} Term\uFF09\u3002

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
4. \u5167\u5BB9\u61C9\u8A72\u6DB5\u84CB\u8AB2\u7A0B\u7684\u6838\u5FC3\u6982\u5FF5\u3001\u91CD\u8981\u4E3B\u984C\u3001\u57FA\u790E\u7406\u8AD6\u3001\u5178\u578B\u65B9\u6CD5\u548C\u5BE6\u969B\u61C9\u7528
5. \u63D0\u7DB1\u61C9\u50CF\u6B63\u5F0F\u6559\u6750\u6216\u9AD8\u8CEA\u91CF\u8AB2\u7A0B syllabus\uFF0C\u4E0D\u8981\u5BEB\u6210\u96F6\u6563\u95DC\u9375\u8A5E\u6E05\u55AE
6. \u4E0D\u8981\u5728\u6B63\u6587\u4E2D\u63CF\u8FF0\u4F7F\u7528\u8005\u7684\u500B\u4EBA\u80CC\u666F\u6216\u6E96\u5099\u6D41\u7A0B\uFF1B\u53EA\u8F38\u51FA\u8AB2\u7A0B\u77E5\u8B58\u672C\u8EAB

\u8ACB\u70BA\u4EE5\u4E0B\u8AB2\u7A0B\u751F\u6210\u5927\u7DB1\uFF0810-20\u500B\u7AE0\u7BC0\u662F\u53EF\u63A5\u53D7\u7BC4\u570D\uFF09\uFF1A

Course: ${courseName}
`;
}
function buildChapterPrompt(courseName, chapterName, language) {
  const targetLanguage = getLanguageLabel(language);
  return `\u8ACB\u4F60\u4F5C\u70BA\u5927\u5B78\u8AB2\u7A0B\u52A9\u6559\uFF0C\u70BA\u6307\u5B9A\u8AB2\u7A0B\u7AE0\u7BC0\u64B0\u5BEB\u4E00\u4EFD\u9AD8\u8CEA\u91CF\u3001\u5167\u5BB9\u5145\u5BE6\u7684\u5B78\u7FD2\u7B46\u8A18\u3002\u9019\u4EFD\u7B46\u8A18\u7528\u65BC\u5FEB\u901F\u5EFA\u7ACB\u80CC\u666F\u77E5\u8B58\uFF0C\u53EF\u670D\u52D9\u65BC\u79D1\u7814\u5165\u9580\u524D\u7684\u80CC\u666F\u4E86\u89E3\u3001\u8AB2\u7A0B\u8907\u7FD2\u3001\u8DE8\u9818\u57DF\u5B78\u7FD2\u548C\u5C08\u696D\u4EA4\u6D41\u6E96\u5099\u3002\u672C\u6B21\u8AB2\u7A0B\u662F\u300C${courseName}\u300D\u3002\u8ACB\u6309\u7167\u79D1\u5B78\u7684\u5B78\u7FD2\u8DEF\u7DDA\uFF0C\u5F9E\u5C0E\u8AD6\u548C\u57FA\u672C\u6982\u5FF5\u958B\u59CB\uFF0C\u9010\u6B65\u8B1B\u5230\u6838\u5FC3\u539F\u7406\u3001\u91CD\u8981\u5B9A\u7406\u3001\u516C\u5F0F\u3001\u4F8B\u5B50\u3001\u61C9\u7528\u548C\u6613\u6DF7\u6DC6\u9EDE\u3002

\u8F38\u51FA\u8A9E\u8A00\uFF1A${targetLanguage}
\u8853\u8A9E\u8981\u6C42\uFF1A\u4E3B\u8981\u5167\u5BB9\u4F7F\u7528\u300C${targetLanguage}\u300D\u3002\u95DC\u9375\u8853\u8A9E\u8ACB\u63D0\u4F9B\uFF08English Term, ${targetLanguage} Term\uFF09\u96D9\u8A9E\u5C0D\u7167\u3002
\u8F38\u51FA\u65B9\u5F0F\uFF1A\u76F4\u63A5\u5F9E\u7AE0\u7BC0\u5167\u5BB9\u958B\u59CB\uFF0C\u4E0D\u8981\u5BD2\u6684\uFF0C\u4E0D\u8981\u7A31\u547C\u8B80\u8005\uFF0C\u4E0D\u8981\u8AAA\u300C\u597D\u7684\u300D\u300C\u540C\u5B78\u300D\u300C\u9019\u4EFD\u7B46\u8A18\u65E8\u5728\u300D\u300C\u6211\u5011\u5C07\u300D\u7B49\u958B\u5834\u767D\uFF0C\u4E5F\u4E0D\u8981\u89E3\u91CB\u4F60\u5C07\u5982\u4F55\u5BEB\u4F5C\u3002

\u8ACB\u70BA\u4EE5\u4E0B\u7AE0\u7BC0\u751F\u6210\u8A73\u7D30\u7684\u77E5\u8B58\u9EDE\uFF1A${chapterName}

\u8981\u6C42\uFF1A
1. \u5167\u5BB9\u8981\u6BD4\u7C21\u77ED\u63D0\u7DB1\u66F4\u8C50\u5BCC\uFF0C\u50CF\u7D66\u672C\u79D1\u9AD8\u5E74\u7D1A\u5B78\u751F\u7684\u901F\u6210\u8B1B\u7FA9\uFF1B\u4E0D\u8981\u53EA\u8F38\u51FA\u5E7E\u500B\u77ED bullet
2. \u5148\u5BEB\u300C\u5C0E\u8AD6\u8207\u80CC\u666F\u300D\uFF1A\u8AAA\u660E\u672C\u7AE0\u7814\u7A76\u4EC0\u9EBC\u554F\u984C\u3001\u70BA\u4EC0\u9EBC\u9700\u8981\u5B83\u3001\u5B83\u5728\u6574\u9580\u8AB2\u4E2D\u7684\u4F4D\u7F6E\uFF0C\u4EE5\u53CA\u8B80\u8005\u61C9\u5148\u77E5\u9053\u54EA\u4E9B\u524D\u7F6E\u77E5\u8B58
3. \u518D\u5BEB\u300C\u57FA\u672C\u6982\u5FF5\u300D\uFF1A\u5F9E\u6700\u57FA\u790E\u7684\u5B9A\u7FA9\u3001\u76F4\u89BA\u548C\u8853\u8A9E\u958B\u59CB\uFF0C\u9010\u6B65\u5EFA\u7ACB\u6982\u5FF5\uFF0C\u4E0D\u8981\u76F4\u63A5\u8DF3\u5230\u9AD8\u968E\u7D50\u8AD6
4. \u7136\u5F8C\u5BEB\u300C\u6838\u5FC3\u539F\u7406\u8207\u91CD\u8981\u5B9A\u7406\u300D\uFF1A\u7CFB\u7D71\u6DB5\u84CB\u57FA\u672C\u5047\u8A2D\u3001\u91CD\u8981\u5B9A\u7406\u3001\u5178\u578B\u6A21\u578B\u3001\u7B97\u6CD5\u6216\u5206\u6790\u65B9\u6CD5\uFF1B\u6BCF\u500B\u6838\u5FC3\u6982\u5FF5\u90FD\u8981\u6709\u89E3\u91CB\u6027\u6BB5\u843D
5. \u5BEB\u300C\u516C\u5F0F\u8207\u63A8\u5C0E\u76F4\u89BA\u300D\uFF1A\u7D66\u51FA\u5FC5\u8981\u516C\u5F0F\uFF0C\u8AAA\u660E\u516C\u5F0F\u5F9E\u54EA\u88E1\u4F86\u3001\u6BCF\u4E00\u9805\u4EE3\u8868\u4EC0\u9EBC\u3001\u80FD\u89E3\u91CB\u4EC0\u9EBC\u73FE\u8C61
6. \u5BEB\u300C\u4F8B\u5B50\u300D\uFF1A\u63D0\u4F9B\u5177\u9AD4\u3001\u5E36\u4E0A\u4E0B\u6587\u7684\u4F8B\u5B50\uFF0C\u5C55\u793A\u5982\u4F55\u4F7F\u7528\u6982\u5FF5\u6216\u516C\u5F0F\uFF0C\u4E0D\u8981\u53EA\u7D66\u516C\u5F0F\u6216\u95DC\u9375\u8A5E
7. \u5BEB\u300C\u5E38\u898B\u61C9\u7528\u300D\uFF1A\u8AAA\u660E\u8A72\u7AE0\u77E5\u8B58\u5728\u5DE5\u7A0B\u3001\u7814\u7A76\u3001\u8DE8\u5B78\u79D1\u6216\u65E5\u5E38\u554F\u984C\u4E2D\u7684\u5178\u578B\u4F5C\u7528
8. \u5BEB\u300C\u6613\u6DF7\u6DC6\u9EDE\u8207\u5E38\u898B\u8AA4\u89E3\u300D\uFF1A\u5C0D\u5BB9\u6613\u6DF7\u6DC6\u7684\u6982\u5FF5\u505A\u5C0D\u6BD4\uFF0C\u6307\u51FA\u5E38\u898B\u932F\u8AA4\u7406\u89E3
9. \u5BEB\u300C\u81EA\u6211\u6AA2\u67E5\u554F\u984C\u300D\uFF1A\u5217\u51FA 3-5 \u500B\u80FD\u5E6B\u52A9\u8B80\u8005\u78BA\u8A8D\u662F\u5426\u7406\u89E3\u672C\u7AE0\u7684\u554F\u984C
10. \u95DC\u9375\u8853\u8A9E\u63D0\u4F9B\u82F1\u6587\u8207\u76EE\u6A19\u8A9E\u8A00\u5C0D\u7167
11. \u516C\u5F0F\u5FC5\u9808\u4F7F\u7528 Obsidian \u5167\u5EFA KaTeX \u53EF\u89E3\u6790\u7684 Markdown \u5BEB\u6CD5\uFF1A
   - \u884C\u5167\u516C\u5F0F\u4F7F\u7528\u55AE\u7F8E\u5143\u7B26\u865F\uFF0C\u4F8B\u5982\uFF1A$E = mc^2$
   - \u7368\u7ACB\u5C55\u793A\u516C\u5F0F\u4F7F\u7528\u96D9\u7F8E\u5143\u7B26\u865F\uFF0C\u4E14 $$ \u5FC5\u9808\u55AE\u7368\u6210\u884C\uFF0C\u4F8B\u5982\uFF1A

$$
f(x) = \\sum_{n=0}^{\\infty} a_n x^n
$$

   - \u4E0D\u8981\u628A\u516C\u5F0F\u653E\u9032\u4EE5\u4E09\u500B\u53CD\u5F15\u865F\u958B\u982D\u7684 latex/math fenced code block
   - \u4E0D\u8981\u4F7F\u7528 Obsidian/KaTeX \u4E0D\u5E38\u652F\u6301\u7684\u5B8F\u5305\u547D\u4EE4\uFF1B\u512A\u5148\u4F7F\u7528\u6A19\u6E96 LaTeX/KaTeX \u8A9E\u6CD5
   - \u6BCF\u500B\u91CD\u8981\u516C\u5F0F\u5F8C\u8981\u89E3\u91CB\u7B26\u865F\u542B\u7FA9\u548C\u76F4\u89BA
12. \u5EFA\u8B70\u4F7F\u7528\u4EE5\u4E0B\u7D50\u69CB\uFF1A
   - \u5C0E\u8AD6\u8207\u80CC\u666F
   - \u57FA\u672C\u6982\u5FF5
   - \u91CD\u8981\u539F\u7406\u8207\u5B9A\u7406
   - \u516C\u5F0F\u8207\u63A8\u5C0E\u76F4\u89BA
   - \u4F8B\u5B50
   - \u5E38\u898B\u61C9\u7528
   - \u6613\u6DF7\u6DC6\u9EDE\u8207\u5E38\u898B\u8AA4\u89E3
   - \u81EA\u6211\u6AA2\u67E5\u554F\u984C
   - \u95DC\u9375\u8853\u8A9E\u5C0D\u7167
13. \u4E0D\u8981\u5728\u6B63\u6587\u4E2D\u63CF\u8FF0\u4F7F\u7528\u8005\u7684\u500B\u4EBA\u80CC\u666F\u6216\u6E96\u5099\u6D41\u7A0B\uFF1B\u53EA\u8F38\u51FA\u7AE0\u7BC0\u77E5\u8B58\u672C\u8EAB
`;
}

// src/settings-tab.ts
var import_obsidian3 = require("obsidian");

// src/utils.ts
function clampInteger(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(Math.floor(value), min), max);
}
function parseOptionalPositiveInteger(value) {
  if (value === null || value === void 0 || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }
  return Math.floor(parsed);
}
function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function errorToMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function slugifyTitle(title) {
  const safe = title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
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
      const title = match[2].trim().replace(/[：:]+$/, "").trim();
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

// src/settings-tab.ts
var SettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("knowledge-settings");
    new import_obsidian3.Setting(containerEl).setName("API key").setDesc("Your provider API key. The default endpoint uses Google's OpenAI-compatible Gemini API.").addText(
      (text) => text.setPlaceholder("API key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("API base URL").setDesc(
      `OpenAI-compatible API base URL. Default: ${DEFAULT_SETTINGS.apiBaseUrl}`
    ).addText(
      (text) => text.setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
        this.plugin.settings.apiBaseUrl = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Outline model").setDesc("LLM model for generating course outlines").addText(
      (text) => text.setValue(this.plugin.settings.modelOutline).onChange(async (value) => {
        this.plugin.settings.modelOutline = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Chapter model").setDesc("LLM model for generating chapter details").addText(
      (text) => text.setValue(this.plugin.settings.modelChapter).onChange(async (value) => {
        this.plugin.settings.modelChapter = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Max completion tokens").setDesc(
      "Optional output token limit passed as max_completion_tokens. Leave empty to omit it; set a larger value if your provider truncates long chapters."
    ).addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = "1";
      text.inputEl.step = "1";
      return text.setPlaceholder("None").setValue(
        this.plugin.settings.maxCompletionTokens === null ? "" : String(this.plugin.settings.maxCompletionTokens)
      ).onChange(async (value) => {
        this.plugin.settings.maxCompletionTokens = parseOptionalPositiveInteger(value);
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Concurrency").setDesc(
      "Manual concurrency for course-level API calls. Default is 1 for stability on free or rate-limited providers."
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
    new import_obsidian3.Setting(containerEl).setName("Chapter concurrency").setDesc(
      "Manual concurrency for chapter generation. Default is 1; increase only if your provider is stable under parallel requests."
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
    new import_obsidian3.Setting(containerEl).setName("Language").setDesc("Output language preference").addDropdown((dropdown) => {
      Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
        dropdown.addOption(value, label);
      });
      return dropdown.setValue(this.plugin.settings.language).onChange(async (v) => {
        this.plugin.settings.language = v;
        await this.plugin.saveSettings();
        this.plugin.refreshLocalizedUi();
      });
    });
  }
};

// src/plugin.ts
var KnowledgePlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.commandsRegistered = false;
  }
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
      }
    );
    this.generateRibbonIcon.addClass("knowledge-ribbon-icon");
    this.resumeRibbonIcon = this.addRibbonIcon(
      "refresh-cw",
      uiText.resumeFailedChapters,
      () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      }
    );
    this.resumeRibbonIcon.addClass("knowledge-ribbon-icon");
    this.addSettingTab(new SettingTab(this.app, this));
  }
  async loadSettings() {
    const loadedSettings = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings != null ? loadedSettings : {});
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
    this.settings.maxCompletionTokens = parseOptionalPositiveInteger(
      this.settings.maxCompletionTokens
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  refreshLocalizedUi() {
    const uiText = getUiText(this.settings.language);
    this.registerLocalizedCommands(uiText);
    this.updateRibbonLabel(this.generateRibbonIcon, uiText.generateKnowledge);
    this.updateRibbonLabel(this.resumeRibbonIcon, uiText.resumeFailedChapters);
  }
  registerLocalizedCommands(uiText) {
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
      }
    });
    this.addCommand({
      id: "resume-failed-chapters",
      name: uiText.resumeFailedChapters,
      icon: "refresh-cw",
      callback: () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      }
    });
    this.commandsRegistered = true;
  }
  updateRibbonLabel(ribbonIcon, label) {
    if (!ribbonIcon) {
      return;
    }
    (0, import_obsidian4.setTooltip)(ribbonIcon, label, { placement: "right" });
    ribbonIcon.setAttr("aria-label", label);
    ribbonIcon.setAttr("title", label);
  }
  getActiveCourseName() {
    var _a, _b;
    const activeFile = this.app.workspace.getActiveFile();
    return (_b = (_a = activeFile == null ? void 0 : activeFile.parent) == null ? void 0 : _a.path) != null ? _b : "";
  }
  setupProgressStatus() {
    this.progressStatusEl = this.addStatusBarItem();
    this.progressStatusEl.addClass("knowledge-progress-status");
    if (import_obsidian4.Platform.isMobile) {
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
      this.progressFillEl.setCssProps({
        "--knowledge-progress-width": `${safePercent}%`
      });
    }
    if (!this.progressNotice) {
      this.progressNotice = new import_obsidian4.Notice(message, 0);
      this.progressNotice.containerEl.addClass("knowledge-progress-notice");
    } else {
      this.progressNotice.setMessage(message);
    }
  }
  hideProgress() {
    var _a, _b;
    (_a = this.progressStatusEl) == null ? void 0 : _a.addClass("knowledge-progress-hidden");
    if (this.progressFillEl) {
      this.progressFillEl.setCssProps({
        "--knowledge-progress-width": "0%"
      });
    }
    (_b = this.progressNotice) == null ? void 0 : _b.hide();
    this.progressNotice = void 0;
  }
  finishProgress(label) {
    this.showProgress(label, 100);
    window.setTimeout(() => this.hideProgress(), 5e3);
  }
  async callLLM(prompt, model) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
      try {
        return await callChatCompletion(
          this.settings.apiKey,
          this.settings.apiBaseUrl,
          model,
          prompt,
          this.settings.maxCompletionTokens
        );
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
        const filePath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/${fileName}`);
        const existing = this.app.vault.getAbstractFileByPath(filePath);
        if (existing instanceof import_obsidian4.TFile) {
          await this.app.vault.modify(existing, fullContent);
        } else if (existing) {
          throw new Error(`Path "${filePath}" exists and is not a file`);
        } else {
          await this.app.vault.create(filePath, fullContent);
        }
        new import_obsidian4.Notice(`\u2713 ${fileName}`);
        result = {
          chapterNum,
          title,
          fileName,
          success: true
        };
      } catch (error) {
        const errorMsg = errorToMessage(error);
        new import_obsidian4.Notice(
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
    const reportPath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    if (existing instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(reportPath, content);
    }
  }
  async clearFailureReport(courseFolder, courseName) {
    const reportPath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    const content = [
      `# ${courseName} Failed Chapters`,
      "",
      `Resolved at: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
      "",
      "All previously failed chapters were generated successfully.",
      ""
    ].join("\n");
    if (existing instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(existing, content);
    }
  }
  async resumeFailedChapters(courseName) {
    if (!this.settings.apiKey) {
      new import_obsidian4.Notice("\u274C API Key not set! Please configure it in settings.");
      return;
    }
    const folderPath = (0, import_obsidian4.normalizePath)(courseName.trim());
    if (!folderPath) {
      new import_obsidian4.Notice("Please enter a subject folder name");
      return;
    }
    const courseFolder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(courseFolder instanceof import_obsidian4.TFolder)) {
      new import_obsidian4.Notice(`\u274C Folder not found: ${folderPath}`, 7e3);
      return;
    }
    const reportPath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
    if (!(reportFile instanceof import_obsidian4.TFile)) {
      new import_obsidian4.Notice(`No Failed_Chapters.md found in ${courseFolder.path}`, 7e3);
      return;
    }
    const report = await this.app.vault.read(reportFile);
    const chapters = parseFailedChapters(report);
    if (chapters.length === 0) {
      new import_obsidian4.Notice("No failed chapters found to resume");
      this.finishProgress("No failed chapters found");
      return;
    }
    new import_obsidian4.Notice(`\u{1F501} Resuming ${chapters.length} failed chapters`);
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
        new import_obsidian4.Notice(
          `\u26A0\uFE0F Resume finished: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          1e4
        );
        this.finishProgress(
          `Resume finished: ${successCount}/${chapters.length} generated, ${failedResults.length} failed`
        );
      } else {
        await this.clearFailureReport(courseFolder, courseFolder.path);
        new import_obsidian4.Notice(`\u2705 Resume complete: ${chapters.length} chapters generated`);
        this.finishProgress(`Resume complete: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = errorToMessage(error);
      new import_obsidian4.Notice(`\u274C Resume failed: ${errorMsg}`, 7e3);
      this.finishProgress(`Resume failed: ${errorMsg}`);
      console.error("Resume generation error:", error);
    }
  }
  async generate(courseName) {
    if (!this.settings.apiKey) {
      new import_obsidian4.Notice("\u274C API Key not set! Please configure it in settings.");
      return;
    }
    new import_obsidian4.Notice(`\u{1F4DA} Generating: ${courseName}`);
    this.showProgress(`Starting ${courseName}`, 1);
    try {
      this.showProgress(`Generating outline: ${courseName}`, 5);
      new import_obsidian4.Notice("\u23F3 Generating outline...");
      const outline = await this.fetchOutline(courseName);
      const folderPath = (0, import_obsidian4.normalizePath)(courseName);
      let courseFolder;
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      if (existing instanceof import_obsidian4.TFolder) {
        courseFolder = existing;
        new import_obsidian4.Notice(`\u{1F4C1} Using existing folder: ${courseName}`);
      } else if (existing) {
        const errorMsg = `Path "${folderPath}" exists as a file, not a folder. Please rename or delete it manually.`;
        new import_obsidian4.Notice(`\u274C ${errorMsg}`, 7e3);
        throw new Error(errorMsg);
      } else {
        try {
          courseFolder = await this.app.vault.createFolder(folderPath);
          new import_obsidian4.Notice(`\u{1F4C1} Created folder: ${courseName}`);
        } catch (error) {
          throw new Error(
            `Failed to create folder "${folderPath}": ${errorToMessage(error)}`
          );
        }
      }
      const headerText = getHeaderText(this.settings.language);
      const outlineContent = `# ${courseName} ${headerText.outlineTitle}

*${headerText.generatedAt}: ${(/* @__PURE__ */ new Date()).toLocaleString()}*

${outline}`;
      const outlineFilePath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Outlines.md`);
      const existingOutline = this.app.vault.getAbstractFileByPath(outlineFilePath);
      if (existingOutline instanceof import_obsidian4.TFile) {
        await this.app.vault.modify(existingOutline, outlineContent);
      } else if (existingOutline) {
        throw new Error(`Path "${outlineFilePath}" exists and is not a file`);
      } else {
        await this.app.vault.create(outlineFilePath, outlineContent);
      }
      this.showProgress(`Outline saved: ${courseName}`, 15);
      new import_obsidian4.Notice("\u2713 Outlines.md created");
      const chapters = parseChapterTitles(outline);
      if (chapters.length === 0) {
        new import_obsidian4.Notice("\u26A0\uFE0F No chapters found in outline");
        this.finishProgress("No chapters found");
        return;
      }
      new import_obsidian4.Notice(`\u{1F4D6} Found ${chapters.length} chapters, generating content...`);
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
        new import_obsidian4.Notice(
          `\u26A0\uFE0F Done with failures: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          1e4
        );
        this.finishProgress(
          `Done: ${successCount}/${chapters.length} chapters generated, ${failedResults.length} failed`
        );
      } else {
        await this.clearFailureReport(courseFolder, courseName);
        new import_obsidian4.Notice(
          `\u2705 Done! Generated ${chapters.length} chapters for ${courseName}`
        );
        this.finishProgress(`Done: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = errorToMessage(error);
      new import_obsidian4.Notice(`\u274C Error: ${errorMsg}`, 5e3);
      this.finishProgress(`Failed: ${errorMsg}`);
      console.error("Generation error:", error);
    }
  }
};

// main.ts
var main_default = KnowledgePlugin;
