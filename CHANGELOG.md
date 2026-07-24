# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

## 0.0.11

- Restore important English terminology at natural first-use points in
  non-English chapter prose and add a compact final user-language/English
  terminology table.
- Add deterministic terminology structure checks and regression coverage
  without increasing the normal model-request budget.
- Keep non-blocking quality diagnostics in developer logs instead of presenting
  them as warning-filled user notifications.
- Update the development-only `fast-uri` lock entry to the patched release
  reported clean by `npm audit`.

## 0.0.10

- Move the Node-only generation evaluation harness under `tests/eval/` so
  automated plugin scans do not treat test tooling as mobile runtime code.
- Add Obsidian 1.13 searchable setting definitions while preserving the shared
  legacy settings UI for Obsidian 1.12.7.
- Remove remaining source and CSS compatibility warnings and verify that the
  release bundle contains neither Node.js built-ins nor evaluation tooling.

## 0.0.9

- Replace per-chapter model planning with one reusable course blueprint so the
  normal request budget is one outline request plus one request per chapter.
- Remove automatic whole-chapter repair requests and add local length,
  hierarchy, and review-question anchor warnings.
- Add targeted provider capability fallback, typed HTTP errors, bounded
  transient retries, Retry-After support, exponential jitter, and request
  telemetry.
- Add run isolation, immutable run settings, cooperative cancellation, a global
  request boundary, chapter-count and logical-request budgets, and safe resume
  context recovery.
- Restore topic-specific headings, target chapters near 10,000 effective
  characters, ground review questions in taught sections, and add interpretive,
  argumentative, and case-based humanities structures.
- Expand offline regression coverage for request counts, retry behavior,
  concurrency, blueprints, prompts, and chapter quality.
- Add per-chapter model and provider-reported token provenance without
  inventing usage when a compatible API omits it.
- Add a generator-only live evaluation harness with a fixed STEM/humanities
  corpus, dry-run confirmation, spend guards, immediate checkpoints, local
  structural checks, and an explicit Codex semantic-review packet.
- Add DeepSeek V4 request compatibility, explicit evaluation thinking-mode
  control, empty-final-response detection, and reasoning-token provenance.
- Make product and evaluation thinking control provider-neutral with `auto`,
  `enabled`, and `disabled` modes while keeping hidden reasoning out of
  generated notes.
- Use depth-aware textbook-like chapter ranges and reject undersized production
  blueprints before any chapter-generation requests are started.
- Inject only the active domain's reliability rules into chapter prompts, with
  stronger empirical-design and historical-fact boundaries and less repeated
  cross-domain prompt noise.
- Add reproducible evaluation reasoning-effort and verbosity controls, expand
  supported reasoning levels, and make capability fallback disable only the
  provider field that was rejected.
- Reduce H3 and checklist fragmentation, add a deterministic final QA boundary,
  parse review questions only from their own list, and teach operational SRM
  calibration when randomized experiments are in scope.
- Raise the course-blueprint output cap from 6,000 to 16,000 tokens while still
  respecting smaller user-configured limits.
- Omit temperature by default so strict or reasoning-oriented providers receive
  no sampling parameter unless the user explicitly enters one.
- Treat the requested chapter minimum as a soft density target in evaluation;
  only output below 80% of that minimum fails the structural length floor.
- Add deterministic textbook-style chapter section numbering (`3.1`, `3.1.1`)
  while keeping QA source anchors as invisible, synchronized metadata.
- Rewrite the README for end users, simplify provider URL and model ID setup,
  explain Gemini free-tier and high-demand limits, and move evaluation details
  into `tests/eval/README.md`.
- Add an upfront billing warning that a complete GPT-5.6 Sol subject can cost
  around US$3 and clarify that concurrency does not reduce total spend.
- Restore explicit Obsidian math-delimiter rules, normalize common unsupported
  LaTeX delimiters locally, and allow useful, valid Mermaid diagrams.
- Make the semantic-review contract model- and provider-neutral.
- Expand the full evaluation profile with fixed chemistry, biology, physics,
  and quantitative-finance theory cases, plus a four-call `theory` profile.
- Reject H4/deeper fragmentation and strengthen mathematical interpretation
  boundaries for approximations, equilibria, stationary conditions, and
  transformed probability measures.
- Populate each GitHub Release page from its matching Changelog section and
  block releases whose notes are missing or empty.

## 0.0.8

- Add chapter depth presets for map-only scans, usable overviews, deep lessons,
  and review notes.
- Add planning-based knowledge type classification with domain-specific chapter
  structures.
- Add chapter quality checks and one optional repair pass for short or
  glossary-like output.
- Add stable bilingual heading contracts for supported output languages.
- Improve README guidance around chapter depth, long outputs, quotas, and API
  cost.

## 0.0.7

- Add configurable OpenAI-compatible API base URL and model settings.
- Add optional max completion token limits and separate generation concurrency settings.
- Add retry handling, truncated-response detection, failed chapter reports, and resume support.
- Add localized command and ribbon labels for supported output languages.
- Improve settings layout and update the demo screenshot.

## 0.0.6

- Update the settings tab heading to satisfy Obsidian review guidelines.

## 0.0.5

- Address Obsidian automated review findings.
- Add GitHub artifact attestations for release assets.
- Add release notes to generated GitHub releases.

## 0.0.4

- Update the minimum supported Obsidian version to `1.12.7`.

## 0.0.3

- Change the default provider to Google's OpenAI-compatible Gemini endpoint.
- Change the default outline and chapter models to `gemini-2.5-flash`.
- Change default concurrency to `1` for stability on free or rate-limited providers.
- Improve chapter prompts to reduce preamble and encourage richer explanations.
- Update README positioning around background learning and research preparation.

## 0.0.2

- Align release metadata with Obsidian community plugin guidelines.
- Rename the display name to Knowledge Overview.
- Add privacy and security notes to the README.

## 0.0.1

- Initial open-source release.
- Generate structured course outlines and chapter notes.
- Support multilingual output for common European and Asian languages.
- Use review and interview preparation prompts.
- Configure OpenAI-compatible API base URL, models, and manual concurrency.
