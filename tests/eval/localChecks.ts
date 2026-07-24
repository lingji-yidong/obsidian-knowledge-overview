import {
  evaluateChapterQuality,
  getChapterQualityWarnings,
  stripFencedCodeBlocks,
} from "../../src/chapterQuality";
import { stripChapterSectionNumber } from "../../src/chapter-numbering";
import { normalizeObsidianMathDelimiters } from "../../src/chapter-markdown";
import { DENSITY_PRESETS } from "../../src/densityPresets";
import { getLanguageLabel } from "../../src/i18n";
import type { EvaluationCase, LocalChapterMetrics } from "./types";

export const STRUCTURAL_LENGTH_FLOOR_RATIO = 0.8;

const GENERIC_H2_TITLES = new Set(
  [
    "introduction",
    "overview",
    "background",
    "core concepts",
    "basic concepts",
    "important principles",
    "examples",
    "applications",
    "common mistakes",
    "summary",
    "review questions",
    "interview questions",
    "導論",
    "概述",
    "背景",
    "基本概念",
    "核心概念",
    "重要原理",
    "例子",
    "案例",
    "實際應用",
    "常見錯誤",
    "常見誤區",
    "總結",
    "複習問題",
    "面試問題",
    "自我檢查",
    "导论",
    "概述",
    "背景",
    "基本概念",
    "核心概念",
    "重要原理",
    "例子",
    "案例",
    "实际应用",
    "常见错误",
    "常见误区",
    "总结",
    "复习问题",
    "面试问题",
    "自我检查",
  ].map((title) => title.toLocaleLowerCase()),
);

interface H2Entry {
  title: string;
  isQaSection: boolean;
  isTerminologySection: boolean;
}

function collectH2Entries(content: string): H2Entry[] {
  return Array.from(content.matchAll(/^##\s+(.+?)\s*$/gm)).map((match) => ({
    title: match[1].replace(/<!--[^>]*-->/g, "").trim(),
    isQaSection: /<!--\s*qa-section\s*-->/i.test(match[1]),
    isTerminologySection: /<!--\s*terminology-section\s*-->/i.test(match[1]),
  }));
}

function countInlineBilingualTerms(content: string): number {
  const terminologyBoundary = content.search(
    /^##\s+.+?<!--\s*terminology-section\s*-->\s*$/im,
  );
  const teachingAndQa = terminologyBoundary >= 0
    ? content.slice(0, terminologyBoundary)
    : content;
  const prose = stripFencedCodeBlocks(teachingAndQa)
    .split("\n")
    .filter((line) => !/^\s*(?:#|\|)/u.test(line))
    .join("\n");

  return (
    prose.match(
      /[\p{L}\p{N}][^()\n]{0,60}\(\s*[A-Za-z][A-Za-z0-9 /+&.'’-]{1,60}\s*\)/gu,
    ) ?? []
  ).length;
}

function inspectTerminologyColumns(
  content: string,
  language: string,
): {
  hasExpectedColumns: boolean;
  englishTermRowCount: number;
} {
  const boundary = content.search(
    /^##\s+.+?<!--\s*terminology-section\s*-->\s*$/im,
  );
  if (boundary < 0) {
    return { hasExpectedColumns: false, englishTermRowCount: 0 };
  }

  const tableLines = content
    .slice(boundary)
    .split("\n")
    .filter((line) => /^\s*\|.*\|\s*$/u.test(line));
  if (tableLines.length < 3) {
    return { hasExpectedColumns: false, englishTermRowCount: 0 };
  }

  const readCells = (line: string): string[] =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
  const headers = readCells(tableLines[0]);
  const expectedFirst = language === "en"
    ? "english term"
    : getLanguageLabel(language).toLocaleLowerCase();
  const expectedSecond = language === "en"
    ? "concise meaning"
    : "english";
  const hasExpectedColumns =
    headers.length === 2 &&
    headers[0].toLocaleLowerCase() === expectedFirst &&
    headers[1].toLocaleLowerCase() === expectedSecond;
  const englishTermRowCount = tableLines
    .slice(2)
    .map(readCells)
    .filter(
      (cells) =>
        cells.length === 2 &&
        cells[0].length > 0 &&
        /[A-Za-z]/u.test(cells[1]),
    ).length;

  return { hasExpectedColumns, englishTermRowCount };
}

function includesCaseInsensitive(content: string, term: string): boolean {
  const normalize = (value: string): string =>
    value.toLocaleLowerCase().replace(/[\s/／-]+/g, "");
  return normalize(content).includes(normalize(term));
}

/**
 * Calculate zero-API structural checks. Lexical scope checks are warnings only;
 * semantic scope fidelity and QA answerability belong to the Codex review.
 */
export function evaluateLocalChapter(
  evaluationCase: EvaluationCase,
  content: string,
): LocalChapterMetrics {
  const density = DENSITY_PRESETS[evaluationCase.depth];
  const quality = evaluateChapterQuality(content, density);
  const structuralLengthFloor = Math.floor(
    density.targetChars.min * STRUCTURAL_LENGTH_FLOOR_RATIO,
  );
  const meetsStructuralLengthFloor =
    quality.charCount >= structuralLengthFloor;
  const structureContent = stripFencedCodeBlocks(content);
  const h2Entries = collectH2Entries(structureContent);
  const h2Titles = h2Entries.map(({ title }) => title);
  const normalizedH2 = h2Entries
    .filter(
      ({ isQaSection, isTerminologySection }) =>
        !isQaSection && !isTerminologySection,
    )
    .map(({ title }) =>
      stripChapterSectionNumber(title).toLocaleLowerCase(),
    );
  const uniqueH2Ratio =
    normalizedH2.length === 0
      ? 0
      : new Set(normalizedH2).size / normalizedH2.length;
  const genericH2Count = normalizedH2.filter((title) =>
    GENERIC_H2_TITLES.has(title),
  ).length;
  const genericH2Ratio =
    normalizedH2.length === 0 ? 0 : genericH2Count / normalizedH2.length;
  const coveredMustCoverTerms = evaluationCase.lexicalExpectations.mustCover.filter(
    (term) => includesCaseInsensitive(content, term),
  );
  const missingMustCoverTerms =
    evaluationCase.lexicalExpectations.mustCover.filter(
      (term) => !includesCaseInsensitive(content, term),
    );
  const outOfScopeHits = evaluationCase.lexicalExpectations.outOfScope.filter(
    (term) => includesCaseInsensitive(content, term),
  );
  const qaAnchorCoverage =
    quality.questionCount === 0
      ? 0
      : Math.min(1, quality.qaAnchorCount / quality.questionCount);
  const usesUnsupportedMathDelimiters =
    normalizeObsidianMathDelimiters(content) !== content;
  const inlineBilingualTermCount = evaluationCase.language === "en"
    ? 0
    : countInlineBilingualTerms(content);
  const terminologyColumns = inspectTerminologyColumns(
    content,
    evaluationCase.language,
  );
  const warnings = getChapterQualityWarnings(quality);

  if (genericH2Ratio > 0.35) {
    warnings.push("too many generic H2 headings");
  }
  if (uniqueH2Ratio < 1) {
    warnings.push("duplicate H2 headings");
  }
  if (missingMustCoverTerms.length > 0) {
    warnings.push(
      `lexical coverage needs agent review: ${missingMustCoverTerms.join(", ")}`,
    );
  }
  if (outOfScopeHits.length > 0) {
    warnings.push(
      `possible out-of-scope content needs agent review: ${outOfScopeHits.join(", ")}`,
    );
  }
  if (!meetsStructuralLengthFloor) {
    warnings.push("far below the structural length floor");
  }
  if (usesUnsupportedMathDelimiters) {
    warnings.push("uses math delimiters that Obsidian does not render");
  }
  if (evaluationCase.language !== "en" && inlineBilingualTermCount < 5) {
    warnings.push("too few bilingual terms appear naturally before the final table");
  }
  if (quality.hasTerminologyTable && !terminologyColumns.hasExpectedColumns) {
    warnings.push("final terminology table does not use the required columns");
  }
  if (
    quality.hasTerminologyTable &&
    terminologyColumns.englishTermRowCount < 5
  ) {
    warnings.push("final terminology table contains too few English terms");
  }

  const structuralPass = !(
    !meetsStructuralLengthFloor ||
    quality.likelyTooLong ||
    quality.insufficientQuestionCount ||
    quality.insufficientH2Count ||
    quality.excessiveHeadingCount ||
    quality.headingDepthJump ||
    quality.hasOverdeepHeading ||
    quality.unexpectedH1 ||
    !quality.hasQaSectionBoundary ||
    quality.questionCount !== quality.qaAnchorCount ||
    quality.invalidQaAnchorCount > 0 ||
    genericH2Ratio > 0.35 ||
    uniqueH2Ratio < 1 ||
    usesUnsupportedMathDelimiters ||
    !quality.hasTerminologySectionBoundary ||
    !quality.hasTerminologyTable ||
    quality.terminologyRowCount < 5 ||
    !terminologyColumns.hasExpectedColumns ||
    terminologyColumns.englishTermRowCount < 5 ||
    (evaluationCase.language !== "en" && inlineBilingualTermCount < 5)
  );

  return {
    schemaVersion: 1,
    caseId: evaluationCase.id,
    quality,
    lengthGate: {
      targetMinimum: density.targetChars.min,
      structuralFloor: structuralLengthFloor,
      meetsTarget: !quality.likelyTooShort,
      meetsStructuralFloor: meetsStructuralLengthFloor,
    },
    headings: {
      h2Titles,
      h3Count: (structureContent.match(/^###\s+/gm) ?? []).length,
      uniqueH2Ratio,
      genericH2Count,
      genericH2Ratio,
    },
    qa: { anchorCoverage: qaAnchorCoverage },
    terminology: {
      hasSectionBoundary: quality.hasTerminologySectionBoundary,
      hasTable: quality.hasTerminologyTable,
      hasExpectedColumns: terminologyColumns.hasExpectedColumns,
      rowCount: quality.terminologyRowCount,
      englishTermRowCount: terminologyColumns.englishTermRowCount,
      inlineBilingualTermCount,
    },
    format: { usesUnsupportedMathDelimiters },
    lexicalScope: {
      coveredMustCoverTerms,
      missingMustCoverTerms,
      outOfScopeHits,
    },
    warnings,
    structuralPass,
  };
}

/** Find literal H2 skeletons repeated across multiple generated cases. */
export function findRepeatedHeadingSkeletons(
  metrics: LocalChapterMetrics[],
): Array<{ heading: string; caseCount: number }> {
  const headingCases = new Map<string, Set<string>>();

  for (const metric of metrics) {
    const functionalHeadingCount =
      Number(metric.quality.hasQaSectionBoundary) +
      Number(metric.quality.hasTerminologySectionBoundary);
    const headings = functionalHeadingCount > 0
      ? metric.headings.h2Titles.slice(0, -functionalHeadingCount)
      : metric.headings.h2Titles;
    for (const heading of headings) {
      const normalized = heading.trim().toLocaleLowerCase();
      const caseIds = headingCases.get(normalized) ?? new Set<string>();
      caseIds.add(metric.caseId);
      headingCases.set(normalized, caseIds);
    }
  }

  return Array.from(headingCases.entries())
    .filter(([, caseIds]) => caseIds.size > 1)
    .map(([heading, caseIds]) => ({ heading, caseCount: caseIds.size }))
    .sort((left, right) => right.caseCount - left.caseCount);
}
