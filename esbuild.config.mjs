import esbuild from "esbuild";
import process from "process";

const args = process.argv.slice(2);
const isWatch = args.includes("--watch");
const isProduction = args.includes("production");

const config = {
  banner: {
    js: "/* THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY. */",
  },
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian", "electron"],
  format: "cjs",
  target: "ES2018",
  logLevel: "info",
  sourcemap: isProduction ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
};

if (isWatch) {
  const context = await esbuild.context(config);
  await context.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(config);
}
