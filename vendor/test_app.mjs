import assert from "node:assert/strict";
import { parseStack, stackUrl, stackAfter, slugFromHref, visiblePanes, trailOf, timelineEntries, timeArrowLayout, yearTicks, trailAsMd, paneKey } from "../app.js";

assert.equal(paneKey("a", 0, true), paneKey("a", 0, true), "paneKey should be stable for an unchanged pane");
assert.notEqual(paneKey("a", 0, true), paneKey("a", 1, true), "paneKey should change when the pane moves to another position");
assert.notEqual(paneKey("a", 0, true), paneKey("b", 0, true), "paneKey should change when the slug changes");
assert.notEqual(paneKey("a", 0, true), paneKey("a", 0, false), "paneKey should change when closability flips");
assert.notEqual(paneKey("a", 12, true), paneKey("a:1", 2, true), "paneKey should not collide for slugs containing delimiter-like characters");
assert.equal(paneKey("test", 0, true), null, "paneKey should refuse a key for the stack-dependent quiz pane");
assert.notEqual(paneKey("test:a", 0, true), null, "paneKey should still key per-note quiz panes");
console.log("paneKey tests passed");

import { reconcilePanes } from "../app.js";

function fakePane(name) {
  return { name, detaches: 0, remove() { this.parentChildren.splice(this.parentChildren.indexOf(this), 1); } };
}

function fakeContainer(...panes) {
  const container = { children: [] };
  container.insertBefore = (pane, ref) => {
    if (pane.parentChildren) {
      pane.detaches += 1;
      pane.remove();
    }
    pane.parentChildren = container.children;
    container.children.splice(ref ? container.children.indexOf(ref) : container.children.length, 0, pane);
  };
  panes.forEach((pane) => container.insertBefore(pane, null));
  panes.forEach((pane) => (pane.detaches = 0));
  return container;
}

const names = (container) => container.children.map((pane) => pane.name);

{
  const [a, b, c] = [fakePane("a"), fakePane("b"), fakePane("c")];
  const container = fakeContainer(a, b);
  reconcilePanes(container, [a, b, c]);
  assert.deepEqual(names(container), ["a", "b", "c"], "reconcilePanes should append a new pane after the kept ones");
  assert.equal(a.detaches + b.detaches, 0, "reconcilePanes should not detach kept panes when appending");
}
{
  const [a, b, c, d] = [fakePane("a"), fakePane("b"), fakePane("c"), fakePane("d")];
  const container = fakeContainer(a, b, c);
  reconcilePanes(container, [a, d]);
  assert.deepEqual(names(container), ["a", "d"], "reconcilePanes should drop truncated panes and add the newly opened one");
  assert.equal(a.detaches, 0, "reconcilePanes should not detach the kept prefix when truncating");
}
{
  const [a, b, c] = [fakePane("a"), fakePane("b"), fakePane("c")];
  const container = fakeContainer(a, c);
  reconcilePanes(container, [a, b, c]);
  assert.deepEqual(names(container), ["a", "b", "c"], "reconcilePanes should insert a middle pane at its position");
  assert.equal(a.detaches + c.detaches, 0, "reconcilePanes should not detach neighbours of a middle insert");
}
{
  const [a, b] = [fakePane("a"), fakePane("b")];
  const container = fakeContainer(a, b);
  reconcilePanes(container, [a, b]);
  assert.deepEqual(names(container), ["a", "b"], "reconcilePanes should keep an unchanged stack as is");
  assert.equal(a.detaches + b.detaches, 0, "reconcilePanes should touch nothing when the stack is unchanged");
}
console.log("reconcilePanes tests passed");

const cases = [
  [() => parseStack("?stackedNotes=a&stackedNotes=b"), ["a", "b"], "parseStack should read repeated params in order"],
  [() => parseStack(""), ["about-these-notes"], "parseStack should default to the entry note"],
  [() => stackUrl(["a", "b"]), "?stack=a,b", "stackUrl should serialize the stack as one comma-separated param"],
  [() => parseStack("?stack=a,b,c"), ["a", "b", "c"], "parseStack should read the compact comma form"],
  [() => parseStack("?stack="), ["about-these-notes"], "parseStack should fall back to the entry note for an empty stack param"],
  [() => stackAfter(["a", "b", "c"], 0, "d"), ["a", "d"], "stackAfter should truncate panes right of the source pane"],
  [() => stackAfter(["a", "b"], 1, "a"), ["a", "b"], "stackAfter should not duplicate an already-open note"],
  [() => slugFromHref("file:other.md"), "other", "slugFromHref should strip the file: prefix"],
  [() => slugFromHref("./other.md"), "other", "slugFromHref should accept relative ./ links"],
  [() => slugFromHref("https://x.com/a.md"), null, "slugFromHref should ignore external urls"],
  [() => slugFromHref("legacy.org"), null, "slugFromHref should no longer treat .org links as notes"],
  [() => slugFromHref("static/pic.gif"), null, "slugFromHref should ignore non-note paths"],
  [() => visiblePanes(["a", "b", "c"], true), [["c", 2]], "visiblePanes should show only the last note with its stack index on narrow screens"],
  [() => visiblePanes(["a", "b"], false), [["a", 0], ["b", 1]], "visiblePanes should show the whole stack on wide screens"],
  [() => trailOf(["a", "b", "c"], true), ["a", "b"], "trailOf should list earlier notes as breadcrumbs on narrow screens"],
  [() => trailOf(["a"], true), [], "trailOf should be empty for a single-note stack"],
  [() => trailOf(["a", "b"], false), [], "trailOf should be empty on wide screens"],
];

for (const [run, expected, message] of cases) assert.deepEqual(run(), expected, message);
console.log(`${cases.length} app tests passed`);

import { mdToHtml } from "./org.js";

const mdHtml = mdToHtml("---\ntitle: x\n---\n\n**bold** and a [link](a.md)\n\n| a | b |\n|---|---|\n| 1 | 2 |");
assert.ok(mdHtml.includes("<strong>bold</strong>"), "mdToHtml should render markdown emphasis");
assert.ok(!mdHtml.includes("title: x"), "mdToHtml should strip YAML frontmatter");
assert.ok(mdHtml.includes("<table>"), "mdToHtml should render GFM tables");
assert.equal(slugFromHref("a.md"), "a", "slugFromHref should treat bare .md links as notes");
assert.ok(mdToHtml("*em*").includes("<em>"), "mdToHtml should render md emphasis without a frontmatter block");

const inlineCallout = mdToHtml("> [!quote]\n> some wisdom");
assert.ok(inlineCallout.includes('<blockquote class="callout callout-quote">'), "mdToHtml should turn [!quote] blockquotes into callout blockquotes");
assert.ok(!inlineCallout.includes("[!quote]"), "mdToHtml should strip the callout marker from the rendered blockquote");
assert.ok(inlineCallout.includes("<p>some wisdom</p>"), "mdToHtml should keep the callout body intact");

const aloneCallout = mdToHtml("> [!quote]\n>\n> some wisdom");
assert.ok(aloneCallout.includes('<blockquote class="callout callout-quote">'), "mdToHtml should recognize a marker-only first paragraph");
assert.ok(!aloneCallout.includes("<p></p>"), "mdToHtml should not leave an empty paragraph behind the marker");

assert.ok(mdToHtml("> [!note]\n> nb").includes("callout-note"), "mdToHtml should map the callout kind onto its class");
assert.ok(!mdToHtml("> plain quote").includes("callout"), "mdToHtml should leave plain blockquotes untouched");
console.log("markdown pipeline tests passed");

const sampleIndex = {
  notes: {
    old: { title: "Old", date: "2022-01-01" },
    fresh: { title: "Fresh", date: "2024-06-01" },
    undated: { title: "Undated", date: "" },
    mid: { title: "Mid", date: "2023-03-03" },
  },
};

assert.deepEqual(
  timelineEntries(sampleIndex).map((entry) => entry.slug),
  ["fresh", "mid", "old"],
  "timelineEntries should sort dated notes newest first and exclude undated ones"
);
assert.deepEqual(
  timelineEntries(sampleIndex)[0],
  { slug: "fresh", title: "Fresh", date: "2024-06-01", year: "2024" },
  "timelineEntries should expose slug, title, date and year per entry"
);
console.log("timeline tests passed");

const spread = [
  { slug: "first", date: "2022-01-01" },
  { slug: "middle", date: "2023-01-01" },
  { slug: "last", date: "2024-01-01" },
];
const layout = timeArrowLayout(spread, 0.02);

assert.equal(layout[0].x, 0, "timeArrowLayout should place the earliest note at 0");
assert.equal(layout[2].x, 1, "timeArrowLayout should place the latest note at 1");
assert.ok(Math.abs(layout[1].x - 0.5) < 0.01, "timeArrowLayout should place notes proportionally between the extremes");
assert.deepEqual(layout.map((d) => d.lane), [0, 0, 0], "timeArrowLayout should keep well-separated notes on the base lane");

assert.deepEqual(
  timeArrowLayout([{ slug: "only", date: "2024-01-01" }], 0.02),
  [{ slug: "only", date: "2024-01-01", x: 0.5, lane: 0 }],
  "timeArrowLayout should center a single note"
);

const cluster = timeArrowLayout(
  [
    { slug: "a", date: "2022-10-11" },
    { slug: "b", date: "2022-10-12" },
    { slug: "c", date: "2022-10-13" },
    { slug: "far", date: "2024-10-12" },
  ],
  0.02
);
assert.ok(cluster[2].x > 0.15, "timeArrowLayout should decompress date clusters via the rank blend");
assert.ok(cluster.every((d, i) => i === 0 || d.x > cluster[i - 1].x), "timeArrowLayout should keep the blended scale strictly chronological");

const crowded = timeArrowLayout(
  [
    { slug: "a", date: "2021-01-01" },
    { slug: "b", date: "2022-01-01" },
    { slug: "c", date: "2023-01-01" },
    { slug: "d", date: "2024-01-01" },
  ],
  0.5
);
assert.deepEqual(crowded.map((d) => d.lane), [0, 1, 0, 1], "timeArrowLayout should alternate lanes when neighbors sit closer than the minimum gap");

const ticks = yearTicks([
  { date: "2022-07-01" },
  { date: "2024-07-01" },
]);
assert.deepEqual(ticks.map((t) => t.year), ["2023", "2024"], "yearTicks should mark each January 1st inside the range");
assert.ok(ticks.every((t) => t.x > 0 && t.x < 1), "yearTicks should position ticks strictly inside the axis");
assert.deepEqual(yearTicks([{ date: "2024-03-01" }, { date: "2024-06-01" }]), [], "yearTicks should be empty when no year boundary is crossed");
console.log("time arrow tests passed");

const trailNotes = {
  "about-these-notes": { title: "About these notes", file: "about-these-notes.md" },
  "how-this-site-works": { title: "How this site works", file: "how-this-site-works.md" },
};
assert.equal(
  trailAsMd(["about-these-notes", "timeline", "how-this-site-works"], trailNotes),
  "- [About these notes](about-these-notes.md)\n- [How this site works](how-this-site-works.md)",
  "trailAsMd should emit a md list of file links, skipping synthetic panes"
);
console.log("trail export tests passed");

import { closePane } from "../app.js";

const closeCases = [
  [() => closePane(["a", "b", "c"], 2), ["a", "b"], "closePane should drop the last pane"],
  [() => closePane(["a", "b", "c"], 1), ["a", "c"], "closePane should remove exactly a middle pane, keeping panes to its right"],
  [() => closePane(["a", "b", "c"], 0), ["b", "c"], "closePane should remove the first pane, keeping the rest"],
  [() => closePane(["a"], 0), ["a"], "closePane should be a no-op on the only pane"],
  [() => closePane(["a", "b"], 5), ["a", "b"], "closePane should ignore an out-of-range index"],
];
for (const [run, expected, message] of closeCases) assert.deepEqual(run(), expected, message);
console.log("close pane tests passed");

import { slugsForTag } from "../app.js";

const tagIndex = {
  notes: {
    late: { title: "Late", date: "2024-01-01", tags: ["lisp"] },
    early: { title: "Early", date: "2022-01-01", tags: ["lisp", "emacs"] },
    other: { title: "Other", date: "2023-01-01", tags: ["python"] },
    undated: { title: "Undated", date: "", tags: ["lisp"] },
  },
};

const tagCases = [
  [() => slugsForTag(tagIndex, "lisp"), ["early", "late", "undated"], "slugsForTag should order dated notes chronologically ascending with undated ones last"],
  [() => slugsForTag(tagIndex, "emacs"), ["early"], "slugsForTag should match notes carrying the tag among others"],
  [() => slugsForTag(tagIndex, "nope"), [], "slugsForTag should return an empty stack for an unknown tag"],
];
for (const [run, expected, message] of tagCases) assert.deepEqual(run(), expected, message);
console.log("tag link tests passed");

import { dotScale } from "../app.js";

const scaleCases = [
  [() => dotScale(0, 10), 9, "dotScale should give the minimum radius for a disconnected note"],
  [() => dotScale(10, 10), 17, "dotScale should give the maximum radius for the best-connected note"],
  [() => dotScale(3, 0), 9, "dotScale should stay at minimum when the graph has no links at all"],
];
for (const [run, expected, message] of scaleCases) assert.deepEqual(run(), expected, message);
assert.ok(
  dotScale(2, 10) < dotScale(5, 10) && dotScale(5, 10) < dotScale(9, 10),
  "dotScale should grow monotonically with degree"
);
assert.ok(
  dotScale(5, 10) - dotScale(1, 10) > dotScale(9, 10) - dotScale(5, 10),
  "dotScale should compress differences at the high end via the sqrt curve"
);
console.log("dot scale tests passed");

import { arcPairs, arcHeight } from "../app.js";

const arcIndex = {
  notes: {
    a: { date: "2022-01-01", links: ["b", "a", "ghost"], backlinks: [] },
    b: { date: "2023-01-01", links: ["a"], backlinks: ["a"] },
    c: { date: "2024-01-01", links: [], backlinks: [] },
    undated: { date: "", links: ["a"], backlinks: [] },
  },
};
const arcLayout = [
  { slug: "a", x: 0, lane: 0 },
  { slug: "b", x: 0.5, lane: 2 },
  { slug: "c", x: 1, lane: 0 },
];

assert.deepEqual(
  arcPairs(arcIndex, arcLayout),
  [{ from: "a", to: "b", fromX: 0, toX: 0.5, fromLane: 0, toLane: 2 }],
  "arcPairs should dedupe mutual links into one chronological arc, dropping self-links and slugs missing from the layout"
);
assert.deepEqual(arcPairs({ notes: {} }, []), [], "arcPairs should be empty for an empty graph");

import { arcEndY } from "../app.js";
assert.equal(arcEndY(0), 72.5, "arcEndY should sit on the base lane's dot center");
assert.equal(arcEndY(1), 61.5, "arcEndY should climb one lane step per lane");
assert.equal(arcEndY(2), 50.5, "arcEndY should reach the top lane's dot center");

assert.ok(arcHeight(0.1) < arcHeight(0.5), "arcHeight should grow with the horizontal span");
assert.equal(arcHeight(1), arcHeight(0.9), "arcHeight should cap so wide arcs stay inside the bar");
assert.ok(arcHeight(0.01) > 0, "arcHeight should keep even the shortest arc visible");
console.log("arc diagram tests passed");

import { trackPosition } from "../app.js";

const trackCases = [
  [() => trackPosition(0), "calc(6px + 0 * (100% - 32px))", "trackPosition should start the track just inside the axis line"],
  [() => trackPosition(1), "calc(6px + 1 * (100% - 32px))", "trackPosition should end the track before the arrowhead"],
  [() => trackPosition(0.5), "calc(6px + 0.5 * (100% - 32px))", "trackPosition should map intermediate x linearly into the padded track"],
];
for (const [run, expected, message] of trackCases) assert.deepEqual(run(), expected, message);
console.log("track position tests passed");

const slugSafetyCases = [
  [() => parseStack("?stack=good,%3Cimg%20src%3Dx%3E"), ["good"], "parseStack should drop slugs containing characters outside letters digits dash underscore"],
  [() => parseStack("?stack=..%2F..%2Fsecret"), ["about-these-notes"], "parseStack should fall back to the entry note when every slug is invalid"],
  [() => parseStack("?stackedNotes=ok&stackedNotes=Not%20OK"), ["ok"], "parseStack should validate the legacy form the same way"],
  [() => parseStack("?stack=a1-b2,timeline"), ["a1-b2", "timeline"], "parseStack should keep well-formed slugs and synthetic panes untouched"],
  [() => parseStack("?stack=a2b_converter"), ["a2b_converter"], "parseStack should keep slugs with underscores"],
  [() => parseStack("?stack=Dr-Toomas-Karmo"), ["Dr-Toomas-Karmo"], "parseStack should keep slugs with uppercase letters"],
];
for (const [run, expected, message] of slugSafetyCases) assert.deepEqual(run(), expected, message);

import { readFileSync } from "node:fs";
const realIndex = JSON.parse(readFileSync(new URL("../index.json", import.meta.url), "utf8"));
for (const slug of Object.keys(realIndex.notes)) {
  assert.deepEqual(parseStack(`?stack=${slug}`), [slug], `parseStack should keep the real note slug "${slug}", or its pane silently vanishes from shared urls`);
}
console.log("slug safety tests passed");

import { tokenize, searchNotes, snippetFor } from "../app.js";

const corpus = [
  { slug: "repl", title: "REPL driven flow", tags: ["clojure"], body: "The repl is where clojure lives. Iterate in the repl." },
  { slug: "sql", title: "SQL as volapuk", tags: ["data"], body: "sql is a strange language for analysis" },
  { slug: "lamp", title: "Daylight lamp", tags: [], body: "a lamp against the winter dark" },
];

const searchCases = [
  [() => tokenize("  Hello   REPL "), ["hello", "repl"], "tokenize should lowercase and split on whitespace"],
  [() => tokenize(""), [], "tokenize should return nothing for an empty query"],
  [() => searchNotes("", corpus), [], "searchNotes should return nothing for an empty query"],
  [() => searchNotes("nonexistent-word", corpus).length, 0, "searchNotes should return nothing when no note matches"],
  [() => searchNotes("clojure", corpus).map((hit) => hit.slug), ["repl"], "searchNotes should match tokens found only in tags or body"],
  [() => searchNotes("lamp winter", corpus).map((hit) => hit.slug), ["lamp"], "searchNotes should require every token to match the same note"],
  [() => searchNotes("sql repl", corpus).length, 0, "searchNotes should drop notes matching only some tokens"],
];
for (const [run, expected, message] of searchCases) assert.deepEqual(run(), expected, message);

assert.equal(
  searchNotes("repl", corpus)[0].slug, "repl",
  "searchNotes should rank a title match above a body-only match"
);
assert.ok(
  searchNotes("sql", corpus).map((hit) => hit.slug).includes("sql"),
  "searchNotes should still include body/title matches alongside ranking"
);

assert.equal(
  snippetFor("aaa needle bbb", ["needle"], 2),
  "…a needle b…",
  "snippetFor should cut a window around the first matching token with ellipses"
);
assert.equal(
  snippetFor("needle at the start", ["needle"], 5),
  "needle at t…",
  "snippetFor should not prepend an ellipsis when the match opens the text"
);
assert.equal(
  snippetFor("no match here", ["absent"], 10),
  "no match here",
  "snippetFor should fall back to the head of the text when nothing matches"
);
console.log("search tests passed");

import { tagCounts, tagScale } from "../app.js";

const cloudIndex = { notes: {
  a: { tags: ["clojure", "meta"] },
  b: { tags: ["clojure"] },
  c: { tags: [] },
  d: { tags: ["war"] },
} };

assert.deepEqual(
  tagCounts(cloudIndex),
  [["clojure", 2], ["meta", 1], ["war", 1]],
  "tagCounts should count notes per tag, most used first, ties alphabetical"
);
assert.deepEqual(tagCounts({ notes: {} }), [], "tagCounts should be empty for an empty index");

assert.equal(tagScale(0, 5), 13, "tagScale should give the minimum size to an unused tag");
assert.equal(tagScale(5, 5), 30, "tagScale should give the maximum size to the most used tag");
assert.ok(
  tagScale(1, 4) < tagScale(2, 4) && tagScale(2, 4) < tagScale(4, 4),
  "tagScale should grow monotonically with count"
);
assert.equal(tagScale(3, 0), 13, "tagScale should stay at minimum when the index has no tags");
console.log("tag cloud tests passed");

import { testSlugOf, quizStart, quizReveal, quizGrade, quizDone } from "../app.js";

assert.equal(testSlugOf("test:my-note"), "my-note", "testSlugOf should unwrap the note slug from a test: pane slug");
assert.equal(testSlugOf("my-note"), null, "testSlugOf should return null for ordinary note slugs");
assert.equal(testSlugOf("timeline"), null, "testSlugOf should return null for other synthetic slugs");

assert.deepEqual(quizStart(), { position: 0, revealed: false, recalled: 0 }, "quizStart should begin at the first prompt, unrevealed");
assert.deepEqual(quizReveal(quizStart()), { position: 0, revealed: true, recalled: 0 }, "quizReveal should expose the answer without advancing");
assert.deepEqual(
  quizGrade(quizReveal(quizStart()), true),
  { position: 1, revealed: false, recalled: 1 },
  "quizGrade should advance and count a recalled answer"
);
assert.deepEqual(
  quizGrade(quizReveal(quizStart()), false),
  { position: 1, revealed: false, recalled: 0 },
  "quizGrade should advance without counting a forgotten answer"
);
assert.equal(quizDone(quizStart(), 2), false, "quizDone should be false while prompts remain");
assert.equal(quizDone({ position: 2, revealed: false, recalled: 1 }, 2), true, "quizDone should be true past the last prompt");

assert.equal(
  trailAsMd(["a", "test:a"], { a: { file: "a.md", title: "A" } }),
  "- [A](a.md)",
  "trailAsMd should exclude test panes from the copied trail"
);
console.log("test-pane tests passed");

assert.deepEqual(parseStack("?stack=a,test:a"), ["a", "test:a"], "parseStack should keep test panes through a URL round-trip");
assert.deepEqual(parseStack("?stack=test"), ["test"], "parseStack should accept the bare site-wide test slug");
assert.deepEqual(parseStack("?stack=test:../evil"), ["about-these-notes"], "parseStack should still reject unsafe slugs inside a test pane");
assert.deepEqual(closePane(["a", "test:a"], 1), ["a"], "closePane should close a test pane like any other");

import { quizPrompts } from "../app.js";

const quizIndex = {
  notes: {
    a: { prompts: [{ q: "qa", a: "aa" }] },
    b: { prompts: [] },
    c: { prompts: [{ q: "qc", a: "ac" }] },
  },
};

assert.deepEqual(
  quizPrompts(quizIndex, ["a", "b", "test"]),
  [{ q: "qa", a: "aa", slug: "a" }],
  "quizPrompts should gather prompts from open notes, tagged with their source"
);
assert.deepEqual(
  quizPrompts(quizIndex, ["test"]),
  [{ q: "qa", a: "aa", slug: "a" }, { q: "qc", a: "ac", slug: "c" }],
  "quizPrompts should fall back to every note site-wide when no notes are open"
);
assert.deepEqual(
  quizPrompts(quizIndex, ["b", "test"]),
  [{ q: "qa", a: "aa", slug: "a" }, { q: "qc", a: "ac", slug: "c" }],
  "quizPrompts should fall back site-wide when open notes have no prompts"
);
assert.deepEqual(
  quizPrompts(quizIndex, ["a", "a", "timeline", "test"]),
  [{ q: "qa", a: "aa", slug: "a" }],
  "quizPrompts should ignore synthetic panes and not double-count repeated notes"
);
console.log("quiz aggregation tests passed");

import { appendPane } from "../app.js";
assert.deepEqual(appendPane(["a", "b"], "test"), ["a", "b", "test"], "appendPane should add a pane to the end of the stack");
assert.deepEqual(appendPane(["a", "test"], "test"), ["a", "test"], "appendPane should not duplicate an already-open pane");
console.log("append pane tests passed");

assert.ok(/<code[^>]*>head<\/code>/.test(mdToHtml("Is `head` replacing `car`?")), "mdToHtml should render md inline code in prompt fragments");
console.log("prompt rendering tests passed");

import { siteTitleText } from "../app.js";
assert.equal(siteTitleText("d42fgw3"), "vlnn.dev/d42fgw3", "siteTitleText should show the deployed commit hash");
assert.equal(siteTitleText(""), "vlnn.dev / notes", "siteTitleText should fall back to the plain title without a hash");
assert.equal(siteTitleText(undefined), "vlnn.dev / notes", "siteTitleText should fall back when the index predates the commit field");
console.log("site title tests passed");

import { minLaneGap, feasibleBlend, fisheyeX, trackFraction } from "../app.js";

assert.equal(
  minLaneGap([{ x: 0, lane: 0 }, { x: 0.35, lane: 1 }, { x: 0.3, lane: 0 }]),
  0.3,
  "minLaneGap should report the smallest x-gap between neighbours sharing a lane"
);
assert.equal(minLaneGap([{ x: 0.5, lane: 0 }]), Infinity, "minLaneGap should be infinite when no lane holds two dots");

function burstNotes(count, startDay) {
  return Array.from({ length: count }, (_, at) => ({
    slug: `n${String(at).padStart(2, "0")}`,
    date: `2026-08-${String(startDay + (at % 8)).padStart(2, "0")}`,
  }));
}
const bursty = [{ slug: "old", date: "2022-01-01" }, { slug: "older", date: "2023-01-01" }, ...burstNotes(30, 1)];

assert.equal(
  feasibleBlend([{ slug: "a", date: "2022-01-01" }, { slug: "b", date: "2023-01-01" }, { slug: "c", date: "2024-01-01" }], 0.02),
  0.4,
  "feasibleBlend should keep the base blend when it already satisfies the gap"
);
assert.ok(feasibleBlend(bursty, 0.05) > 0.4, "feasibleBlend should raise the blend for a burst the base blend cannot decompress");
assert.equal(feasibleBlend(burstNotes(8, 1), 0.5), 1, "feasibleBlend should cap at pure rank when no blend can satisfy the gap");

const adaptive = timeArrowLayout(bursty, 0.05);
assert.ok(minLaneGap(adaptive) >= 0.05, "timeArrowLayout should pick a blend that keeps every same-lane gap above the minimum when feasible");
assert.ok(
  adaptive.every((dot, at) => at === 0 || dot.x >= adaptive[at - 1].x),
  "timeArrowLayout should stay chronological under an adaptive blend"
);
assert.deepEqual(
  timeArrowLayout(bursty, 0.05).map((dot) => dot.x),
  timeArrowLayout(bursty, 0.05, feasibleBlend(bursty, 0.05)).map((dot) => dot.x),
  "timeArrowLayout should default to the feasible blend so callers can share it with yearTicks"
);
console.log("adaptive blend tests passed");

assert.equal(fisheyeX(0.3, 0.3, 3), 0.3, "fisheyeX should keep the focus point fixed");
assert.equal(fisheyeX(0, 0.3, 3), 0, "fisheyeX should pin the left edge of the axis");
assert.equal(fisheyeX(1, 0.3, 3), 1, "fisheyeX should pin the right edge of the axis");
assert.equal(fisheyeX(0.7, 0.3, 0), 0.7, "fisheyeX should be the identity at zero distortion");

const nearGap = fisheyeX(0.32, 0.3, 3) - fisheyeX(0.3, 0.3, 3);
assert.ok(nearGap > 0.02, "fisheyeX should magnify spacing next to the focus");

const farGap = fisheyeX(0.95, 0.1, 3) - fisheyeX(0.9, 0.1, 3);
assert.ok(farGap < 0.05, "fisheyeX should compress spacing far from the focus");

const grid = Array.from({ length: 101 }, (_, at) => at / 100);
assert.ok(
  grid.every((x, at) => at === 0 || fisheyeX(x, 0.37, 3) > fisheyeX(grid[at - 1], 0.37, 3)),
  "fisheyeX should stay strictly monotone so chronology never reorders under the lens"
);

assert.equal(trackFraction(1006, 6), 0, "trackFraction should map the left track edge to 0");
assert.equal(trackFraction(1032, 1006), 1, "trackFraction should map the right track edge to 1");
assert.equal(trackFraction(1032, 506), 0.5, "trackFraction should map the track midpoint to 0.5");
assert.equal(trackFraction(1032, 0), 0, "trackFraction should clamp positions left of the track");
assert.equal(trackFraction(1032, 2000), 1, "trackFraction should clamp positions right of the track");
console.log("fisheye tests passed");

import { monthTicks, thinTicks } from "../app.js";

const spring = monthTicks([{ date: "2024-02-15" }, { date: "2024-05-10" }]);
assert.deepEqual(
  spring.map((tick) => tick.label),
  ["mar", "apr", "may"],
  "monthTicks should mark each first-of-month inside the range"
);
assert.ok(spring.every((tick) => tick.x > 0 && tick.x < 1), "monthTicks should position ticks strictly inside the axis");

assert.deepEqual(
  monthTicks([{ date: "2023-11-15" }, { date: "2024-02-10" }]).map((tick) => tick.label),
  ["dec", "feb"],
  "monthTicks should leave January to the year tick"
);
assert.deepEqual(monthTicks([{ date: "2024-03-01" }, { date: "2024-03-20" }]), [], "monthTicks should be empty when no month boundary is crossed");
assert.deepEqual(monthTicks([{ date: "2024-03-05" }]), [], "monthTicks should be empty for a zero span");

const crowdedTicks = thinTicks(
  [
    { label: "2026", x: 0.5 },
    { label: "aug", x: 0.505 },
    { label: "sep", x: 0.6 },
  ],
  0.02
);
assert.deepEqual(
  crowdedTicks.map((tick) => tick.label),
  ["2026", "sep"],
  "thinTicks should drop a later tick crowding an earlier-priority one"
);
assert.deepEqual(
  thinTicks([{ label: "a", x: 0.1 }, { label: "b", x: 0.12 }], 0.02).map((tick) => tick.label),
  ["a", "b"],
  "thinTicks should keep ticks separated by exactly the minimum gap"
);
console.log("month tick tests passed");
