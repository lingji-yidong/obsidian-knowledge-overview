import {
  getMarkdownFenceMarker,
  updateMarkdownFence,
} from "./markdown-fences";

const MARKDOWN_HEADING_PATTERN = /^(#{2,4})\s+(.+?)\s*$/;
const QA_SECTION_MARKER_PATTERN = /\s*(<!--\s*qa-section\s*-->)\s*$/i;
const QA_SOURCE_PATTERN = /<!--\s*source:\s*([^>]+?)\s*-->/gi;
const SECTION_NUMBER_PATTERN = /^\d+(?:\.\d+)+\s+/;

/** Remove a generated textbook section label before structural comparison. */
export function stripChapterSectionNumber(title: string): string {
  return title.trim().replace(SECTION_NUMBER_PATTERN, "");
}

/**
 * Add deterministic textbook-style numbering to chapter headings and keep the
 * invisible QA source anchors aligned with the rewritten H2 titles.
 */
export function numberChapterHeadings(
  content: string,
  chapterNumber: string,
): string {
  const safeChapterNumber = /^\d+(?:\.\d+)*$/.test(chapterNumber.trim())
    ? chapterNumber.trim()
    : "1";
  const lines = content.split("\n");
  const h2TitleMap = new Map<string, string>();
  let activeFence: string | null = null;
  let h2Index = 0;
  let h3Index = 0;
  let h4Index = 0;

  const numberedLines = lines.map((line) => {
    const previousFence = activeFence;
    activeFence = updateMarkdownFence(line, activeFence);
    if (previousFence !== null || getMarkdownFenceMarker(line)) return line;

    const heading = line.match(MARKDOWN_HEADING_PATTERN);
    if (!heading) return line;

    const hashes = heading[1];
    const markerMatch = heading[2].match(QA_SECTION_MARKER_PATTERN);
    const marker = markerMatch?.[1];
    const rawTitle = heading[2].replace(QA_SECTION_MARKER_PATTERN, "").trim();
    const baseTitle = stripChapterSectionNumber(rawTitle);
    let sectionNumber: string;

    if (hashes.length === 2) {
      h2Index += 1;
      h3Index = 0;
      h4Index = 0;
      sectionNumber = `${safeChapterNumber}.${h2Index}`;
      const numberedTitle = `${sectionNumber} ${baseTitle}`;
      const key = baseTitle.toLocaleLowerCase();
      if (!h2TitleMap.has(key)) h2TitleMap.set(key, numberedTitle);
    } else if (hashes.length === 3 && h2Index > 0) {
      h3Index += 1;
      h4Index = 0;
      sectionNumber = `${safeChapterNumber}.${h2Index}.${h3Index}`;
    } else if (hashes.length === 4 && h2Index > 0 && h3Index > 0) {
      h4Index += 1;
      sectionNumber = `${safeChapterNumber}.${h2Index}.${h3Index}.${h4Index}`;
    } else {
      return line;
    }

    return `${hashes} ${sectionNumber} ${baseTitle}${marker ? ` ${marker}` : ""}`;
  });

  activeFence = null;
  return numberedLines
    .map((line) => {
      const previousFence = activeFence;
      activeFence = updateMarkdownFence(line, activeFence);
      if (previousFence !== null || getMarkdownFenceMarker(line)) return line;

      return line.replace(QA_SOURCE_PATTERN, (match, source: string) => {
        const baseSource = stripChapterSectionNumber(source);
        const numberedTitle = h2TitleMap.get(baseSource.toLocaleLowerCase());
        return numberedTitle
          ? `<!-- source: ${numberedTitle} -->`
          : match;
      });
    })
    .join("\n");
}
