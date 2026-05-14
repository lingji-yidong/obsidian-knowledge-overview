# Knowledge Overview Generator

Knowledge Overview Generator is an Obsidian plugin that uses
OpenAI-compatible LLM providers to generate structured study outlines and
chapter notes for review and interview preparation.

## Features

- Generate a course outline from a subject name.
- Generate one Markdown note per outline chapter.
- Start generation from the command palette or the ribbon icon.
- Resume failed chapters from `Failed_Chapters.md` without regenerating the
  entire outline.
- Use review and interview-oriented prompts instead of application-specific
  audit prompts.
- Choose from common European and Asian output languages.
- Include English plus target-language terminology for key concepts.
- Render formulas with Obsidian-compatible KaTeX blocks.
- Configure API base URL, models, and manual concurrency.
- Show generation progress in the status bar and an updateable notice for
  mobile.
- Retry transient API failures and write failed chapters to `Failed_Chapters.md`.

## Requirements

- Obsidian 1.5.0 or later.
- An API key for OpenAI or another OpenAI-compatible provider.

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
5. Enable `Knowledge Overview Generator` in `Settings > Community plugins`.

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

## Settings

- `OpenAI API Key`: API key for your provider.
- `API Base URL`: OpenAI-compatible API endpoint.
- `Outline Model`: model used for outline generation.
- `Chapter Model`: model used for chapter notes.
- `Concurrency`: manual course-level concurrency, default `2`.
- `Chapter Concurrency`: manual chapter-generation concurrency, default `3`.
- `Language`: target output language.

Keep concurrency small unless your provider is stable under parallel requests
and has sufficient rate limits.

If the network is unstable, transient provider errors are retried automatically.
Any chapters that still fail are listed in `Failed_Chapters.md` inside the
generated subject folder.

## Supported Languages

The plugin currently provides presets for English, Simplified Chinese,
Traditional Chinese, Japanese, Korean, Vietnamese, Thai, Indonesian, Malay,
Hindi, Arabic, German, French, Spanish, Italian, Portuguese, Dutch, Swedish,
Polish, Turkish, and Russian.

## API Providers

The plugin calls the `/chat/completions` endpoint and should work with OpenAI
and OpenAI-compatible providers. Provider quality, latency, context limits,
and rate limits directly affect generation quality and stability.

Your API key is stored in Obsidian plugin data in your vault. Do not publish
plugin data files or screenshots containing secrets.

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
