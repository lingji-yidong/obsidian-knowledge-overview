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

export interface UiText {
  generateKnowledge: string;
  resumeFailedChapters: string;
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

const UI_TEXT: Record<string, UiText> = {
  en: {
    generateKnowledge: "Generate Knowledge Overview",
    resumeFailedChapters: "Resume Failed Chapter Generation",
  },
  zh: {
    generateKnowledge: "生成知识概览",
    resumeFailedChapters: "继续生成失败章节",
  },
  zh_tw: {
    generateKnowledge: "生成知識概覽",
    resumeFailedChapters: "繼續生成失敗章節",
  },
  ja: {
    generateKnowledge: "知識概要を生成",
    resumeFailedChapters: "失敗した章の生成を再開",
  },
  ko: {
    generateKnowledge: "지식 개요 생성",
    resumeFailedChapters: "실패한 장 생성 재개",
  },
  vi: {
    generateKnowledge: "Tạo tổng quan kiến thức",
    resumeFailedChapters: "Tiếp tục tạo các chương lỗi",
  },
  th: {
    generateKnowledge: "สร้างภาพรวมความรู้",
    resumeFailedChapters: "สร้างบทที่ล้มเหลวต่อ",
  },
  id: {
    generateKnowledge: "Buat ringkasan pengetahuan",
    resumeFailedChapters: "Lanjutkan pembuatan bab gagal",
  },
  ms: {
    generateKnowledge: "Jana gambaran pengetahuan",
    resumeFailedChapters: "Sambung penjanaan bab yang gagal",
  },
  hi: {
    generateKnowledge: "ज्ञान अवलोकन बनाएं",
    resumeFailedChapters: "विफल अध्यायों का निर्माण फिर शुरू करें",
  },
  ar: {
    generateKnowledge: "إنشاء نظرة عامة معرفية",
    resumeFailedChapters: "استئناف إنشاء الفصول الفاشلة",
  },
  de: {
    generateKnowledge: "Wissensübersicht erstellen",
    resumeFailedChapters: "Fehlgeschlagene Kapitel fortsetzen",
  },
  fr: {
    generateKnowledge: "Générer une vue d'ensemble",
    resumeFailedChapters: "Reprendre les chapitres échoués",
  },
  es: {
    generateKnowledge: "Generar resumen de conocimiento",
    resumeFailedChapters: "Reanudar capítulos fallidos",
  },
  it: {
    generateKnowledge: "Genera panoramica della conoscenza",
    resumeFailedChapters: "Riprendi capitoli non riusciti",
  },
  pt: {
    generateKnowledge: "Gerar visão geral do conhecimento",
    resumeFailedChapters: "Retomar capítulos com falha",
  },
  nl: {
    generateKnowledge: "Kennisoverzicht genereren",
    resumeFailedChapters: "Mislukte hoofdstukken hervatten",
  },
  sv: {
    generateKnowledge: "Skapa kunskapsöversikt",
    resumeFailedChapters: "Återuppta misslyckade kapitel",
  },
  fi: {
    generateKnowledge: "Luo tietokatsaus",
    resumeFailedChapters: "Jatka epäonnistuneiden lukujen luontia",
  },
  pl: {
    generateKnowledge: "Wygeneruj przegląd wiedzy",
    resumeFailedChapters: "Wznów nieudane rozdziały",
  },
  tr: {
    generateKnowledge: "Bilgi genel bakışı oluştur",
    resumeFailedChapters: "Başarısız bölümleri sürdür",
  },
  ru: {
    generateKnowledge: "Создать обзор знаний",
    resumeFailedChapters: "Возобновить неудачные главы",
  },
};

export function getLanguageLabel(language: string): string {
  return LANGUAGE_OPTIONS[language] ?? language;
}

export function getHeaderText(language: string): HeaderText {
  return HEADER_TEXT[language] ?? HEADER_TEXT.en;
}

export function getUiText(language: string): UiText {
  return UI_TEXT[language] ?? UI_TEXT.en;
}
