export const LANGUAGE_OPTIONS: Record<string, string> = {
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
  fi: "Suomi",
  pl: "Polski",
  tr: "Türkçe",
  ru: "Русский",
};

export interface HeaderText {
  outlineTitle: string;
  generatedAt: string;
  chapterNumber: string;
  generated: string;
}

const HEADER_TEXT: Record<string, HeaderText> = {
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
  fi: {
    outlineTitle: "Jäsennys",
    generatedAt: "Luotu",
    chapterNumber: "Luku",
    generated:
      "Automaattisesti luodut kertaus- ja haastattelumuistiinpanot. Muokkaa vapaasti.",
  },
};

export function getLanguageLabel(language: string): string {
  return LANGUAGE_OPTIONS[language] ?? language;
}

export function getHeaderText(language: string): HeaderText {
  return HEADER_TEXT[language] ?? HEADER_TEXT.en;
}

