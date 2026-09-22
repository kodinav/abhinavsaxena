/**
 * Adds `readingTime` (minutes) and `wordCount` to the frontmatter of every
 * Markdown/MDX entry so pages can show an estimated reading time without
 * a client round-trip.
 */
function collectText(node, out) {
  if (!node) return;
  if (node.type === 'text' || node.type === 'inlineCode') out.push(node.value);
  if (node.type === 'code') return; // don't count code blocks as prose
  if (Array.isArray(node.children)) node.children.forEach((c) => collectText(c, out));
}

export function remarkReadingTime() {
  return function (tree, file) {
    const chunks = [];
    collectText(tree, chunks);
    const text = chunks.join(' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 230));
    const fm = (file.data.astro ??= {}).frontmatter ??= {};
    fm.wordCount = words;
    fm.readingTime = minutes;
  };
}
