import type {
  ChapterQualityReport,
  DensitySpec,
  DomainAdapter,
} from "./instructionalTypes";
import { sectionAppearsInText } from "./sectionHeadings";

export function countLearningChars(text: string): number {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s/g, "")
    .length;
}

export function evaluateChapterQuality(
  text: string,
  density: DensitySpec,
  adapter: DomainAdapter,
): ChapterQualityReport {
  const charCount = countLearningChars(text);
  const headingCount = (text.match(/^#{2,4}\s+/gm) ?? []).length;
  const exampleCount = (
    text.match(/例子|示例|案例|example|worked example/gi) ?? []
  ).length;
  const failureModeCount = (
    text.match(
      /誤解|误解|混淆|錯誤|错误|失敗|失败|修正|misconception|mistake|failure|pitfall|troubleshooting/gi,
    ) ?? []
  ).length;
  const questionCount = (text.match(/[？?]\s*$/gm) ?? []).length;
  const formulaCount = (text.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) ?? [])
    .length;
  const bulletLines = (text.match(/^\s*[-*]\s+/gm) ?? []).length;
  const paragraphBlocks = text
    .split(/\n\s*\n/)
    .filter((block) => block.trim().length > 120).length;

  const missingRequiredSections = adapter.requiredSections.filter((section) => {
    return !sectionAppearsInText(section, text);
  });

  return {
    charCount,
    headingCount,
    exampleCount,
    failureModeCount,
    questionCount,
    formulaCount,
    bulletLines,
    paragraphBlocks,
    glossaryInflationRisk: bulletLines > paragraphBlocks * 2,
    likelyTooShort: charCount < density.targetChars.min,
    likelyTooGlossaryLike: bulletLines > 40 && paragraphBlocks < 20,
    missingRequiredSections,
  };
}

export function shouldRepairChapter(report: ChapterQualityReport): boolean {
  return (
    report.likelyTooShort ||
    report.likelyTooGlossaryLike ||
    report.missingRequiredSections.length > 2
  );
}

export function formatQualityReport(report: ChapterQualityReport): string {
  return [
    `charCount: ${report.charCount}`,
    `headingCount: ${report.headingCount}`,
    `exampleCount: ${report.exampleCount}`,
    `failureModeCount: ${report.failureModeCount}`,
    `questionCount: ${report.questionCount}`,
    `formulaCount: ${report.formulaCount}`,
    `bulletLines: ${report.bulletLines}`,
    `paragraphBlocks: ${report.paragraphBlocks}`,
    `glossaryInflationRisk: ${report.glossaryInflationRisk}`,
    `likelyTooShort: ${report.likelyTooShort}`,
    `likelyTooGlossaryLike: ${report.likelyTooGlossaryLike}`,
    `missingRequiredSections: ${report.missingRequiredSections.join(", ") || "none"}`,
  ].join("\n");
}
