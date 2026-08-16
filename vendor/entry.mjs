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

export function mdToHtml(text) {
  return calloutize(String(mdPipeline.processSync(text.replace(FRONTMATTER, ""))));
}
