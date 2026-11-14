import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remark2rehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const mdPipeline = unified().use(remarkParse).use(remarkGfm).use(remark2rehype).use(rehypeStringify);

const FRONTMATTER = /^---\n.*?\n---\n/s;
const CALLOUT_ALONE = /<blockquote>\n<p>\[!(\w+)\]<\/p>\n/g;
const CALLOUT_INLINE = /<blockquote>\n<p>\[!(\w+)\]\n/g;

function calloutOpen(kind) {
  return `<blockquote class="callout callout-${kind.toLowerCase()}">\n`;
}

function calloutize(html) {
  return html
    .replace(CALLOUT_ALONE, (_, kind) => calloutOpen(kind))
    .replace(CALLOUT_INLINE, (_, kind) => `${calloutOpen(kind)}<p>`);
}

const SPACED_FOOTNOTE_DEFINITION = /^\[\^([^\]\n]*\s[^\]\n]*)\]:/gm;

function spacedFootnoteLabels(text) {
  return [...new Set([...text.matchAll(SPACED_FOOTNOTE_DEFINITION)].map(([, label]) => label))];
}

function unspacedLabel(label) {
  return label.trim().replace(/\s+/g, "-");
}

// GFM rejects whitespace in footnote labels; only labels that have a definition are rewritten
function unspaceFootnoteLabels(text) {
  return spacedFootnoteLabels(text).reduce(
    (markdown, label) => markdown.replaceAll(`[^${label}]`, `[^${unspacedLabel(label)}]`),
    text
  );
}

export function mdToHtml(text) {
  return calloutize(String(mdPipeline.processSync(unspaceFootnoteLabels(text.replace(FRONTMATTER, "")))));
}
