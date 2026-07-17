import {
  getMarkdownFenceMarker,
  updateMarkdownFence,
} from "./markdown-fences";

function normalizeInlineMath(line: string): string {
  let inlineCodeFence: string | null = null;

  return line
    .split(/(`+)/)
    .map((segment) => {
      if (/^`+$/.test(segment)) {
        if (inlineCodeFence === null) {
          inlineCodeFence = segment;
        } else if (segment === inlineCodeFence) {
          inlineCodeFence = null;
        }
        return segment;
      }

      if (inlineCodeFence !== null) return segment;
      return segment.replace(/\\\((.+?)\\\)/g, (_match, formula: string) =>
        `$${formula}$`,
      );
    })
    .join("");
}

/**
 * Convert common LaTeX math delimiters to the dollar-sign form rendered by
 * Obsidian, without changing code examples or formula contents.
 */
export function normalizeObsidianMathDelimiters(content: string): string {
  let activeFence: string | null = null;

  return content
    .split("\n")
    .map((line) => {
      const previousFence = activeFence;
      activeFence = updateMarkdownFence(line, activeFence);
      if (previousFence !== null || getMarkdownFenceMarker(line)) return line;

      const trimmed = line.trim();
      if (trimmed === "\\[" || trimmed === "\\]") {
        const indentation = line.slice(0, line.length - line.trimStart().length);
        return `${indentation}$$`;
      }

      return normalizeInlineMath(line);
    })
    .join("\n");
}
