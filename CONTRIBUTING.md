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

4. Run the automated checks:

   ```bash
   npm test
   npm run lint
   ```

## Pull Requests

- Keep changes focused and describe the user-facing behavior.
- Run `npm test`, `npm run build`, and `npm run lint` before opening a pull
  request.
- Do not commit API keys, local vault data, or generated notes.
- Keep `manifest.json`, `package.json`, and `versions.json` versions aligned.

## Release Checklist

1. Update `CHANGELOG.md` for the release.
2. Run `npm version <patch|minor|major>`.
3. Run `npm test`, `npm run build`, and `npm run release:verify`.
4. Push the release commit and its numeric tag, such as `0.0.9`.
5. Confirm that the release workflow creates the GitHub release and attaches
   `main.js`, `manifest.json`, and `styles.css`.

Release tags must match the version in `manifest.json` exactly and must not use
a `v` prefix.
