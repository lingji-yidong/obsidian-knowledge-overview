import { getLanguageLabel, getReviewQuestionHeading } from "./i18n";
import {
  COURSE_CHAPTER_RANGES,
  MAX_COURSE_CHAPTERS,
} from "./densityPresets";
import type {
  ChapterContext,
  ChapterGenerationPlan,
  DensitySpec,
  DomainAdapter,
  KnowledgeDepth,
} from "./instructionalTypes";

function formatList(values: string[], emptyLabel = "none"): string {
  return values.length > 0
    ? values.map((value) => `- ${value}`).join("\n")
    : `- ${emptyLabel}`;
}

export function buildOutlinePrompt(
  courseName: string,
  language: string,
  depth: KnowledgeDepth,
): string {
  const targetLanguage = getLanguageLabel(language);
  const chapterRange = COURSE_CHAPTER_RANGES[depth];

  return `Design one coherent course blueprint for rapid knowledge acquisition,
review, and interview preparation.

Course: ${courseName}
Output language: ${targetLanguage}
Requested depth: ${depth}

Return strict JSON only. Do not use Markdown fences or add commentary.

Schema:
{
  "schemaVersion": 1,
  "courseName": "localized course name",
  "courseGoal": "one precise scope statement",
  "prerequisites": ["knowledge the course may assume"],
  "canonicalTerms": ["consistent term or symbol used across chapters"],
  "chapters": [
    {
      "chapterNumber": "1",
      "title": "specific, useful chapter title",
      "focus": "what this chapter teaches and why it is here",
      "subtopics": ["4-8 bounded subtopics"],
      "learningObjectives": ["3-6 observable outcomes"],
      "prerequisites": ["concepts this chapter may assume"],
      "outOfScope": ["material reserved for another chapter"],
      "knowledgeType": "conceptual | mathematical | procedural | empirical | craft | historical | interpretive | argumentative | case_based | hybrid",
      "secondaryKnowledgeTypes": ["at most two types from the same list except hybrid"],
      "canonicalTerms": ["chapter terms whose wording must remain consistent"]
    }
  ]
}

Blueprint rules:
- Prefer ${chapterRange.preferredMin}-${chapterRange.preferredMax} chapters for this depth.
- Never return fewer than ${chapterRange.minimum} usable chapters or more than ${MAX_COURSE_CHAPTERS} chapters.
- Preserve textbook-like subject coverage. Review and overview modes may compress exposition, but must not merge distinct foundational topics merely to reduce chapter count.
- For a genuinely broad subject, use additional well-bounded chapters up to the hard cap instead of creating a few oversized survey chapters.
- Sequence prerequisites before dependent material.
- Give every chapter a clear boundary; avoid duplicate coverage.
- Each chapter should support a focused chapter of roughly 10,000 effective characters, not a mini textbook.
- Use mathematical or empirical structures only when the subject needs them.
- For literature and textual study, use interpretive.
- For philosophy, ethics, theory debates, or normative questions, use argumentative.
- For institutions, policy, and comparative social-science cases, use case_based.
- Preserve important disagreements and evidence limits in humanities subjects.
- Use ${targetLanguage} for titles and prose. Canonical terms may include English in parentheses when useful.`;
}

export function buildInstructionalSystemPrompt(): string {
  return [
    "You write focused learning chapters for rapid mastery and review.",
    "Treat the course blueprint as the scope boundary.",
    "Teach concepts before testing them.",
    "Use headings as meaningful navigation, not as a repeated form template.",
    "Prefer depth on a bounded set of ideas over encyclopedic coverage.",
  ].join(" ");
}

export function buildChapterPrompt(args: {
  context: ChapterContext;
  language: string;
  depth: KnowledgeDepth;
  plan: ChapterGenerationPlan;
  adapter: DomainAdapter;
  density: DensitySpec;
}): string {
  const { context, language, depth, plan, adapter, density } = args;
  const { blueprint, chapter, previousChapter, nextChapter } = context;
  const targetLanguage = getLanguageLabel(language);
  const reviewQuestionHeading = getReviewQuestionHeading(language);

  return `Write one self-contained Markdown learning chapter.

# Course context

Course: ${blueprint.courseName}
Course goal: ${blueprint.courseGoal}
Course prerequisites:
${formatList(blueprint.prerequisites)}

Canonical course terms:
${formatList(blueprint.canonicalTerms)}

Previous chapter: ${previousChapter ? `${previousChapter.title} — ${previousChapter.focus}` : "none"}
Current chapter: ${chapter.title}
Current focus: ${chapter.focus}
Next chapter: ${nextChapter ? `${nextChapter.title} — ${nextChapter.focus}` : "none"}

This chapter must cover:
${formatList(chapter.subtopics)}

Learning objectives:
${formatList(chapter.learningObjectives)}

Allowed prerequisites:
${formatList(chapter.prerequisites)}

Explicitly out of scope:
${formatList(chapter.outOfScope)}

Canonical chapter terms:
${formatList(chapter.canonicalTerms)}

# Teaching contract

Output language: ${targetLanguage}
Knowledge type: ${plan.primaryKnowledgeType}
Secondary types: ${plan.secondaryKnowledgeTypes.join(", ") || "none"}
Depth: ${density.label} (${depth})

- Target ${density.targetChars.min}-${density.targetChars.max} effective characters; aim near ${density.targetChars.ideal}.
- Effective characters means non-whitespace learning content, not words, Markdown bytes, or hidden metadata. Reach the range by deepening explanations, evidence, and worked reasoning rather than adding filler.
- Treat ${density.targetChars.max} as an upper bound. Narrow examples before exceeding it.
- Usually develop ${density.coreUnits.min}-${density.coreUnits.max} core learning units. Treat this as planning guidance, not a quota: use one fewer or one more when the chapter's natural conceptual structure clearly requires it, without padding or fragmenting coherent ideas.
- Include at least ${density.concreteExamples} concrete examples and ${density.workedExamples} worked examples when the topic permits.
- Explain approximately ${density.failureModes} important misconceptions, failure modes, objections, or evidence limits.
- End with ${density.retrievalQuestions} review or interview questions.
- Use the available chapter budget. Do not begin the final questions until every named subtopic and learning objective has received enough explanation, evidence, or worked reasoning to stand on its own.
- If space is tight, remove repeated introductions, conclusions, and decorative examples before shortening the teaching body.
- Do not introduce a large glossary or try to mention every related concept.
- Do not repeat material assigned to the previous or next chapter.

Pedagogical roles to cover naturally when relevant:
${formatList(adapter.requiredSections)}

Useful fields for the chapter's core learning units; integrate them into prose rather than turning every field into a heading:
${formatList(adapter.unitFields)}

Domain-specific requirements:
${formatList(adapter.exampleRequirements)}

Reliability rules for this chapter's actual knowledge type:
${formatList(adapter.reliabilityRules)}

# Heading rules

- Use 4-8 topic-specific teaching H2 headings that explain what the section teaches, then one final QA H2; the chapter must have 5-9 H2 headings in total.
- H2 teaching headings should form a clear learning progression.
- Do not add section-number prefixes to headings; the application adds chapter-aware numbering after generation.
- Prefer connected explanatory paragraphs. Do not turn each example, misconception, field, or workflow step into its own heading.
- Use H3 only when a teaching section genuinely contains a substantial subordinate idea. Use at most one H3 under any teaching H2 and at most six H3 headings in the whole chapter; many H2 sections need no H3 at all.
- Never use H4 or deeper headings. Keep worked-example steps, definitions, cases, and short contrasts inside their teaching section as paragraphs, bold lead-ins, or a compact list instead of promoting them to headings.
- Use bullet or numbered lists only for real sequences, comparisons, compact checklists, or parallel items. For non-procedural chapters, keep most exposition in paragraphs and normally stay below 40 bullet lines.
- Never repeat generic headings such as Definition, Why It Exists, Example, or Common Mistakes for every unit.
- Do not use a fixed adapter field as a literal heading unless it is the clearest title for this specific chapter.
- Do not force bilingual parentheses into every heading. Give a bilingual term only at its first useful appearance in the prose.

# Context and QA consistency

- Define every non-prerequisite concept before relying on it.
- Keep terminology and mathematical symbols consistent with the blueprint.
- Treat explicitly out-of-scope items as prohibited, including optional asides and advanced exceptions.
- Every review question must be answerable from the chapter body without outside knowledge.
- A question may combine at most two claims explicitly taught in the body.
- Do not introduce a new concept, formula, historical fact, text, author, procedure, or case for the first time in a question.
- End the teaching body with this exact localized H2 line:
  ## ${reviewQuestionHeading} <!-- qa-section -->
- Put only the requested numbered questions under that final H2. Do not add a summary, answer key, or another heading after it.
- After every question, on the same line, add an invisible source anchor using the exact H2 title that teaches the answer:
  <!-- source: Exact H2 Title -->
- The source comment is metadata; do not explain it to the reader.

# Rich Markdown and formula format

- Use tables, callouts, compact lists, or other standard Markdown structures when they make a comparison or explanation clearer than prose alone.
- When a relationship, process, hierarchy, or state transition genuinely benefits from a visual and you can write valid Mermaid syntax, you may include one concise fenced diagram whose info string is \`mermaid\`. Mermaid is optional: do not use it as decoration or when a table, formula, or short explanation is clearer. Explain the diagram's important meaning in the surrounding prose.
- Use Obsidian-compatible KaTeX for every mathematical or chemical formula that needs typesetting.
- Inline formulas must use one dollar sign on each side, for example: \`$E = mc^2$\`.
- Display formulas must use double dollar signs on separate lines before and after the formula.
- Never use \`\\(...\\)\` or \`\\[...\\]\` as math delimiters. Never place formulas in a fenced \`latex\` or \`math\` code block.
- Define important symbols, units, and assumptions after each major formula.

# Final self-check

- Before answering, remove any claim whose factual precision you cannot support; state uncertainty when the uncertainty matters.
- Verify that the body contains no H1 or H4/deeper headings, has 4-8 teaching H2 sections plus the one marked QA H2, uses no more than one H3 per teaching H2 and no more than six H3 headings in total, and stays within the requested scope.
- Verify that every final question appears after the <!-- qa-section --> H2 boundary, is taught before that boundary, and cites one exact existing teaching H2 on the same line.
- Verify that every typeset formula uses only \`$...$\` or standalone \`$$\` delimiters and that every Mermaid block has valid syntax.

Start directly with the chapter content. Do not greet the reader, describe the writing process, or add a second H1 title.`;
}
