import assert from "node:assert/strict";
import { parseStack, stackUrl, stackAfter, slugFromHref, visiblePanes, trailOf, timelineEntries, timeArrowLayout, yearTicks, trailAsOrg } from "../app.js";

const cases = [
  [() => parseStack("?stackedNotes=a&stackedNotes=b"), ["a", "b"], "parseStack should read repeated params in order"],
  [() => parseStack(""), ["about-these-notes"], "parseStack should default to the entry note"],
  [() => stackUrl(["a", "b"]), "?stack=a,b", "stackUrl should serialize the stack as one comma-separated param"],
  [() => parseStack("?stack=a,b,c"), ["a", "b", "c"], "parseStack should read the compact comma form"],
  [() => parseStack("?stack="), ["about-these-notes"], "parseStack should fall back to the entry note for an empty stack param"],
  [() => stackAfter(["a", "b", "c"], 0, "d"), ["a", "d"], "stackAfter should truncate panes right of the source pane"],
  [() => stackAfter(["a", "b"], 1, "a"), ["a", "b"], "stackAfter should not duplicate an already-open note"],
  [() => slugFromHref("file:other.org"), "other", "slugFromHref should strip the file: prefix"],
  [() => slugFromHref("./other.org"), "other", "slugFromHref should accept relative ./ links"],
  [() => slugFromHref("https://x.com/a.org"), null, "slugFromHref should ignore external urls"],
  [() => slugFromHref("static/pic.gif"), null, "slugFromHref should ignore non-org paths"],
  [() => visiblePanes(["a", "b", "c"], true), [["c", 2]], "visiblePanes should show only the last note with its stack index on narrow screens"],
  [() => visiblePanes(["a", "b"], false), [["a", 0], ["b", 1]], "visiblePanes should show the whole stack on wide screens"],
  [() => trailOf(["a", "b", "c"], true), ["a", "b"], "trailOf should list earlier notes as breadcrumbs on narrow screens"],
  [() => trailOf(["a"], true), [], "trailOf should be empty for a single-note stack"],
  [() => trailOf(["a", "b"], false), [], "trailOf should be empty on wide screens"],
];

for (const [run, expected, message] of cases) assert.deepEqual(run(), expected, message);
console.log(`${cases.length} app tests passed`);

import { noteToHtml, mdToHtml, orgToHtml } from "./org.js";

const mdHtml = mdToHtml("---\ntitle: x\n---\n\n**bold** and a [link](a.org)\n\n| a | b |\n|---|---|\n| 1 | 2 |");
assert.ok(mdHtml.includes("<strong>bold</strong>"), "mdToHtml should render markdown emphasis");
assert.ok(!mdHtml.includes("title: x"), "mdToHtml should strip YAML frontmatter");
assert.ok(mdHtml.includes("<table>"), "mdToHtml should render GFM tables");
assert.equal(slugFromHref("a.md"), "a", "slugFromHref should treat bare .md links as notes");
assert.ok(noteToHtml("n.md", "*em*").includes("<em>"), "noteToHtml should route .md to remark");
assert.ok(noteToHtml("n.org", "*em*").includes("<strong>"), "noteToHtml should route .org to uniorg, where * means bold");
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
  "about-these-notes": { title: "About these notes", file: "about-these-notes.org" },
  "how-this-site-works": { title: "How this site works", file: "how-this-site-works.md" },
};
assert.equal(
  trailAsOrg(["about-these-notes", "timeline", "how-this-site-works"], trailNotes),
  "- [[file:about-these-notes.org][About these notes]]\n- [[file:how-this-site-works.md][How this site works]]",
  "trailAsOrg should emit an org list of file links, keeping md extensions and skipping synthetic panes"
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
  { slug: "a", x: 0 },
  { slug: "b", x: 0.5 },
  { slug: "c", x: 1 },
];

assert.deepEqual(
  arcPairs(arcIndex, arcLayout),
  [{ from: "a", to: "b", fromX: 0, toX: 0.5 }],
  "arcPairs should dedupe mutual links into one chronological arc, dropping self-links and slugs missing from the layout"
);
assert.deepEqual(arcPairs({ notes: {} }, []), [], "arcPairs should be empty for an empty graph");

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
  [() => parseStack("?stack=good,%3Cimg%20src%3Dx%3E"), ["good"], "parseStack should drop slugs containing characters outside a-z 0-9 dash"],
  [() => parseStack("?stack=..%2F..%2Fsecret"), ["about-these-notes"], "parseStack should fall back to the entry note when every slug is invalid"],
  [() => parseStack("?stackedNotes=ok&stackedNotes=Not%20OK"), ["ok"], "parseStack should validate the legacy form the same way"],
  [() => parseStack("?stack=a1-b2,timeline"), ["a1-b2", "timeline"], "parseStack should keep well-formed slugs and synthetic panes untouched"],
];
for (const [run, expected, message] of slugSafetyCases) assert.deepEqual(run(), expected, message);
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
