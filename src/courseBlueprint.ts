import { fallbackPlan } from "./instructionalPlanner";
import {
  COURSE_CHAPTER_RANGES,
  MAX_COURSE_CHAPTERS,
} from "./densityPresets";
import type {
  ChapterSpec,
  CourseBlueprint,
  KnowledgeDepth,
  KnowledgeType,
} from "./instructionalTypes";
import { parseChapterTitles } from "./utils";

export const MAX_BLUEPRINT_CHAPTERS = MAX_COURSE_CHAPTERS;
export const MAX_BLUEPRINT_COMPLETION_TOKENS = 16000;

/**
 * Respect a smaller user budget while keeping course planning bounded even
 * when an older installation carries a very large completion-token setting.
 */
export function resolveBlueprintMaxCompletionTokens(
  configuredMaxCompletionTokens: number | null,
): number {
  return Math.min(
    configuredMaxCompletionTokens ?? MAX_BLUEPRINT_COMPLETION_TOKENS,
    MAX_BLUEPRINT_COMPLETION_TOKENS,
  );
}

export interface CourseBlueprintParseOptions {
  enforceMinimumChapters?: boolean;
}

const BLUEPRINT_COMMENT_START = "<!-- knowledge-overview-blueprint";
const BLUEPRINT_COMMENT_PATTERN =
  /<!-- knowledge-overview-blueprint\s*([\s\S]*?)\s*-->/;

const KNOWLEDGE_TYPES: readonly KnowledgeType[] = [
  "conceptual",
  "mathematical",
  "procedural",
  "empirical",
  "craft",
  "historical",
  "interpretive",
  "argumentative",
  "case_based",
  "hybrid",
];

function cleanString(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/-->/g, "—>").trim()
    : "";
}

function readStringArray(value: unknown, limit = 20): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => cleanString(item))
        .filter((item) => item.length > 0),
    ),
  ).slice(0, limit);
}

function isKnowledgeType(value: unknown): value is KnowledgeType {
  return (
    typeof value === "string" &&
    KNOWLEDGE_TYPES.includes(value as KnowledgeType)
  );
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("Course blueprint did not contain a JSON object");
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
}

function fallbackChapterSpec(
  courseName: string,
  chapterNumber: string,
  title: string,
  depth: KnowledgeDepth,
): ChapterSpec {
  const plan = fallbackPlan(courseName, title, depth);

  return {
    chapterNumber,
    title,
    focus: title,
    subtopics: [],
    learningObjectives: [],
    prerequisites: [],
    outOfScope: [],
    knowledgeType: plan.primaryKnowledgeType,
    secondaryKnowledgeTypes: plan.secondaryKnowledgeTypes,
    canonicalTerms: [],
  };
}

function parseChapterSpec(
  value: unknown,
  index: number,
  courseName: string,
  depth: KnowledgeDepth,
): ChapterSpec | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const title = cleanString(raw.title);
  if (!title) {
    return null;
  }

  const fallback = fallbackChapterSpec(
    courseName,
    String(index + 1),
    title,
    depth,
  );
  const chapterNumber = cleanString(raw.chapterNumber) || String(index + 1);
  const knowledgeType = isKnowledgeType(raw.knowledgeType)
    ? raw.knowledgeType
    : fallback.knowledgeType;
  const secondaryKnowledgeTypes = readStringArray(
    raw.secondaryKnowledgeTypes,
    3,
  ).filter(
    (item): item is KnowledgeType =>
      isKnowledgeType(item) && item !== knowledgeType && item !== "hybrid",
  );

  return {
    chapterNumber,
    title,
    focus: cleanString(raw.focus) || title,
    subtopics: readStringArray(raw.subtopics, 10),
    learningObjectives: readStringArray(raw.learningObjectives, 8),
    prerequisites: readStringArray(raw.prerequisites, 8),
    outOfScope: readStringArray(raw.outOfScope, 8),
    knowledgeType,
    secondaryKnowledgeTypes,
    canonicalTerms: readStringArray(raw.canonicalTerms, 12),
  };
}

function normalizeBlueprint(
  value: unknown,
  courseName: string,
  depth: KnowledgeDepth,
): CourseBlueprint {
  if (!value || typeof value !== "object") {
    throw new Error("Course blueprint must be a JSON object");
  }

  const raw = value as Record<string, unknown>;
  const rawChapters = Array.isArray(raw.chapters) ? raw.chapters : [];
  const seenTitles = new Set<string>();
  const chapters: ChapterSpec[] = [];

  for (const [index, rawChapter] of rawChapters.entries()) {
    const chapter = parseChapterSpec(rawChapter, index, courseName, depth);
    if (!chapter) {
      continue;
    }

    const normalizedTitle = chapter.title.toLocaleLowerCase();
    if (seenTitles.has(normalizedTitle)) {
      continue;
    }

    seenTitles.add(normalizedTitle);
    chapters.push({
      ...chapter,
      chapterNumber: String(chapters.length + 1),
    });

    if (chapters.length === MAX_BLUEPRINT_CHAPTERS) {
      break;
    }
  }

  if (chapters.length === 0) {
    throw new Error("Course blueprint did not contain any usable chapters");
  }

  return {
    schemaVersion: 1,
    courseName: cleanString(raw.courseName) || courseName,
    courseGoal:
      cleanString(raw.courseGoal) ||
      `Build a practical overview of ${courseName}.`,
    prerequisites: readStringArray(raw.prerequisites, 12),
    canonicalTerms: readStringArray(raw.canonicalTerms, 30),
    chapters,
  };
}

function buildLegacyBlueprint(
  text: string,
  courseName: string,
  depth: KnowledgeDepth,
): CourseBlueprint {
  const chapters = parseChapterTitles(text)
    .slice(0, MAX_BLUEPRINT_CHAPTERS)
    .map(([chapterNumber, title]) =>
      fallbackChapterSpec(courseName, chapterNumber, title, depth),
    );

  if (chapters.length === 0) {
    throw new Error(
      "The outline response was neither valid blueprint JSON nor a numbered outline",
    );
  }

  return {
    schemaVersion: 1,
    courseName,
    courseGoal: `Build a practical overview of ${courseName}.`,
    prerequisites: [],
    canonicalTerms: [],
    chapters,
  };
}

/**
 * Parse the single course-planning response while retaining a legacy Markdown
 * fallback for providers that ignore the JSON-only instruction.
 */
export function parseCourseBlueprint(
  text: string,
  courseName: string,
  depth: KnowledgeDepth,
  options: CourseBlueprintParseOptions = {},
): CourseBlueprint {
  let blueprint: CourseBlueprint;
  try {
    blueprint = normalizeBlueprint(extractJsonObject(text), courseName, depth);
  } catch {
    blueprint = buildLegacyBlueprint(text, courseName, depth);
  }

  if (
    options.enforceMinimumChapters &&
    blueprint.chapters.length < COURSE_CHAPTER_RANGES[depth].minimum
  ) {
    throw new Error(
      `Course blueprint returned ${blueprint.chapters.length} usable chapters; ${depth} requires at least ${COURSE_CHAPTER_RANGES[depth].minimum}. No chapter requests were started.`,
    );
  }

  return blueprint;
}

export function renderCourseOutline(blueprint: CourseBlueprint): string {
  return blueprint.chapters
    .map((chapter, index) => {
      const lines = [`${index + 1}. ${chapter.title}`];
      if (chapter.focus) {
        lines.push(`   - ${chapter.focus}`);
      }
      chapter.subtopics.forEach((subtopic) => {
        lines.push(`   - ${subtopic}`);
      });
      return lines.join("\n");
    })
    .join("\n\n");
}

export function serializeBlueprintComment(blueprint: CourseBlueprint): string {
  return `${BLUEPRINT_COMMENT_START}\n${JSON.stringify(blueprint)}\n-->`;
}

export function parseBlueprintComment(text: string): CourseBlueprint | null {
  const match = text.match(BLUEPRINT_COMMENT_PATTERN);
  if (!match) {
    return null;
  }

  try {
    return normalizeBlueprint(
      JSON.parse(match[1]),
      "Recovered course",
      "onboarding",
    );
  } catch {
    return null;
  }
}

export function buildFallbackChapterSpec(
  courseName: string,
  chapterNumber: string,
  title: string,
  depth: KnowledgeDepth,
): ChapterSpec {
  return fallbackChapterSpec(courseName, chapterNumber, title, depth);
}
