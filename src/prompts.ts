import { getLanguageLabel } from "./i18n";

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

請為以下課程生成大綱（10-20個章節是可接受範圍）：

Course: ${courseName}
`;
}

export function buildChapterPrompt(
  courseName: string,
  chapterName: string,
  language: string,
): string {
  const targetLanguage = getLanguageLabel(language);

  return `請你作為大學課程助教，為指定課程章節撰寫一份高質量、內容充實的學習筆記。這份筆記用於快速建立背景知識，可服務於科研入門前的背景了解、課程複習、跨領域學習和專業交流準備。本次課程是「${courseName}」。請按照科學的學習路線，從導論和基本概念開始，逐步講到核心原理、重要定理、公式、例子、應用和易混淆點。

輸出語言：${targetLanguage}
術語要求：主要內容使用「${targetLanguage}」。關鍵術語請提供（English Term, ${targetLanguage} Term）雙語對照。
輸出方式：直接從章節內容開始，不要寒暄，不要稱呼讀者，不要說「好的」「同學」「這份筆記旨在」「我們將」等開場白，也不要解釋你將如何寫作。

請為以下章節生成詳細的知識點：${chapterName}

要求：
1. 內容要比簡短提綱更豐富，像給本科高年級學生的速成講義；不要只輸出幾個短 bullet
2. 先寫「導論與背景」：說明本章研究什麼問題、為什麼需要它、它在整門課中的位置，以及讀者應先知道哪些前置知識
3. 再寫「基本概念」：從最基礎的定義、直覺和術語開始，逐步建立概念，不要直接跳到高階結論
4. 然後寫「核心原理與重要定理」：系統涵蓋基本假設、重要定理、典型模型、算法或分析方法；每個核心概念都要有解釋性段落
5. 寫「公式與推導直覺」：給出必要公式，說明公式從哪裡來、每一項代表什麼、能解釋什麼現象
6. 寫「例子」：提供具體、帶上下文的例子，展示如何使用概念或公式，不要只給公式或關鍵詞
7. 寫「常見應用」：說明該章知識在工程、研究、跨學科或日常問題中的典型作用
8. 寫「易混淆點與常見誤解」：對容易混淆的概念做對比，指出常見錯誤理解
9. 寫「自我檢查問題」：列出 3-5 個能幫助讀者確認是否理解本章的問題
10. 關鍵術語提供英文與目標語言對照
11. 公式必須使用 Obsidian 內建 KaTeX 可解析的 Markdown 寫法：
   - 行內公式使用單美元符號，例如：$E = mc^2$
   - 獨立展示公式使用雙美元符號，且 $$ 必須單獨成行，例如：

$$
f(x) = \\sum_{n=0}^{\\infty} a_n x^n
$$

   - 不要把公式放進以三個反引號開頭的 latex/math fenced code block
   - 不要使用 Obsidian/KaTeX 不常支持的宏包命令；優先使用標準 LaTeX/KaTeX 語法
   - 每個重要公式後要解釋符號含義和直覺
12. 建議使用以下結構：
   - 導論與背景
   - 基本概念
   - 重要原理與定理
   - 公式與推導直覺
   - 例子
   - 常見應用
   - 易混淆點與常見誤解
   - 自我檢查問題
   - 關鍵術語對照
13. 不要在正文中描述使用者的個人背景或準備流程；只輸出章節知識本身
`;
}

