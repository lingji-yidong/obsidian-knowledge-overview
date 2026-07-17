import { build } from "esbuild";

const result = await build({
  entryPoints: ["eval/cli.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  write: false,
});

const source = result.outputFiles[0].text;
const encodedSource = Buffer.from(source).toString("base64");

await import(`data:text/javascript;base64,${encodedSource}`);
