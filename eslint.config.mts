import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "node_modules",
    "dist",
    "esbuild.config.mjs",
    "version-bump.mjs",
    "versions.json",
    "main.js",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.mts",
            "manifest.json",
            "tests/eval/run.mjs",
            "tests/release-notes.test.mjs",
            "tests/run-tests.mjs",
            "verify-release.mjs",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["tests/**/*", "verify-release.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "obsidianmd/no-nodejs-modules": "off",
      "no-unsanitized/method": "off",
    },
  },
  {
    files: ["tests/eval/**/*"],
    rules: {
      "no-restricted-globals": "off",
      "obsidianmd/prefer-window-timers": "off",
    },
  },
);
