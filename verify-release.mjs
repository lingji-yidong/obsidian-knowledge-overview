import fs from "node:fs";
import { pathToFileURL } from "node:url";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const semanticVersionPattern = /^\d+\.\d+\.\d+$/;
const nodeBuiltinImportPattern = /\b(?:require|import)\s*\(\s*["']node:/;

function verifyMobileBundle() {
  const bundle = fs.readFileSync("main.js", "utf8");

  if (nodeBuiltinImportPattern.test(bundle)) {
    throw new Error("main.js contains a Node.js built-in import");
  }

  if (bundle.includes("Evaluation plan (no requests sent)")) {
    throw new Error("main.js unexpectedly contains the evaluation harness");
  }
}

export function extractReleaseNotes(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const heading = `## ${version}`;
  const start = lines.findIndex((line) => line.trim() === heading);

  if (start < 0) {
    throw new Error(`CHANGELOG.md is missing the ${heading} section`);
  }

  const nextHeadingOffset = lines
    .slice(start + 1)
    .findIndex((line) => /^##\s+/.test(line));
  const end = nextHeadingOffset < 0
    ? lines.length
    : start + 1 + nextHeadingOffset;
  const notes = lines.slice(start + 1, end).join("\n").trim();

  if (!notes) {
    throw new Error(`CHANGELOG.md section ${heading} has no release notes`);
  }

  return notes;
}

function verifyRelease(releaseVersion, releaseNotesPath) {
  const packageJson = readJson("package.json");
  const manifest = readJson("manifest.json");
  const versions = readJson("versions.json");
  verifyMobileBundle();

  if (!semanticVersionPattern.test(packageJson.version)) {
    throw new Error(`Invalid package version: ${packageJson.version}`);
  }

  if (manifest.version !== packageJson.version) {
    throw new Error(
      `Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`,
    );
  }

  if (versions[packageJson.version] !== manifest.minAppVersion) {
    throw new Error(
      `versions.json must map ${packageJson.version} to ${manifest.minAppVersion}`,
    );
  }

  if (releaseVersion !== undefined) {
    if (!semanticVersionPattern.test(releaseVersion)) {
      throw new Error(`Release tag must use x.y.z without a v prefix: ${releaseVersion}`);
    }

    if (releaseVersion !== packageJson.version) {
      throw new Error(
        `Release tag ${releaseVersion} does not match package version ${packageJson.version}`,
      );
    }
  }

  const notes = extractReleaseNotes(
    fs.readFileSync("CHANGELOG.md", "utf8"),
    packageJson.version,
  );

  if (releaseNotesPath !== undefined) {
    fs.writeFileSync(releaseNotesPath, `${notes}\n`);
  }

  process.stdout.write(`Release metadata and changelog verified for ${packageJson.version}\n`);
}

const isMain = process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  // Only release jobs pass a tag explicitly. Branch CI verifies the package
  // version without treating GITHUB_REF_NAME (for example, "main") as a tag.
  verifyRelease(process.argv[2], process.argv[3]);
}
