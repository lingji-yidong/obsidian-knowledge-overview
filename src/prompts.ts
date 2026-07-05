import { getLanguageLabel } from "./i18n";
import { buildSectionHeadingContract } from "./sectionHeadings";
import type {
  ChapterGenerationPlan,
  ChapterQualityReport,
  DensitySpec,
  DomainAdapter,
  KnowledgeDepth,
} from "./instructionalTypes";

export function buildOutlinePrompt(courseName: string, language: string): string {
  const targetLanguage = getLanguageLabel(language);

  return `
請你作為大學課程助教，為指定課程整理一份高質量課程提綱。這份提綱用於快速建立背景知識，可服務於科研入門前的背景了解、課程複習、跨領域學習和專業交流準備。你需要考慮國際通用教學中這門課最主要的知識，包括經典內容、現代發展、核心概念、重要理論和典型應用。

輸出語言：${targetLanguage}
術語要求：主要內容使用「${targetLanguage}」。關鍵術語請用雙語展示，格式為（English Term, ${targetLanguage} Term）。

請按照以下格式輸出：
1. 一級章節標題
   - 子項目（English Term, ${targetLanguage} Term）
   - 子項目（English Term, ${targetLanguage} Term）

2. 一級章節標題
   - 子項目（English Term, ${targetLanguage} Term）
   - 子項目（English Term, ${targetLanguage} Term）

請確保：
1. 一級章節必須使用數字編號（1., 2., 3. 等）
2. 子項目使用短橫線（-）
3. 術語採用雙語對照格式：（English Term, ${targetLanguage} Term）
4. 內容應該涵蓋課程的核心概念、重要主題、基礎理論、典型方法和實際應用
5. 提綱應像正式教材或高質量課程 syllabus，不要寫成零散關鍵詞清單
6. 不要在正文中描述使用者的個人背景或準備流程；只輸出課程知識本身
7. 設計課程章節時，請根據領域調整章節類型：
   - conceptual chapters for theories and mechanisms
   - procedural chapters for tools and workflows
   - mathematical chapters for formulas and models
   - empirical chapters for data, experiments, and evaluation
   - craft chapters for techniques and quality standards
   - historical chapters for evolution and context

請為以下課程生成大綱（10-20個章節是可接受範圍）：

Course: ${courseName}
`;
}

function formatList(values: string[]): string {
  return values.map((value) => `- ${value}`).join("\n");
}

export function buildInstructionalSystemPrompt(): string {
  return [
    "You are an instructional designer.",
    "Your job is to generate usable learning chapters, not summaries or glossaries.",
    "Always adapt the chapter structure to the knowledge type.",
    "Do not force all topics into a concept-only format.",
    "Prioritize prerequisite bridges, examples, failure modes, and self-check tasks.",
    "Follow explicit length, density, and structure requirements.",
  ].join(" ");
}

export function buildChapterPrompt(args: {
  courseName: string,
  chapterName: string,
  language: string,
  depth: KnowledgeDepth,
  plan: ChapterGenerationPlan,
  adapter: DomainAdapter,
  density: DensitySpec,
}): string {
  const {
    courseName,
    chapterName,
    language,
    depth,
    plan,
    adapter,
    density,
  } = args;
  const targetLanguage = getLanguageLabel(language);
  const sectionHeadingContract = buildSectionHeadingContract(
    adapter.requiredSections,
    language,
  );
  const unitFieldHeadingContract = buildSectionHeadingContract(
    adapter.unitFields,
    language,
  ).map((heading) => heading.replace(/^##\s+/, "### "));

  return `你是一位嚴格的 instructional designer 與課程助教。

你的任務不是寫摘要、術語表或百科條目，而是生成一份可用於快速上手/學習的 Markdown 章節。

課程：${courseName}
章節：${chapterName}
輸出語言：${targetLanguage}

知識類型：${plan.primaryKnowledgeType}
次要知識類型：${plan.secondaryKnowledgeTypes.join(", ") || "none"}
核心學習單元類型：${plan.coreUnitType}
element interactivity：${plan.elementInteractivity}
學習深度：${density.label} (${depth})

術語要求：主要內容使用「${targetLanguage}」。關鍵術語請提供（English Term, ${targetLanguage} Term）雙語對照。
輸出方式：直接從章節內容開始，不要寒暄，不要稱呼讀者，不要說「好的」「同學」「這份筆記旨在」「我們將」等開場白，也不要解釋你將如何寫作。

# 知識密度契約

- 目標長度：${density.targetChars.min}-${density.targetChars.max} 個有效字符，理想約 ${density.targetChars.ideal}。
- 核心學習單元數量：${density.coreUnits.min}-${density.coreUnits.max} 個。
- Worked examples：至少 ${density.workedExamples} 個。
- Concrete examples：至少 ${density.concreteExamples} 個。
- Retrieval questions / practice tasks：至少 ${density.retrievalQuestions} 個。
- Failure modes：至少 ${density.failureModes} 個。
- 不要為了顯得全面而列出大量未展開術語。
- 如果本章太大，請明確拆成「本章聚焦」與「後續章節」，不要把 30 個概念壓縮成薄摘要。
- 每個核心學習單元至少需要 2-4 段解釋。
- 必須包含具體例子、常見失敗模式、自我檢查問題。

# 重要原則

- 不要強行把所有主題寫成概念型章節。
- 如果是 procedural topic，必須 task-first。
- 如果是 mathematical topic，必須解釋符號、單位、假設、公式直覺。
- 如果是 empirical topic，必須解釋資料、假設、bias、metrics、robustness。
- 如果是 craft topic，必須解釋材料、技法、感官/品質標準、失敗修正。
- 如果是 historical topic，不要只列時間線，必須解釋因果和演變。

# 必須包含的章節

請使用下面這份 exact Markdown H2 heading contract。不要改大小寫，不要改括號，不要改順序；可以在每個 H2 下面自行加入 H3 小標題。

${sectionHeadingContract.join("\n")}

標題格式規則：
- 章節 H2 必須使用「${targetLanguage} 標題 (Title Case English)」。
- 英文括號內必須使用 Title Case，例如 "Orientation"，不要輸出 "orientation"。
- 不要輸出純英文 required-section 標題，除非輸出語言本身就是 English。
- 不要使用 "orientation / 學習定位" 這類斜線格式。
- 本地品質檢查會依賴括號內的 English title。

# 每個核心學習單元必須包含

${formatList(adapter.unitFields)}

如果你把上述欄位寫成 Markdown 小標題，必須使用下面這份 exact Markdown H3 heading contract。不要輸出純英文小標題。

${unitFieldHeadingContract.join("\n")}

任何 Markdown heading 都必須是「${targetLanguage} 標題 (Title Case English)」格式。即使是 H3/H4 小標題，也不能只輸出 "Definition and Intuition"、"Why It Exists"、"Problem It Solves" 這類純英文標題。

# 例子要求

${formatList(adapter.exampleRequirements)}

# Planning step 補充要求

Required sections from plan:
${formatList(plan.requiredSections)}

Unit fields from plan:
${formatList(plan.unitFields)}

Must include examples from plan:
${formatList(plan.mustIncludeExamples)}

Common failure modes from plan:
${formatList(plan.commonFailureModes)}

Density risks to avoid:
${formatList(plan.densityRisks)}

# 常見失敗模式

至少列出 ${density.failureModes} 個 ${adapter.failureModeName}。
每個都要說明：
- 錯誤或失敗是什麼
- 為什麼容易發生
- 如何識別
- 如何修正

# 自我檢查

至少列出 ${density.retrievalQuestions} 個 retrieval questions 或 practice tasks。
問題應覆蓋：
- 定義
- 關係
- 應用
- 反例
- 遷移
- 錯誤診斷

# 公式格式

如果涉及公式：
   - 行內公式使用單美元符號，例如：$E = mc^2$
   - 獨立展示公式使用雙美元符號，且 $$ 必須單獨成行，例如：

$$
f(x) = \\sum_{n=0}^{\\infty} a_n x^n
$$

   - 不要把公式放進以三個反引號開頭的 latex/math fenced code block
   - 不要使用 Obsidian/KaTeX 不常支持的宏包命令；優先使用標準 LaTeX/KaTeX 語法
   - 每個重要公式後要解釋符號、單位、直覺、適用條件、限制

# 禁止事項

- 不要寫成 glossary。
- 不要用大量 bullet 代替解釋。
- 不要只列名詞。
- 不要用「本章將」「我們會」「這份筆記旨在」等空泛開場白。
- 不要描述使用者背景。
- 不要為了控制篇幅而犧牲概念橋樑。
- 如果內容低於最低長度，必須主動展開核心單元、例子和失敗模式，而不是提前結束。

請直接輸出 Markdown 章節內容。
`;
}

export function buildChapterRepairPrompt(args: {
  courseName: string;
  chapterName: string;
  language: string;
  density: DensitySpec;
  plan: ChapterGenerationPlan;
  adapter: DomainAdapter;
  qualityReport: ChapterQualityReport;
  formattedQualityReport: string;
  existingChapter: string;
}): string {
  const {
    courseName,
    chapterName,
    language,
    density,
    plan,
    adapter,
    formattedQualityReport,
    existingChapter,
  } = args;
  const targetLanguage = getLanguageLabel(language);
  const sectionHeadingContract = buildSectionHeadingContract(
    adapter.requiredSections,
    language,
  );
  const unitFieldHeadingContract = buildSectionHeadingContract(
    adapter.unitFields,
    language,
  ).map((heading) => heading.replace(/^##\s+/, "### "));

  return `下面是一份過短、過於跳躍或過於 glossary-like 的章節筆記。
請不要重寫成另一份摘要，而是在保留原有結構的基礎上擴寫成可學習的教學章節。

課程：${courseName}
章節：${chapterName}
輸出語言：${targetLanguage}
知識類型：${plan.primaryKnowledgeType}
核心學習單元類型：${plan.coreUnitType}
最低目標長度：${density.targetChars.min} 個有效字符

需要修復的問題：
${formattedQualityReport}

必須補足的章節：
請使用下面這份 exact Markdown H2 heading contract。不要改大小寫，不要改括號，不要改順序；可以在每個 H2 下面自行加入 H3 小標題。

${sectionHeadingContract.join("\n")}

標題格式規則：
- 章節 H2 必須使用「${targetLanguage} 標題 (Title Case English)」。
- 英文括號內必須使用 Title Case，例如 "Orientation"，不要輸出 "orientation"。
- 不要輸出純英文 required-section 標題，除非輸出語言本身就是 English。
- 不要使用 "orientation / 學習定位" 這類斜線格式。

每個核心學習單元必須補足：
${formatList(adapter.unitFields)}

如果你把上述欄位寫成 Markdown 小標題，必須使用下面這份 exact Markdown H3 heading contract。不要輸出純英文小標題。

${unitFieldHeadingContract.join("\n")}

任何 Markdown heading 都必須是「${targetLanguage} 標題 (Title Case English)」格式。即使是 H3/H4 小標題，也不能只輸出純英文標題。

擴寫要求：
1. 保留原有 Markdown 結構。
2. 不要刪除已有內容，除非它明顯錯誤。
3. 補充缺失的 required sections。
4. 為每個核心學習單元補充 adapter 要求的 fields。
5. 補充具體例子、worked examples、失敗模式、修正方法。
6. 補充 retrieval questions 或 practice tasks。
7. 不要把內容變成術語表。
8. 直接輸出完整擴寫後章節，不要解釋你做了什麼。

原章節如下：

${existingChapter}`;
}
