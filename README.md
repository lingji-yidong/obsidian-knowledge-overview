# Knowledge Overview

Knowledge Overview is an Obsidian plugin that uses OpenAI-compatible LLM
providers to generate structured subject overviews, study outlines, and chapter
notes for background learning, course review, and research preparation.

## Features

- Generate a course outline from a subject name.
- Generate one Markdown note per outline chapter.
- Start generation from the command palette or the ribbon icon.
- Resume failed chapters from `Failed_Chapters.md` without regenerating the
  entire outline.
- Use learning-oriented prompts for concept explanations, formulas, examples,
  applications, and common misunderstandings.
- Choose from common European and Asian output languages.
- Include English plus target-language terminology for key concepts.
- Render formulas with Obsidian-compatible KaTeX blocks.
- Configure API base URL, models, and manual concurrency.
- Show generation progress in the status bar and an updateable notice for
  mobile.
- Retry transient API failures and write failed chapters to `Failed_Chapters.md`.

## Requirements

- Obsidian 1.12.7 or later.
- An API key for Google Gemini, OpenAI, or another OpenAI-compatible provider.

The plugin is not desktop-only. It avoids Electron and Node-only APIs and is
intended to run on both desktop and mobile Obsidian. Mobile network behavior
still depends on the configured provider and the device network environment.

## Installation

### Manual Install

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest
   release.
2. Create this folder in your vault:

   ```text
   <vault>/.obsidian/plugins/knowledge-overview/
   ```

3. Copy the three files into that folder.
4. Reload Obsidian.
5. Enable `Knowledge Overview` in `Settings > Community plugins`.

### From Source

```bash
git clone <repository-url>
cd obsidian-knowledge-plugin
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` into:

```text
<vault>/.obsidian/plugins/knowledge-overview/
```

## Usage

1. Open the command palette.
2. Run `Generate Knowledge Overview`.
3. Enter a subject, for example `Signal Processing`.
4. The plugin creates a subject folder containing `Outlines.md` and one note
   per generated chapter.

To continue failed chapters later, run `Resume Failed Chapter Generation` from
the command palette or the resume ribbon icon, then enter the subject folder
name. The plugin reads `Failed_Chapters.md` and retries only those chapters.

Example output:

```text
Signal Processing/
├── Outlines.md
├── 01_Fourier_Analysis.md
├── 02_Signal_Filtering.md
└── 03_Wavelet_Transform.md
```

## Demo

![Knowledge Overview demo](screenshot/demo.png)

## Settings

- `API key`: API key for your provider.
- `API base URL`: OpenAI-compatible API endpoint. Default:
  `https://generativelanguage.googleapis.com/v1beta/openai`.
- `Outline model`: model used for outline generation. Default:
  `gemini-3.5-flash`.
- `Chapter model`: model used for chapter notes. Default:
  `gemini-3.5-flash`.
- `Max completion tokens`: optional `max_completion_tokens` limit for
  Chat Completions output. Leave empty to omit the field; set a larger number
  if your provider truncates long chapters.
- `Concurrency`: manual course-level concurrency, default `1`.
- `Chapter concurrency`: manual chapter-generation concurrency, default `1`.
- `Language`: target output language.

The default settings favor stability on free or rate-limited providers. Keep
concurrency small unless your provider is stable under parallel requests and
has sufficient rate limits.

Medium-sized or stronger models usually generate richer chapter notes than
small or lite models. Very small models may follow the structure but produce
shorter explanations.

If the network is unstable, transient provider errors are retried automatically.
Any chapters that still fail are listed in `Failed_Chapters.md` inside the
generated subject folder.

## Supported Languages

The plugin currently provides presets for English, Simplified Chinese,
Traditional Chinese, Japanese, Korean, Vietnamese, Thai, Indonesian, Malay,
Hindi, Arabic, German, French, Spanish, Italian, Portuguese, Dutch, Swedish,
Polish, Turkish, and Russian.

## API Providers

The plugin calls the `/chat/completions` endpoint and should work with Google
Gemini's OpenAI-compatible endpoint, OpenAI, and other OpenAI-compatible
providers. The API base URL is normalized, so values with or without trailing
slashes, `/v1`, or `/chat/completions` are handled. If you enter only a host
with no path, the plugin uses the common `/v1/chat/completions` convention.
Provider quality, latency, context limits, and rate limits directly affect
generation quality and stability.

Common API base URL examples:

| Provider | API base URL | Example model |
| --- | --- | --- |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-3.5-flash` |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.5` |
| Anthropic Claude | `https://api.anthropic.com/v1` | `claude-opus-4-7` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-v4-pro` |

The plugin appends `/chat/completions` automatically. You can paste either the
base URL above or a full `/chat/completions` URL; both forms are normalized.
For best note quality, prefer mid-sized or stronger models. In practice,
Gemini Flash works well, while lite/small models often produce notes that are
too short.

## Privacy and Security

API keys are stored locally in Obsidian plugin data inside your vault. Do not
publish plugin data files or screenshots containing secrets.

The plugin sends the subject name and generated chapter prompts to the API
provider you configure. It does not include analytics, telemetry, remote code
loading, shell execution, `eval`, or bundled API keys.

Generated Markdown files are written only to your current vault.

## Development

```bash
npm install
npm run dev
```

Build a production bundle:

```bash
npm run build
```

Release artifacts are:

- `main.js`
- `manifest.json`
- `styles.css`

## Project Structure

```text
.
├── main.ts
├── main.js
├── manifest.json
├── versions.json
├── styles.css
├── esbuild.config.mjs
├── package.json
└── tsconfig.json
```

## License

MIT
