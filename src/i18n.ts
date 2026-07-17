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

const REVIEW_QUESTION_HEADING_TEXT: Record<string, string> = {
  en: "Review and interview questions",
  zh: "复习与面试问题",
  zh_tw: "複習與面試問題",
  ja: "復習と面接の質問",
  ko: "복습 및 면접 질문",
  vi: "Câu hỏi ôn tập và phỏng vấn",
  th: "คำถามทบทวนและสัมภาษณ์",
  id: "Pertanyaan tinjauan dan wawancara",
  ms: "Soalan ulang kaji dan temu duga",
  hi: "पुनरावलोकन और साक्षात्कार प्रश्न",
  ar: "أسئلة المراجعة والمقابلة",
  de: "Wiederholungs- und Interviewfragen",
  fr: "Questions de révision et d’entretien",
  es: "Preguntas de repaso y entrevista",
  it: "Domande di ripasso e colloquio",
  pt: "Perguntas de revisão e entrevista",
  nl: "Herhalings- en interviewvragen",
  sv: "Repetitions- och intervjufrågor",
  fi: "Kertaus- ja haastattelukysymykset",
  pl: "Pytania powtórkowe i rekrutacyjne",
  tr: "Tekrar ve mülakat soruları",
  ru: "Вопросы для повторения и собеседования",
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
  cancelActiveGeneration: string;
}

export interface SettingDescriptionText {
  apiKey: string;
  apiBaseUrl: string;
  outlineModel: string;
  chapterModel: string;
  knowledgeType: string;
  minimumChapterCharacters: string;
  maxCompletionTokens: string;
  temperature: string;
  reasoningEffort: string;
  verbosity: string;
  chapterConcurrency: string;
  language: string;
}

export interface KnowledgeDepthDescriptionText {
  scan: string;
  onboarding: string;
  learn: string;
  review: string;
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

const UI_TEXT: Record<string, Omit<UiText, "cancelActiveGeneration">> = {
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

const SETTING_DESCRIPTION_TEXT: Record<string, SettingDescriptionText> = {
  en: {
    apiKey: "Your provider API key. The default endpoint uses Google's OpenAI-compatible Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM model for generating course outlines.",
    chapterModel: "LLM model for generating chapter details.",
    knowledgeType: "Use Auto for planning-based classification, or force a chapter structure.",
    minimumChapterCharacters: "Used by the quality evaluator and repair pass for long-form chapters.",
    maxCompletionTokens: "Advanced. Output token limit passed as max_completion_tokens. Set a larger value if your provider truncates long chapters.",
    temperature: "Advanced. Leave empty to omit this provider option.",
    reasoningEffort: "Advanced provider-specific option. Leave unset unless your provider supports it.",
    verbosity: "Advanced provider-specific option. Leave unset unless your provider supports it.",
    chapterConcurrency: "Manual concurrency for chapter generation. Default is 1; increase only if your provider is stable under parallel requests.",
    language: "Output language preference.",
  },
  zh: {
    apiKey: "你的供应商 API key。默认端点使用 Google 的 OpenAI-compatible Gemini API。",
    apiBaseUrl: "OpenAI-compatible API base URL。",
    outlineModel: "用于生成课程大纲的 LLM 模型。",
    chapterModel: "用于生成章节内容的 LLM 模型。",
    knowledgeType: "使用 Auto 进行规划式分类，或强制指定章节结构。",
    minimumChapterCharacters: "供质量检查器和修复扩写流程判断长章节是否足够充实。",
    maxCompletionTokens: "高级设置。作为 max_completion_tokens 传递的输出 token 上限；如果供应商截断长章节，请调大。",
    temperature: "高级设置。留空则不发送此供应商选项。",
    reasoningEffort: "高级供应商特定选项。除非供应商支持，否则保持未设置。",
    verbosity: "高级供应商特定选项。除非供应商支持，否则保持未设置。",
    chapterConcurrency: "章节生成的手动并发数。默认为 1；只有供应商能稳定处理并行请求时才提高。",
    language: "输出语言偏好。",
  },
  zh_tw: {
    apiKey: "你的供應商 API key。預設端點使用 Google 的 OpenAI-compatible Gemini API。",
    apiBaseUrl: "OpenAI-compatible API base URL。",
    outlineModel: "用於生成課程大綱的 LLM 模型。",
    chapterModel: "用於生成章節內容的 LLM 模型。",
    knowledgeType: "使用 Auto 進行規劃式分類，或強制指定章節結構。",
    minimumChapterCharacters: "供品質檢查器與修復擴寫流程判斷長章節是否足夠充實。",
    maxCompletionTokens: "進階設定。作為 max_completion_tokens 傳遞的輸出 token 上限；如果供應商截斷長章節，請調大。",
    temperature: "進階設定。留空則不送出此供應商選項。",
    reasoningEffort: "進階供應商特定選項。除非供應商支援，否則保持未設定。",
    verbosity: "進階供應商特定選項。除非供應商支援，否則保持未設定。",
    chapterConcurrency: "章節生成的手動並發數。預設為 1；只有供應商能穩定處理並行請求時才提高。",
    language: "輸出語言偏好。",
  },
  ja: {
    apiKey: "プロバイダーの API key です。既定のエンドポイントは Google の OpenAI-compatible Gemini API を使います。",
    apiBaseUrl: "OpenAI-compatible API base URL。",
    outlineModel: "コースアウトライン生成に使う LLM モデル。",
    chapterModel: "章の詳細生成に使う LLM モデル。",
    knowledgeType: "Auto で計画ベースの分類を使うか、章構造を強制指定します。",
    minimumChapterCharacters: "長文の章が十分に充実しているかを品質評価と修復パスで判断するために使います。",
    maxCompletionTokens: "詳細設定。max_completion_tokens として渡す出力 token 上限です。長い章が切れる場合は大きくしてください。",
    temperature: "詳細設定。空欄にすると、このプロバイダーオプションは送信しません。",
    reasoningEffort: "詳細なプロバイダー固有オプションです。対応している場合だけ設定してください。",
    verbosity: "詳細なプロバイダー固有オプションです。対応している場合だけ設定してください。",
    chapterConcurrency: "章生成の手動並列数。既定値は 1 です。プロバイダーが並列リクエストに安定している場合だけ増やしてください。",
    language: "出力言語の設定。",
  },
  ko: {
    apiKey: "공급자 API key입니다. 기본 엔드포인트는 Google의 OpenAI-compatible Gemini API를 사용합니다.",
    apiBaseUrl: "OpenAI-compatible API base URL입니다.",
    outlineModel: "강의 개요를 생성하는 LLM 모델입니다.",
    chapterModel: "장 세부 내용을 생성하는 LLM 모델입니다.",
    knowledgeType: "Auto로 계획 기반 분류를 사용하거나 장 구조를 강제로 지정합니다.",
    minimumChapterCharacters: "긴 장이 충분히 충실한지 품질 평가기와 수정 확장 단계에서 판단하는 데 사용합니다.",
    maxCompletionTokens: "고급 설정입니다. max_completion_tokens로 전달되는 출력 token 한도입니다. 긴 장이 잘리면 값을 높이세요.",
    temperature: "고급 설정입니다. 비워 두면 이 공급자 옵션을 보내지 않습니다.",
    reasoningEffort: "고급 공급자별 옵션입니다. 공급자가 지원할 때만 설정하세요.",
    verbosity: "고급 공급자별 옵션입니다. 공급자가 지원할 때만 설정하세요.",
    chapterConcurrency: "장 생성의 수동 동시성입니다. 기본값은 1이며, 공급자가 병렬 요청을 안정적으로 처리할 때만 올리세요.",
    language: "출력 언어 설정입니다.",
  },
  vi: {
    apiKey: "API key của nhà cung cấp. Điểm cuối mặc định dùng Gemini API tương thích OpenAI của Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Mô hình LLM dùng để tạo dàn ý khóa học.",
    chapterModel: "Mô hình LLM dùng để tạo nội dung chi tiết cho từng chương.",
    knowledgeType: "Dùng Auto để phân loại bằng bước lập kế hoạch, hoặc ép cấu trúc chương.",
    minimumChapterCharacters: "Dùng cho bộ đánh giá chất lượng và bước sửa mở rộng để kiểm tra chương dài có đủ nội dung hay không.",
    maxCompletionTokens: "Nâng cao. Giới hạn token đầu ra truyền qua max_completion_tokens. Tăng giá trị nếu nhà cung cấp cắt ngắn chương dài.",
    temperature: "Nâng cao. Để trống để không gửi tùy chọn nhà cung cấp này.",
    reasoningEffort: "Tùy chọn nâng cao theo nhà cung cấp. Chỉ đặt nếu nhà cung cấp hỗ trợ.",
    verbosity: "Tùy chọn nâng cao theo nhà cung cấp. Chỉ đặt nếu nhà cung cấp hỗ trợ.",
    chapterConcurrency: "Số chương tạo song song thủ công. Mặc định là 1; chỉ tăng nếu nhà cung cấp xử lý song song ổn định.",
    language: "Tùy chọn ngôn ngữ đầu ra.",
  },
  th: {
    apiKey: "API key ของผู้ให้บริการ ปลายทางเริ่มต้นใช้ Gemini API ของ Google ที่เข้ากันได้กับ OpenAI",
    apiBaseUrl: "OpenAI-compatible API base URL",
    outlineModel: "โมเดล LLM สำหรับสร้างโครงร่างคอร์ส",
    chapterModel: "โมเดล LLM สำหรับสร้างรายละเอียดของบท",
    knowledgeType: "ใช้ Auto เพื่อจำแนกด้วยขั้นตอนวางแผน หรือบังคับใช้โครงสร้างบทที่กำหนด",
    minimumChapterCharacters: "ใช้โดยตัวประเมินคุณภาพและขั้นตอนซ่อมแซมเพื่อดูว่าบทยาวมีเนื้อหาเพียงพอหรือไม่",
    maxCompletionTokens: "ขั้นสูง ขีดจำกัด token เอาต์พุตที่ส่งเป็น max_completion_tokens เพิ่มค่านี้หากผู้ให้บริการตัดบทยาว",
    temperature: "ขั้นสูง เว้นว่างไว้เพื่อไม่ส่งตัวเลือกนี้ให้ผู้ให้บริการ",
    reasoningEffort: "ตัวเลือกขั้นสูงเฉพาะผู้ให้บริการ ตั้งค่าเฉพาะเมื่อผู้ให้บริการรองรับ",
    verbosity: "ตัวเลือกขั้นสูงเฉพาะผู้ให้บริการ ตั้งค่าเฉพาะเมื่อผู้ให้บริการรองรับ",
    chapterConcurrency: "จำนวนบทที่สร้างพร้อมกันแบบกำหนดเอง ค่าเริ่มต้นคือ 1 เพิ่มเฉพาะเมื่อผู้ให้บริการรองรับคำขอขนานได้เสถียร",
    language: "ภาษาที่ต้องการสำหรับเอาต์พุต",
  },
  id: {
    apiKey: "API key penyedia Anda. Endpoint default menggunakan Gemini API Google yang kompatibel dengan OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Model LLM untuk membuat garis besar kursus.",
    chapterModel: "Model LLM untuk membuat detail bab.",
    knowledgeType: "Gunakan Auto untuk klasifikasi berbasis perencanaan, atau paksa struktur bab.",
    minimumChapterCharacters: "Dipakai oleh evaluator kualitas dan pass perbaikan untuk menilai apakah bab panjang sudah cukup padat.",
    maxCompletionTokens: "Lanjutan. Batas token keluaran yang dikirim sebagai max_completion_tokens. Naikkan jika penyedia memotong bab panjang.",
    temperature: "Lanjutan. Biarkan kosong untuk tidak mengirim opsi penyedia ini.",
    reasoningEffort: "Opsi lanjutan khusus penyedia. Biarkan tidak disetel kecuali penyedia mendukungnya.",
    verbosity: "Opsi lanjutan khusus penyedia. Biarkan tidak disetel kecuali penyedia mendukungnya.",
    chapterConcurrency: "Konkurensi manual untuk pembuatan bab. Default 1; naikkan hanya jika penyedia stabil menangani permintaan paralel.",
    language: "Preferensi bahasa keluaran.",
  },
  ms: {
    apiKey: "API key penyedia anda. Endpoint lalai menggunakan Gemini API Google yang serasi OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Model LLM untuk menjana rangka kursus.",
    chapterModel: "Model LLM untuk menjana butiran bab.",
    knowledgeType: "Gunakan Auto untuk klasifikasi berasaskan perancangan, atau paksa struktur bab.",
    minimumChapterCharacters: "Digunakan oleh penilai kualiti dan pusingan pembaikan untuk menilai sama ada bab panjang cukup lengkap.",
    maxCompletionTokens: "Lanjutan. Had token output yang dihantar sebagai max_completion_tokens. Tingkatkan jika penyedia memotong bab panjang.",
    temperature: "Lanjutan. Biarkan kosong untuk tidak menghantar pilihan penyedia ini.",
    reasoningEffort: "Pilihan lanjutan khusus penyedia. Biarkan tidak ditetapkan kecuali penyedia menyokongnya.",
    verbosity: "Pilihan lanjutan khusus penyedia. Biarkan tidak ditetapkan kecuali penyedia menyokongnya.",
    chapterConcurrency: "Konkuren manual untuk penjanaan bab. Lalai ialah 1; tingkatkan hanya jika penyedia stabil dengan permintaan selari.",
    language: "Keutamaan bahasa output.",
  },
  hi: {
    apiKey: "आपके प्रदाता की API key। डिफ़ॉल्ट endpoint Google की OpenAI-compatible Gemini API का उपयोग करता है।",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "कोर्स आउटलाइन बनाने के लिए LLM मॉडल।",
    chapterModel: "अध्याय विवरण बनाने के लिए LLM मॉडल।",
    knowledgeType: "योजना-आधारित वर्गीकरण के लिए Auto उपयोग करें, या अध्याय संरचना को बाध्य करें।",
    minimumChapterCharacters: "लंबे अध्याय पर्याप्त रूप से विस्तृत हैं या नहीं, यह गुणवत्ता मूल्यांकन और सुधार चरण में जाँचने के लिए उपयोग होता है।",
    maxCompletionTokens: "उन्नत। max_completion_tokens के रूप में भेजी जाने वाली आउटपुट token सीमा। यदि प्रदाता लंबे अध्याय काटता है तो इसे बढ़ाएँ।",
    temperature: "उन्नत। इस प्रदाता विकल्प को न भेजने के लिए खाली छोड़ें।",
    reasoningEffort: "उन्नत प्रदाता-विशिष्ट विकल्प। केवल तब सेट करें जब प्रदाता इसका समर्थन करता हो।",
    verbosity: "उन्नत प्रदाता-विशिष्ट विकल्प। केवल तब सेट करें जब प्रदाता इसका समर्थन करता हो।",
    chapterConcurrency: "अध्याय निर्माण के लिए मैनुअल concurrency। डिफ़ॉल्ट 1 है; केवल तब बढ़ाएँ जब प्रदाता parallel requests पर स्थिर हो।",
    language: "आउटपुट भाषा प्राथमिकता।",
  },
  ar: {
    apiKey: "API key الخاص بالمزوّد. يستخدم المسار الافتراضي Gemini API المتوافق مع OpenAI من Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "نموذج LLM المستخدم لإنشاء مخططات الدورات.",
    chapterModel: "نموذج LLM المستخدم لإنشاء تفاصيل الفصول.",
    knowledgeType: "استخدم Auto للتصنيف المعتمد على التخطيط، أو افرض بنية فصل محددة.",
    minimumChapterCharacters: "يستخدمه مقيم الجودة ومرحلة الإصلاح لتحديد ما إذا كان الفصل الطويل كافيا.",
    maxCompletionTokens: "إعداد متقدم. حد رموز الإخراج المرسل باسم max_completion_tokens. ارفعه إذا كان المزوّد يقطع الفصول الطويلة.",
    temperature: "إعداد متقدم. اتركه فارغا لعدم إرسال هذا الخيار إلى المزوّد.",
    reasoningEffort: "خيار متقدم خاص بالمزوّد. اتركه غير مضبوط إلا إذا كان المزوّد يدعمه.",
    verbosity: "خيار متقدم خاص بالمزوّد. اتركه غير مضبوط إلا إذا كان المزوّد يدعمه.",
    chapterConcurrency: "عدد الفصول المتزامنة في التوليد يدويا. الافتراضي 1؛ زد القيمة فقط إذا كان المزوّد مستقرا مع الطلبات المتوازية.",
    language: "تفضيل لغة الإخراج.",
  },
  de: {
    apiKey: "Ihr Anbieter-API-key. Der Standard-Endpunkt nutzt Googles OpenAI-kompatible Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-Modell zum Erstellen von Kursgliederungen.",
    chapterModel: "LLM-Modell zum Erstellen von Kapiteldetails.",
    knowledgeType: "Auto für planungsbasierte Klassifikation verwenden oder eine Kapitelstruktur erzwingen.",
    minimumChapterCharacters: "Wird vom Qualitätsprüfer und Reparaturdurchlauf genutzt, um lange Kapitel auf ausreichende Dichte zu prüfen.",
    maxCompletionTokens: "Erweitert. Ausgabelimit für token, das als max_completion_tokens gesendet wird. Erhöhen, wenn lange Kapitel abgeschnitten werden.",
    temperature: "Erweitert. Leer lassen, um diese Anbieteroption nicht zu senden.",
    reasoningEffort: "Erweiterte anbieterspezifische Option. Nur setzen, wenn der Anbieter sie unterstützt.",
    verbosity: "Erweiterte anbieterspezifische Option. Nur setzen, wenn der Anbieter sie unterstützt.",
    chapterConcurrency: "Manuelle Parallelität für Kapitelerzeugung. Standard ist 1; nur erhöhen, wenn der Anbieter parallele Anfragen stabil verarbeitet.",
    language: "Bevorzugte Ausgabesprache.",
  },
  fr: {
    apiKey: "Votre API key fournisseur. Le point de terminaison par défaut utilise l'API Gemini de Google compatible OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Modèle LLM utilisé pour générer les plans de cours.",
    chapterModel: "Modèle LLM utilisé pour générer les détails des chapitres.",
    knowledgeType: "Utilisez Auto pour une classification basée sur la planification, ou forcez une structure de chapitre.",
    minimumChapterCharacters: "Utilisé par l'évaluateur de qualité et le passage de réparation pour vérifier qu'un chapitre long est assez dense.",
    maxCompletionTokens: "Avancé. Limite de token de sortie transmise via max_completion_tokens. Augmentez-la si le fournisseur tronque les longs chapitres.",
    temperature: "Avancé. Laissez vide pour ne pas envoyer cette option fournisseur.",
    reasoningEffort: "Option avancée propre au fournisseur. Ne la définissez que si le fournisseur la prend en charge.",
    verbosity: "Option avancée propre au fournisseur. Ne la définissez que si le fournisseur la prend en charge.",
    chapterConcurrency: "Concurrence manuelle pour la génération des chapitres. La valeur par défaut est 1; augmentez-la seulement si le fournisseur gère bien les requêtes parallèles.",
    language: "Préférence de langue de sortie.",
  },
  es: {
    apiKey: "Tu API key del proveedor. El endpoint predeterminado usa la API Gemini de Google compatible con OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Modelo LLM para generar esquemas de cursos.",
    chapterModel: "Modelo LLM para generar detalles de capítulos.",
    knowledgeType: "Usa Auto para clasificación basada en planificación, o fuerza una estructura de capítulo.",
    minimumChapterCharacters: "Lo usan el evaluador de calidad y el paso de reparación para comprobar si los capítulos largos tienen suficiente contenido.",
    maxCompletionTokens: "Avanzado. Límite de token de salida enviado como max_completion_tokens. Auméntalo si el proveedor corta capítulos largos.",
    temperature: "Avanzado. Déjalo vacío para omitir esta opción del proveedor.",
    reasoningEffort: "Opción avanzada específica del proveedor. Déjala sin configurar salvo que tu proveedor la admita.",
    verbosity: "Opción avanzada específica del proveedor. Déjala sin configurar salvo que tu proveedor la admita.",
    chapterConcurrency: "Concurrencia manual para generación de capítulos. El valor predeterminado es 1; súbelo solo si el proveedor maneja bien solicitudes paralelas.",
    language: "Preferencia de idioma de salida.",
  },
  it: {
    apiKey: "La tua API key del provider. L'endpoint predefinito usa l'API Gemini di Google compatibile con OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Modello LLM per generare le scalette dei corsi.",
    chapterModel: "Modello LLM per generare i dettagli dei capitoli.",
    knowledgeType: "Usa Auto per una classificazione basata sulla pianificazione, oppure forza una struttura di capitolo.",
    minimumChapterCharacters: "Usato dal valutatore di qualità e dal passaggio di riparazione per verificare se i capitoli lunghi sono abbastanza densi.",
    maxCompletionTokens: "Avanzato. Limite di token in uscita inviato come max_completion_tokens. Aumentalo se il provider tronca i capitoli lunghi.",
    temperature: "Avanzato. Lascia vuoto per omettere questa opzione del provider.",
    reasoningEffort: "Opzione avanzata specifica del provider. Lasciala non impostata salvo supporto del provider.",
    verbosity: "Opzione avanzata specifica del provider. Lasciala non impostata salvo supporto del provider.",
    chapterConcurrency: "Concorrenza manuale per la generazione dei capitoli. Il valore predefinito è 1; aumentala solo se il provider gestisce bene richieste parallele.",
    language: "Preferenza della lingua di output.",
  },
  pt: {
    apiKey: "Sua API key do provedor. O endpoint padrão usa a API Gemini do Google compatível com OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Modelo LLM para gerar esboços de cursos.",
    chapterModel: "Modelo LLM para gerar detalhes dos capítulos.",
    knowledgeType: "Use Auto para classificação baseada em planejamento, ou force uma estrutura de capítulo.",
    minimumChapterCharacters: "Usado pelo avaliador de qualidade e pela etapa de reparo para verificar se capítulos longos têm conteúdo suficiente.",
    maxCompletionTokens: "Avançado. Limite de token de saída enviado como max_completion_tokens. Aumente se o provedor truncar capítulos longos.",
    temperature: "Avançado. Deixe vazio para omitir esta opção do provedor.",
    reasoningEffort: "Opção avançada específica do provedor. Deixe sem definir a menos que o provedor suporte.",
    verbosity: "Opção avançada específica do provedor. Deixe sem definir a menos que o provedor suporte.",
    chapterConcurrency: "Concorrência manual para geração de capítulos. O padrão é 1; aumente somente se o provedor lidar bem com solicitações paralelas.",
    language: "Preferência de idioma de saída.",
  },
  nl: {
    apiKey: "Uw provider-API key. Het standaardendpoint gebruikt Google's OpenAI-compatibele Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-model voor het genereren van cursusoverzichten.",
    chapterModel: "LLM-model voor het genereren van hoofdstukdetails.",
    knowledgeType: "Gebruik Auto voor planning-gebaseerde classificatie, of forceer een hoofdstukstructuur.",
    minimumChapterCharacters: "Wordt gebruikt door de kwaliteitsbeoordelaar en reparatiestap om te controleren of lange hoofdstukken voldoende inhoud hebben.",
    maxCompletionTokens: "Geavanceerd. Uitvoer-tokenlimiet die als max_completion_tokens wordt verzonden. Verhoog dit als de provider lange hoofdstukken afkapt.",
    temperature: "Geavanceerd. Laat leeg om deze provideroptie niet te verzenden.",
    reasoningEffort: "Geavanceerde provider-specifieke optie. Laat oningesteld tenzij uw provider dit ondersteunt.",
    verbosity: "Geavanceerde provider-specifieke optie. Laat oningesteld tenzij uw provider dit ondersteunt.",
    chapterConcurrency: "Handmatige concurrency voor hoofdstukgeneratie. Standaard is 1; verhoog alleen als de provider parallelle verzoeken stabiel verwerkt.",
    language: "Voorkeur voor uitvoertaal.",
  },
  sv: {
    apiKey: "Din leverantörs API key. Standardendpointen använder Googles OpenAI-kompatibla Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-modell för att generera kursöversikter.",
    chapterModel: "LLM-modell för att generera kapiteldetaljer.",
    knowledgeType: "Använd Auto för planeringsbaserad klassificering, eller tvinga en kapitelstruktur.",
    minimumChapterCharacters: "Används av kvalitetsutvärderaren och reparationssteget för att kontrollera att långa kapitel är tillräckligt fylliga.",
    maxCompletionTokens: "Avancerat. Gräns för utdata-token som skickas som max_completion_tokens. Höj om leverantören kapar långa kapitel.",
    temperature: "Avancerat. Lämna tomt för att utelämna detta leverantörsalternativ.",
    reasoningEffort: "Avancerat leverantörsspecifikt alternativ. Lämna unset om inte leverantören stöder det.",
    verbosity: "Avancerat leverantörsspecifikt alternativ. Lämna unset om inte leverantören stöder det.",
    chapterConcurrency: "Manuell concurrency för kapitelgenerering. Standard är 1; höj bara om leverantören hanterar parallella förfrågningar stabilt.",
    language: "Inställning för utdataspråk.",
  },
  fi: {
    apiKey: "Palveluntarjoajan API key. Oletuspäätepiste käyttää Googlen OpenAI-yhteensopivaa Gemini APIa.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-malli kurssirakenteiden luomiseen.",
    chapterModel: "LLM-malli lukujen yksityiskohtien luomiseen.",
    knowledgeType: "Käytä Auto-valintaa suunnittelupohjaiseen luokitteluun tai pakota luvun rakenne.",
    minimumChapterCharacters: "Laadunarvioija ja korjausvaihe käyttävät tätä tarkistaakseen, ovatko pitkät luvut riittävän kattavia.",
    maxCompletionTokens: "Lisäasetus. max_completion_tokens-kenttänä lähetettävä tulosteen token-raja. Kasvata arvoa, jos palveluntarjoaja katkaisee pitkät luvut.",
    temperature: "Lisäasetus. Jätä tyhjäksi, jos et halua lähettää tätä palveluntarjoajan asetusta.",
    reasoningEffort: "Edistynyt palveluntarjoajakohtainen asetus. Jätä asettamatta, ellei palveluntarjoaja tue sitä.",
    verbosity: "Edistynyt palveluntarjoajakohtainen asetus. Jätä asettamatta, ellei palveluntarjoaja tue sitä.",
    chapterConcurrency: "Manuaalinen concurrency lukujen generointiin. Oletus on 1; nosta vain, jos palveluntarjoaja käsittelee rinnakkaispyynnöt vakaasti.",
    language: "Tulostekielen asetus.",
  },
  pl: {
    apiKey: "API key Twojego dostawcy. Domyślny endpoint używa zgodnego z OpenAI Gemini API od Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Model LLM do generowania konspektów kursów.",
    chapterModel: "Model LLM do generowania szczegółów rozdziałów.",
    knowledgeType: "Użyj Auto do klasyfikacji opartej na planowaniu albo wymuś strukturę rozdziału.",
    minimumChapterCharacters: "Używane przez ocenę jakości i krok naprawy, aby sprawdzić, czy długie rozdziały są wystarczająco treściwe.",
    maxCompletionTokens: "Zaawansowane. Limit token wyjściowych wysyłany jako max_completion_tokens. Zwiększ, jeśli dostawca ucina długie rozdziały.",
    temperature: "Zaawansowane. Zostaw puste, aby nie wysyłać tej opcji dostawcy.",
    reasoningEffort: "Zaawansowana opcja specyficzna dla dostawcy. Zostaw nieustawione, chyba że dostawca ją obsługuje.",
    verbosity: "Zaawansowana opcja specyficzna dla dostawcy. Zostaw nieustawione, chyba że dostawca ją obsługuje.",
    chapterConcurrency: "Ręczna concurrency dla generowania rozdziałów. Domyślnie 1; zwiększaj tylko, gdy dostawca stabilnie obsługuje równoległe żądania.",
    language: "Preferowany język wyjściowy.",
  },
  tr: {
    apiKey: "Sağlayıcı API key'iniz. Varsayılan endpoint Google'ın OpenAI uyumlu Gemini API'sini kullanır.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Ders taslakları oluşturmak için LLM modeli.",
    chapterModel: "Bölüm ayrıntıları oluşturmak için LLM modeli.",
    knowledgeType: "Planlama tabanlı sınıflandırma için Auto kullanın veya bölüm yapısını zorlayın.",
    minimumChapterCharacters: "Kalite değerlendirici ve onarım geçişi tarafından uzun bölümlerin yeterince dolu olup olmadığını kontrol etmek için kullanılır.",
    maxCompletionTokens: "Gelişmiş. max_completion_tokens olarak gönderilen çıktı token sınırı. Sağlayıcı uzun bölümleri kesiyorsa artırın.",
    temperature: "Gelişmiş. Bu sağlayıcı seçeneğini göndermemek için boş bırakın.",
    reasoningEffort: "Gelişmiş sağlayıcıya özel seçenek. Sağlayıcı desteklemiyorsa ayarlamayın.",
    verbosity: "Gelişmiş sağlayıcıya özel seçenek. Sağlayıcı desteklemiyorsa ayarlamayın.",
    chapterConcurrency: "Bölüm üretimi için manuel concurrency. Varsayılan 1'dir; yalnızca sağlayıcı paralel isteklerde kararlıysa artırın.",
    language: "Çıktı dili tercihi.",
  },
  ru: {
    apiKey: "API key вашего провайдера. Endpoint по умолчанию использует совместимый с OpenAI Gemini API от Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-модель для создания планов курсов.",
    chapterModel: "LLM-модель для создания подробностей глав.",
    knowledgeType: "Используйте Auto для классификации на основе планирования или задайте структуру главы вручную.",
    minimumChapterCharacters: "Используется оценщиком качества и этапом исправления, чтобы проверить, достаточно ли содержательна длинная глава.",
    maxCompletionTokens: "Расширенная настройка. Лимит выходных token, передаваемый как max_completion_tokens. Увеличьте, если провайдер обрезает длинные главы.",
    temperature: "Расширенная настройка. Оставьте пустым, чтобы не отправлять эту опцию провайдеру.",
    reasoningEffort: "Расширенная опция конкретного провайдера. Оставьте не заданной, если провайдер ее не поддерживает.",
    verbosity: "Расширенная опция конкретного провайдера. Оставьте не заданной, если провайдер ее не поддерживает.",
    chapterConcurrency: "Ручная concurrency для генерации глав. По умолчанию 1; увеличивайте только если провайдер стабильно обрабатывает параллельные запросы.",
    language: "Предпочтительный язык вывода.",
  },
};

const DEFAULT_LABEL_TEXT: Record<string, string> = {
  en: "Default",
  zh: "默认",
  zh_tw: "預設",
  ja: "既定値",
  ko: "기본값",
  vi: "Mặc định",
  th: "ค่าเริ่มต้น",
  id: "Default",
  ms: "Lalai",
  hi: "डिफ़ॉल्ट",
  ar: "الافتراضي",
  de: "Standard",
  fr: "Par défaut",
  es: "Predeterminado",
  it: "Predefinito",
  pt: "Padrão",
  nl: "Standaard",
  sv: "Standard",
  fi: "Oletus",
  pl: "Domyślnie",
  tr: "Varsayılan",
  ru: "По умолчанию",
};

const KNOWLEDGE_DEPTH_DESCRIPTION_TEXT: Record<string, KnowledgeDepthDescriptionText> = {
  en: {
    scan: "High-level map of key topics.",
    onboarding: "Clear overview with essential details.",
    learn: "In-depth explanation with examples.",
    review: "Concise refresher for quick review.",
  },
  zh: {
    scan: "快速建立主题地图。",
    onboarding: "清晰概览核心知识。",
    learn: "深入讲解并配例子。",
    review: "适合快速复习巩固。",
  },
  zh_tw: {
    scan: "快速建立主題地圖。",
    onboarding: "清晰概覽核心知識。",
    learn: "深入講解並配例子。",
    review: "適合快速複習鞏固。",
  },
  ja: {
    scan: "主要トピックを俯瞰します。",
    onboarding: "要点を押さえた明快な概観。",
    learn: "例を交えて深く学びます。",
    review: "短時間の復習に向きます。",
  },
  ko: {
    scan: "핵심 주제의 큰 지도를 만듭니다.",
    onboarding: "필수 내용을 담은 명확한 개요입니다.",
    learn: "예시와 함께 깊이 설명합니다.",
    review: "빠른 복습에 적합합니다.",
  },
  vi: {
    scan: "Lập bản đồ nhanh các chủ đề chính.",
    onboarding: "Tổng quan rõ ràng với chi tiết cần thiết.",
    learn: "Giải thích sâu kèm ví dụ.",
    review: "Ôn tập nhanh và cô đọng.",
  },
  th: {
    scan: "ทำแผนที่หัวข้อหลักแบบรวดเร็ว",
    onboarding: "ภาพรวมชัดเจนพร้อมรายละเอียดสำคัญ",
    learn: "อธิบายเชิงลึกพร้อมตัวอย่าง",
    review: "ทบทวนแบบกระชับและรวดเร็ว",
  },
  id: {
    scan: "Peta cepat untuk topik utama.",
    onboarding: "Ikhtisar jelas dengan detail penting.",
    learn: "Penjelasan mendalam dengan contoh.",
    review: "Ringkasan cepat untuk mengulang.",
  },
  ms: {
    scan: "Peta ringkas topik utama.",
    onboarding: "Gambaran jelas dengan butiran penting.",
    learn: "Penjelasan mendalam bersama contoh.",
    review: "Ulangan ringkas dan pantas.",
  },
  hi: {
    scan: "मुख्य विषयों का तेज़ मानचित्र।",
    onboarding: "ज़रूरी विवरणों के साथ स्पष्ट अवलोकन।",
    learn: "उदाहरणों सहित गहरी व्याख्या।",
    review: "त्वरित पुनरावृत्ति के लिए संक्षिप्त।",
  },
  ar: {
    scan: "خريطة سريعة للموضوعات الأساسية.",
    onboarding: "نظرة عامة واضحة مع التفاصيل الضرورية.",
    learn: "شرح عميق مع أمثلة.",
    review: "مراجعة موجزة وسريعة.",
  },
  de: {
    scan: "Schnelle Karte der Kernthemen.",
    onboarding: "Klarer Überblick mit den wichtigsten Details.",
    learn: "Tiefe Erklärung mit Beispielen.",
    review: "Knapp zum schnellen Wiederholen.",
  },
  fr: {
    scan: "Carte rapide des sujets clés.",
    onboarding: "Vue d'ensemble claire avec les détails essentiels.",
    learn: "Explication approfondie avec exemples.",
    review: "Révision rapide et concise.",
  },
  es: {
    scan: "Mapa rápido de los temas clave.",
    onboarding: "Resumen claro con detalles esenciales.",
    learn: "Explicación profunda con ejemplos.",
    review: "Repaso rápido y conciso.",
  },
  it: {
    scan: "Mappa rapida dei temi chiave.",
    onboarding: "Panoramica chiara con dettagli essenziali.",
    learn: "Spiegazione approfondita con esempi.",
    review: "Ripasso rapido e conciso.",
  },
  pt: {
    scan: "Mapa rápido dos tópicos principais.",
    onboarding: "Visão geral clara com detalhes essenciais.",
    learn: "Explicação profunda com exemplos.",
    review: "Revisão rápida e concisa.",
  },
  nl: {
    scan: "Snelle kaart van kernthema's.",
    onboarding: "Helder overzicht met essentiële details.",
    learn: "Diepe uitleg met voorbeelden.",
    review: "Korte opfrisser voor snelle herhaling.",
  },
  sv: {
    scan: "Snabb karta över kärnämnen.",
    onboarding: "Tydlig översikt med viktiga detaljer.",
    learn: "Djup förklaring med exempel.",
    review: "Kort repetition för snabb översyn.",
  },
  fi: {
    scan: "Nopea kartta keskeisistä aiheista.",
    onboarding: "Selkeä yleiskuva tärkeillä yksityiskohdilla.",
    learn: "Syvä selitys esimerkkien kanssa.",
    review: "Tiivis kertaus nopeaan tarkistukseen.",
  },
  pl: {
    scan: "Szybka mapa kluczowych tematów.",
    onboarding: "Jasny przegląd z najważniejszymi szczegółami.",
    learn: "Głębokie wyjaśnienie z przykładami.",
    review: "Krótka powtórka do szybkiego przeglądu.",
  },
  tr: {
    scan: "Ana konuların hızlı haritası.",
    onboarding: "Temel ayrıntılarla net bir genel bakış.",
    learn: "Örneklerle derin açıklama.",
    review: "Hızlı tekrar için kısa özet.",
  },
  ru: {
    scan: "Быстрая карта ключевых тем.",
    onboarding: "Ясный обзор с важными деталями.",
    learn: "Подробное объяснение с примерами.",
    review: "Краткое повторение для быстрого обзора.",
  },
};

export function getLanguageLabel(language: string): string {
  return LANGUAGE_OPTIONS[language] ?? language;
}

export function getReviewQuestionHeading(language: string): string {
  return REVIEW_QUESTION_HEADING_TEXT[language] ??
    REVIEW_QUESTION_HEADING_TEXT.en;
}

export function getHeaderText(language: string): HeaderText {
  return HEADER_TEXT[language] ?? HEADER_TEXT.en;
}

export function getUiText(language: string): UiText {
  const uiText = UI_TEXT[language] ?? UI_TEXT.en;
  const cancelText: Record<string, string> = {
    en: "Cancel active knowledge generation",
    zh: "取消当前知识概览生成",
    zh_tw: "取消目前知識概覽生成",
  };

  return {
    ...uiText,
    cancelActiveGeneration: cancelText[language] ?? cancelText.en,
  };
}

export function getSettingDescriptionText(language: string): SettingDescriptionText {
  const descriptions =
    SETTING_DESCRIPTION_TEXT[language] ?? SETTING_DESCRIPTION_TEXT.en;
  const updatedDescriptions: Record<
    string,
    Pick<SettingDescriptionText, "knowledgeType" | "minimumChapterCharacters">
  > = {
    en: {
      knowledgeType:
        "Auto uses the course blueprint classification, or you can force a chapter structure.",
      minimumChapterCharacters:
        "Used by the local quality check. It never triggers another model request.",
    },
    zh: {
      knowledgeType: "Auto 使用课程蓝图中的分类，也可以强制指定章节结构。",
      minimumChapterCharacters:
        "供本地质量检查使用，不会触发额外模型请求。",
    },
    zh_tw: {
      knowledgeType: "Auto 使用課程藍圖中的分類，也可以強制指定章節結構。",
      minimumChapterCharacters:
        "供本地品質檢查使用，不會觸發額外模型請求。",
    },
  };
  const updated = updatedDescriptions[language] ?? updatedDescriptions.en;

  return { ...descriptions, ...updated };
}

export function getDefaultLabel(language: string): string {
  return DEFAULT_LABEL_TEXT[language] ?? DEFAULT_LABEL_TEXT.en;
}

export function getKnowledgeDepthDescriptionText(
  language: string,
): KnowledgeDepthDescriptionText {
  return (
    KNOWLEDGE_DEPTH_DESCRIPTION_TEXT[language] ??
    KNOWLEDGE_DEPTH_DESCRIPTION_TEXT.en
  );
}
