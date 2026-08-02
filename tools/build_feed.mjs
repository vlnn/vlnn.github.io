import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { noteToHtml } from "../vendor/org.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function rfc822(date) {
  const utc = new Date(`${date}T00:00:00Z`);
  const day = DAYS[utc.getUTCDay()];
  const month = MONTHS[utc.getUTCMonth()];
  const pad = (n) => String(n).padStart(2, "0");
  return `${day}, ${pad(utc.getUTCDate())} ${month} ${utc.getUTCFullYear()} 00:00:00 GMT`;
}

export function rfc3339(date) {
  return `${date}T00:00:00Z`;
}

export function absolutizeFileUrls(site, html) {
  return html?.replaceAll('"file:', `"${site}/`);
}

export function feedItems(site, index, rendered) {
  return Object.entries(index.notes)
    .filter(([, note]) => note.date)
    .sort(([, a], [, b]) => b.date.localeCompare(a.date))
    .map(([slug, note]) => ({
      slug,
      title: note.title,
      date: note.date,
      link: `${site}/?stack=${slug}`,
      html: absolutizeFileUrls(site, rendered[slug]),
    }));
}

function itemXml(item) {
  return `  <item>
   <title>${escapeXml(item.title)}</title>
   <link>${escapeXml(item.link)}</link>
   <guid>${escapeXml(item.link)}</guid>
   <pubDate>${rfc822(item.date)}</pubDate>
   <description>${escapeXml(item.html)}</description>
  </item>`;
}

export function buildFeed(site, index, rendered) {
  const items = feedItems(site, index, rendered).map(itemXml).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
 <channel>
  <title>Notes — @vlnn</title>
  <link>${escapeXml(site)}/</link>
  <atom:link href="${escapeXml(site)}/rss.xml" rel="self" type="application/rss+xml"/>
  <description>Working notes of Volodymyr Anokhin</description>
  <language>en</language>
${items}
 </channel>
</rss>
`;
}

function entryXml(item) {
  return ` <entry>
  <id>${escapeXml(item.link)}</id>
  <title>${escapeXml(item.title)}</title>
  <link rel="alternate" href="${escapeXml(item.link)}"/>
  <updated>${rfc3339(item.date)}</updated>
  <content type="html">${escapeXml(item.html)}</content>
 </entry>`;
}

export function buildAtom(site, index, rendered) {
  const items = feedItems(site, index, rendered);
  const updated = items.length ? rfc3339(items[0].date) : rfc3339("1970-01-01");
  const entries = items.map(entryXml).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
 <id>${escapeXml(site)}/</id>
 <title>Notes — @vlnn</title>
 <subtitle>Working notes of Volodymyr Anokhin</subtitle>
 <link rel="alternate" href="${escapeXml(site)}/"/>
 <link rel="self" type="application/atom+xml" href="${escapeXml(site)}/atom.xml"/>
 <updated>${updated}</updated>
 <author>
  <name>Volodymyr Anokhin</name>
 </author>
${entries}
</feed>
`;
}

function renderAll(notesDir, index) {
  const files = new Set(readdirSync(notesDir));
  return Object.fromEntries(
    Object.entries(index.notes)
      .filter(([, note]) => files.has(note.file))
      .map(([slug, note]) => [slug, noteToHtml(note.file, readFileSync(`${notesDir}/${note.file}`, "utf8"))])
  );
}

function main() {
  const [site = "https://vlnn.dev", notesDir = "notes", indexPath = "index.json"] = process.argv.slice(2);
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const rendered = renderAll(notesDir, index);
  writeFileSync("rss.xml", buildFeed(site, index, rendered));
  writeFileSync("atom.xml", buildAtom(site, index, rendered));
  console.log(`rss.xml + atom.xml: ${feedItems(site, index, {}).length} items`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
