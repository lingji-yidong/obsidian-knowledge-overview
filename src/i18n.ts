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
  ja: {
    outlineTitle: "アウトライン",
    generatedAt: "生成日時",
    chapterNumber: "章",
    generated: "自動生成された復習・面接用ノートです。自由に編集できます。",
  },
  ko: {
    outlineTitle: "개요",
    generatedAt: "생성 시간",
    chapterNumber: "장",
    generated: "자동 생성된 복습 및 인터뷰 노트입니다. 자유롭게 수정하세요.",
  },
  vi: {
    outlineTitle: "Dàn ý",
    generatedAt: "Được tạo lúc",
    chapterNumber: "Chương",
    generated: "Ghi chú ôn tập và phỏng vấn được tạo tự động. Bạn có thể chỉnh sửa.",
  },
  th: {
    outlineTitle: "โครงร่าง",
    generatedAt: "สร้างเมื่อ",
    chapterNumber: "บท",
    generated: "บันทึกทบทวนและสัมภาษณ์ที่สร้างอัตโนมัติ แก้ไขได้ตามต้องการ",
  },
  id: {
    outlineTitle: "Garis besar",
    generatedAt: "Dibuat pada",
    chapterNumber: "Bab",
    generated: "Catatan ulasan dan wawancara yang dibuat otomatis. Silakan edit.",
  },
  ms: {
    outlineTitle: "Rangka",
    generatedAt: "Dijana pada",
    chapterNumber: "Bab",
    generated: "Nota ulang kaji dan temu duga yang dijana automatik. Sila edit.",
  },
  hi: {
    outlineTitle: "रूपरेखा",
    generatedAt: "बनाया गया",
    chapterNumber: "अध्याय",
    generated: "स्वतः बनाए गए पुनरावलोकन और साक्षात्कार नोट्स। इन्हें स्वतंत्र रूप से संपादित करें।",
  },
  ar: {
    outlineTitle: "المخطط",
    generatedAt: "تم الإنشاء في",
    chapterNumber: "الفصل",
    generated: "ملاحظات مراجعة ومقابلة مولدة تلقائيا. يمكنك تعديلها بحرية.",
  },
  de: {
    outlineTitle: "Gliederung",
    generatedAt: "Erstellt am",
    chapterNumber: "Kapitel",
    generated: "Automatisch erstellte Lern- und Interviewnotizen. Frei bearbeitbar.",
  },
  fr: {
    outlineTitle: "Plan",
    generatedAt: "Généré le",
    chapterNumber: "Chapitre",
    generated: "Notes de révision et d'entretien générées automatiquement. Modifiez-les librement.",
  },
  es: {
    outlineTitle: "Esquema",
    generatedAt: "Generado el",
    chapterNumber: "Capítulo",
    generated: "Notas de repaso y entrevista generadas automáticamente. Edítalas libremente.",
  },
  it: {
    outlineTitle: "Schema",
    generatedAt: "Generato il",
    chapterNumber: "Capitolo",
    generated: "Note di ripasso e colloquio generate automaticamente. Modificale liberamente.",
  },
  pt: {
    outlineTitle: "Esboço",
    generatedAt: "Gerado em",
    chapterNumber: "Capítulo",
    generated: "Notas de revisão e entrevista geradas automaticamente. Edite livremente.",
  },
  nl: {
    outlineTitle: "Overzicht",
    generatedAt: "Gegenereerd op",
    chapterNumber: "Hoofdstuk",
    generated: "Automatisch gegenereerde herhalings- en interviewnotities. Vrij te bewerken.",
  },
  sv: {
    outlineTitle: "Disposition",
    generatedAt: "Skapad",
    chapterNumber: "Kapitel",
    generated: "Automatiskt skapade repetitions- och intervjunoteringar. Redigera fritt.",
  },
  fi: {
    outlineTitle: "Jäsennys",
    generatedAt: "Luotu",
    chapterNumber: "Luku",
    generated:
      "Automaattisesti luodut kertaus- ja haastattelumuistiinpanot. Muokkaa vapaasti.",
  },
  pl: {
    outlineTitle: "Konspekt",
    generatedAt: "Wygenerowano",
    chapterNumber: "Rozdział",
    generated: "Automatycznie wygenerowane notatki do powtórki i rozmowy. Edytuj swobodnie.",
  },
  tr: {
    outlineTitle: "Taslak",
    generatedAt: "Oluşturulma zamanı",
    chapterNumber: "Bölüm",
    generated: "Otomatik oluşturulmuş tekrar ve mülakat notları. Serbestçe düzenleyin.",
  },
  ru: {
    outlineTitle: "План",
    generatedAt: "Создано",
    chapterNumber: "Глава",
    generated: "Автоматически созданные заметки для повторения и интервью. Редактируйте свободно.",
  },
};

export function getLanguageLabel(language: string): string {
  return LANGUAGE_OPTIONS[language] ?? language;
}

export function getHeaderText(language: string): HeaderText {
  return HEADER_TEXT[language] ?? HEADER_TEXT.en;
}
