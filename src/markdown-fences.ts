const MARKDOWN_FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;

/** Return the backtick or tilde character that opens or closes a block fence. */
export function getMarkdownFenceMarker(line: string): string | null {
  return line.match(MARKDOWN_FENCE_PATTERN)?.[1]?.[0] ?? null;
}

/** Track whether the current Markdown line is inside a fenced code block. */
export function updateMarkdownFence(
  line: string,
  activeFence: string | null,
): string | null {
  const marker = getMarkdownFenceMarker(line);
  if (!marker) return activeFence;
  if (activeFence === null) return marker;
  return marker === activeFence ? null : activeFence;
}
