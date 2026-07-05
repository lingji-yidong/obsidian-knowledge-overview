# Changelog

All notable changes to this project will be documented in this file.

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
