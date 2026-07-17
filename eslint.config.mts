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
            "eval/run.mjs",
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
    rules: {
      // Declarative settings require Obsidian 1.13; this plugin supports 1.12.7.
      "obsidianmd/settings-tab/prefer-setting-definitions": "off",
    },
  },
  {
    files: ["tests/**/*", "eval/**/*", "verify-release.mjs"],
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
    files: ["eval/**/*"],
    rules: {
      "no-restricted-globals": "off",
      "obsidianmd/prefer-window-timers": "off",
    },
  },
);
