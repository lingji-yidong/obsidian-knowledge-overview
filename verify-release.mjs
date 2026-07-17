import fs from "node:fs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const packageJson = readJson("package.json");
const manifest = readJson("manifest.json");
const versions = readJson("versions.json");
// Only release jobs pass a tag explicitly. Branch CI should verify file
// consistency without treating GITHUB_REF_NAME (for example, "main") as a tag.
const releaseVersion = process.argv[2];
const semanticVersionPattern = /^\d+\.\d+\.\d+$/;

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

process.stdout.write(`Release metadata verified for ${packageJson.version}\n`);
