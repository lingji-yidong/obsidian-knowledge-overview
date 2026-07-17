import type {
  ChapterQualityReport,
  DensitySpec,
} from "./instructionalTypes";

const QA_SOURCE_PATTERN = /<!--\s*source:\s*([^>]+?)\s*-->/gi;
const QA_SOURCE_TEST_PATTERN = /<!--\s*source:\s*[^>]+?\s*-->/i;
const QA_SECTION_BOUNDARY_PATTERN =
  /^##\s+.+?<!--\s*qa-section\s*-->\s*$/i;
const ORDERED_ITEM_PATTERN = /^ {0,3}\d+[.)、]\s+/;

interface QaSection {
  content: string;
  hasBoundary: boolean;
}

function findQaSection(text: string): QaSection {
  const lines = text.split("\n");
  const boundaryIndex = lines.findIndex((line) =>
    QA_SECTION_BOUNDARY_PATTERN.test(line),
  );

  return boundaryIndex >= 0
    ? {
        content: lines.slice(boundaryIndex + 1).join("\n"),
        hasBoundary: true,
      }
    : { content: text, hasBoundary: false };
}

function countReviewQuestions(text: string): number {
  const { content } = findQaSection(text);
  const lines = content.split("\n");
  const candidateLists: Array<{ count: number; hasSourceAnchor: boolean }> = [];
  let itemCount = 0;
  let listStart = -1;

  const finishList = (end: number): void => {
    if (itemCount === 0 || listStart < 0) return;
    candidateLists.push({
      count: itemCount,
      hasSourceAnchor: QA_SOURCE_TEST_PATTERN.test(
        lines.slice(listStart, end).join("\n"),
      ),
    });
    itemCount = 0;
    listStart = -1;
  };

  lines.forEach((line, index) => {
    if (ORDERED_ITEM_PATTERN.test(line)) {
      if (listStart < 0) listStart = index;
      itemCount += 1;
      return;
    }
    if (
      listStart >= 0 &&
      line.trim().length > 0 &&
      !/^\s+/.test(line) &&
      !QA_SOURCE_TEST_PATTERN.test(line)
    ) {
      finishList(index);
    }
  });
  finishList(lines.length);

  for (let index = candidateLists.length - 1; index >= 0; index -= 1) {
    const candidate = candidateLists[index];
    if (candidate.hasSourceAnchor) return candidate.count;
  }

  // Keep compatibility with providers that return unnumbered question lines.
  return (content.match(/[？?]\s*(?:<!--[^>]+-->)?\s*$/gm) ?? []).length;
}

export function countLearningChars(text: string): number {
  return text
    .replace(/```[^\n]*\n?/g, "")
    .replace(/<!--[^>]*-->/g, "")
    .replace(/\s/g, "")
    .length;
}

/** Remove fenced code before interpreting Markdown-only structural syntax. */
export function stripFencedCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "");
}

function hasHeadingDepthJump(text: string): boolean {
  const levels = Array.from(text.matchAll(/^(#{2,4})\s+/gm)).map(
    (match) => match[1].length,
  );

  return levels.some(
    (level, index) => index > 0 && level > levels[index - 1] + 1,
  );
}

function collectHeadingTitles(text: string): Set<string> {
  return new Set(
    Array.from(text.matchAll(/^##\s+(.+?)\s*$/gm))
      .filter((match) => !/<!--\s*qa-section\s*-->/i.test(match[1]))
      .map((match) =>
        match[1]
          .replace(/<!--[^>]*-->/g, "")
          .trim()
          .toLocaleLowerCase(),
      ),
  );
}

function collectQaAnchors(text: string): string[] {
  const { content } = findQaSection(text);
  return Array.from(content.matchAll(QA_SOURCE_PATTERN)).map((match) =>
    match[1].trim().toLocaleLowerCase(),
  );
}

export function evaluateChapterQuality(
  text: string,
  density: DensitySpec,
): ChapterQualityReport {
  const charCount = countLearningChars(text);
  const structureText = stripFencedCodeBlocks(text);
  const headings = structureText.match(/^#{2,4}\s+/gm) ?? [];
  const headingCount = headings.length;
  const h2Count = (structureText.match(/^##\s+/gm) ?? []).length;
  const exampleCount = (
    text.match(/例子|示例|案例|example|worked example/gi) ?? []
  ).length;
  const failureModeCount = (
    text.match(
      /誤解|误解|混淆|錯誤|错误|失敗|失败|修正|misconception|mistake|failure|pitfall|troubleshooting/gi,
    ) ?? []
  ).length;
  const questionCount = countReviewQuestions(text);
  const qaAnchors = collectQaAnchors(text);
  const hasQaSectionBoundary = findQaSection(text).hasBoundary;
  const headingTitles = collectHeadingTitles(structureText);
  const invalidQaAnchorCount = qaAnchors.filter(
    (anchor) => !headingTitles.has(anchor),
  ).length;
  const formulaCount = (text.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) ?? [])
    .length;
  const bulletLines = (text.match(/^\s*[-*]\s+/gm) ?? []).length;
  const paragraphBlocks = text
    .split(/\n\s*\n/)
    .filter((block) => block.trim().length > 120).length;
  const maxHeadingCount = Math.max(18, Math.ceil(charCount / 700));

  return {
    charCount,
    headingCount,
    h2Count,
    exampleCount,
    failureModeCount,
    questionCount,
    qaAnchorCount: qaAnchors.length,
    invalidQaAnchorCount,
    hasQaSectionBoundary,
    formulaCount,
    bulletLines,
    paragraphBlocks,
    glossaryInflationRisk: bulletLines > paragraphBlocks * 2,
    likelyTooShort: charCount < density.targetChars.min,
    likelyTooLong: charCount > density.targetChars.max,
    likelyTooGlossaryLike: bulletLines > 40 && paragraphBlocks < 20,
    insufficientQuestionCount:
      questionCount < density.retrievalQuestions,
    insufficientH2Count: h2Count < 5,
    excessiveHeadingCount: headingCount > maxHeadingCount || h2Count > 9,
    headingDepthJump: hasHeadingDepthJump(structureText),
    hasOverdeepHeading: /^#{4,}\s+/m.test(structureText),
    unexpectedH1: /^#\s+/m.test(structureText),
  };
}

export function getChapterQualityWarnings(
  report: ChapterQualityReport,
): string[] {
  const warnings: string[] = [];

  if (report.likelyTooShort) warnings.push("below the chapter length target");
  if (report.likelyTooLong) warnings.push("above the chapter length target");
  if (report.likelyTooGlossaryLike) warnings.push("too glossary-like");
  if (report.insufficientQuestionCount) {
    warnings.push("too few grounded review questions");
  }
  if (report.insufficientH2Count) warnings.push("too few H2 sections");
  if (report.excessiveHeadingCount) warnings.push("too many headings");
  if (report.headingDepthJump) warnings.push("heading levels skip a level");
  if (report.hasOverdeepHeading) warnings.push("uses H4 or deeper headings");
  if (report.unexpectedH1) warnings.push("chapter body contains an extra H1 title");
  if (report.questionCount !== report.qaAnchorCount) {
    warnings.push("review questions must each cite exactly one source section");
  }
  if (report.invalidQaAnchorCount > 0) {
    warnings.push("some review-question source sections do not exist");
  }
  if (!report.hasQaSectionBoundary) {
    warnings.push("missing deterministic QA section boundary");
  }

  return warnings;
}
