import assert from "node:assert/strict";
import test from "node:test";
import { extractReleaseNotes } from "../verify-release.mjs";

test("extracts only the requested changelog section", () => {
  const changelog = [
    "# Changelog",
    "",
    "## Unreleased",
    "",
    "## 0.0.9",
    "",
    "- First change.",
    "- Second change.",
    "",
    "## 0.0.8",
    "",
    "- Older change.",
  ].join("\n");

  assert.equal(
    extractReleaseNotes(changelog, "0.0.9"),
    "- First change.\n- Second change.",
  );
});

test("rejects a missing changelog version", () => {
  assert.throws(
    () => extractReleaseNotes("# Changelog\n\n## 0.0.8\n\n- Old.", "0.0.9"),
    /missing the ## 0\.0\.9 section/,
  );
});

test("rejects an empty release section", () => {
  assert.throws(
    () => extractReleaseNotes("# Changelog\n\n## 0.0.9\n\n## 0.0.8\n\n- Old.", "0.0.9"),
    /has no release notes/,
  );
});
