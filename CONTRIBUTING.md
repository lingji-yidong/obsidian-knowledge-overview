# Contributing

Thanks for considering a contribution.

## Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development build:

   ```bash
   npm run dev
   ```

3. Build a release artifact:

   ```bash
   npm run build
   ```

## Pull Requests

- Keep changes focused and describe the user-facing behavior.
- Run `npm run build` before opening a pull request.
- Do not commit API keys, local vault data, or generated notes.
- Keep `manifest.json`, `package.json`, and `versions.json` versions aligned.

## Release Checklist

1. Update `package.json` version.
2. Run `npm version <patch|minor|major>`.
3. Run `npm run build`.
4. Create a GitHub release whose tag matches the version, such as `0.0.1`.
5. Attach `main.js`, `manifest.json`, and `styles.css`.
