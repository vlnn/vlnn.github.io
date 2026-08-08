import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remark2rehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const mdPipeline = unified().use(remarkParse).use(remarkGfm).use(remark2rehype).use(rehypeStringify);

const FRONTMATTER = /^---\n.*?\n---\n/s;

export function mdToHtml(text) {
  return String(mdPipeline.processSync(text.replace(FRONTMATTER, "")));
}
