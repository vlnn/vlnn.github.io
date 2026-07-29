import { unified } from "unified";
import uniorgParse from "uniorg-parse";
import uniorg2rehype from "uniorg-rehype";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remark2rehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const orgPipeline = unified().use(uniorgParse).use(uniorg2rehype).use(rehypeStringify);
const mdPipeline = unified().use(remarkParse).use(remarkGfm).use(remark2rehype).use(rehypeStringify);

const FRONTMATTER = /^---\n.*?\n---\n/s;

export function orgToHtml(text) {
  return String(orgPipeline.processSync(text));
}

export function mdToHtml(text) {
  return String(mdPipeline.processSync(text.replace(FRONTMATTER, "")));
}

export function noteToHtml(filename, text) {
  return filename.endsWith(".md") ? mdToHtml(text) : orgToHtml(text);
}
