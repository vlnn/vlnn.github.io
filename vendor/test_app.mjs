import assert from "node:assert/strict";
import { parseStack, stackUrl, stackAfter, slugFromHref, visiblePanes, trailOf, timelineEntries, trailAsMd, paneKey } from "../app.js";

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
    old: { title: "Old", date: "2022-01-01", words: 250 },
    fresh: { title: "Fresh", date: "2024-06-01", words: 900 },
    undated: { title: "Undated", date: "", words: 900 },
    mid: { title: "Mid", date: "2023-03-03", words: 400 },
    stub: { title: "Stub", date: "2023-09-09", stub: true, words: 900 },
    glue: { title: "Glue", date: "2024-07-01", words: 249 },
    unknown: { title: "Unknown", date: "2024-07-02" },
  },
};

assert.deepEqual(
  timelineEntries(sampleIndex).map((entry) => entry.slug),
  ["fresh", "mid", "old"],
  "timelineEntries should list dated essays newest first, leaving out undated, stub and short glue notes"
);
assert.deepEqual(
  timelineEntries(sampleIndex)[0],
  { slug: "fresh", title: "Fresh", date: "2024-06-01", year: "2024" },
  "timelineEntries should expose slug, title, date and year per entry"
);
console.log("timeline tests passed");

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

import { revealScrollLeft } from "../app.js";

{
  const paneWidth = 520;
  const spineStep = 42;
  const viewportXAt = (paneIndex, scrollLeft) => paneIndex * paneWidth - scrollLeft;
  assert.equal(revealScrollLeft(0, paneWidth, spineStep), 0, "revealScrollLeft should keep the first pane at the container origin");
  [1, 3, 7].forEach((paneIndex) => {
    const scrollLeft = revealScrollLeft(paneIndex, paneWidth, spineStep);
    assert.equal(
      viewportXAt(paneIndex, scrollLeft),
      paneIndex * spineStep,
      "revealScrollLeft should park the pane exactly at its sticky spine slot"
    );
    assert.equal(
      viewportXAt(paneIndex + 1, scrollLeft),
      paneIndex * spineStep + paneWidth,
      "revealScrollLeft should leave the next pane starting where the revealed body ends"
    );
  });
}
console.log("reveal scroll tests passed");

import { noteLinkClass } from "../app.js";

const stubIndex = { notes: { full: { title: "Full", stub: false }, stub: { title: "Stub", stub: true } } };
[
  [() => noteLinkClass(stubIndex, "full"), "note-link", "noteLinkClass should keep plain styling for notes with a body"],
  [() => noteLinkClass(stubIndex, "stub"), "note-link empty", "noteLinkClass should mark stub notes as empty"],
  [() => noteLinkClass(stubIndex, "missing"), "note-link empty", "noteLinkClass should mark links to notes that do not exist yet as empty"],
].forEach(([actual, expected, message]) => assert.equal(actual(), expected, message));
console.log("noteLinkClass tests passed");

import { isSameSite } from "../app.js";

[
  [() => isSameSite("https://vlnn.dev/workout", "vlnn.dev"), true, "isSameSite should accept absolute links to the site's own host"],
  [() => isSameSite("https://vlnn.dev/presentations/takahashi.html", "vlnn.dev"), true, "isSameSite should accept deep same-host paths"],
  [() => isSameSite("/workout", "vlnn.dev"), true, "isSameSite should accept root-relative links"],
  [() => isSameSite("presentations/creativity.html", "vlnn.dev"), true, "isSameSite should accept relative links"],
  [() => isSameSite("#section", "vlnn.dev"), true, "isSameSite should accept in-page anchors"],
  [() => isSameSite("https://github.com/vlnn", "vlnn.dev"), false, "isSameSite should reject other hosts"],
  [() => isSameSite("mailto:me@vlnn.dev", "vlnn.dev"), false, "isSameSite should reject non-http schemes"],
].forEach(([actual, expected, message]) => assert.equal(actual(), expected, message));
console.log("isSameSite tests passed");

import { plexFocus, plexOf, rowSplit } from "../app.js";

const plexIndex = {
  notes: {
    hub: { title: "Hub", parents: [], children: ["me", "sib", "other"], jumps: [] },
    small: { title: "Small", parents: [], children: ["me", "close"], jumps: [] },
    me: { title: "Me", parents: ["hub", "small"], children: ["kid"], jumps: ["pal", "other"] },
    sib: { title: "Sib", parents: ["hub"], children: [], jumps: [] },
    close: { title: "Close", parents: ["small"], children: [], jumps: [] },
    other: { title: "Other", parents: ["hub"], children: [], jumps: ["me"] },
    kid: { title: "Kid", parents: ["me"], children: [], jumps: [] },
    pal: { title: "Pal", parents: [], children: [], jumps: ["me"] },
    bare: { title: "Bare" },
  },
};

const focusCases = [
  [["hub", "me"], "me", "plexFocus should centre the plex on the rightmost note"],
  [["me", "timeline"], "me", "plexFocus should skip synthetic panes to the last real note"],
  [["me", "test:me"], "me", "plexFocus should skip per-note quiz panes too"],
  [["tags"], null, "plexFocus should have no focus when only synthetic panes are open"],
  [["ghost"], null, "plexFocus should ignore slugs missing from the index"],
];
for (const [stack, expected, message] of focusCases) assert.equal(plexFocus(stack, plexIndex), expected, message);

const mePlex = plexOf(plexIndex, "me");
assert.deepEqual(mePlex.parents, ["hub", "small"], "plexOf should keep the index's parent order");
assert.deepEqual(mePlex.children, ["kid"], "plexOf should expose children");
assert.deepEqual(mePlex.jumps, ["pal", "other"], "plexOf should expose jumps");
assert.deepEqual(
  mePlex.siblings,
  ["close", "sib"],
  "plexOf should list siblings from the most specific parent first, without self or notes already shown as jumps"
);
assert.deepEqual(
  plexOf(plexIndex, "bare"),
  { parents: [], children: [], jumps: [], siblings: [] },
  "plexOf should treat notes without plex fields as unconnected"
);
assert.deepEqual(
  plexOf({ notes: { a: { parents: ["p"], children: [], jumps: [] }, p: { children: ["a", "a"] } } }, "a").siblings,
  [],
  "plexOf should never list a note as its own sibling"
);
assert.deepEqual(
  plexOf({ notes: { a: { parents: ["p", "q"] }, p: { children: ["a", "x"] }, q: { children: ["a", "x", "y"] }, x: {}, y: {} } }, "a").siblings,
  ["x", "y"],
  "plexOf should dedupe siblings shared by several parents"
);
assert.deepEqual(
  plexOf({ notes: { a: { parents: ["ghost"] } } }, "a"),
  { parents: [], children: [], jumps: [], siblings: [] },
  "plexOf should drop relations to notes missing from the index"
);

const splitCases = [
  [["a", "b", "c"], 5, { shown: ["a", "b", "c"], hidden: [] }, "rowSplit should show everything that fits"],
  [["a", "b", "c", "d"], 2, { shown: ["a", "b"], hidden: ["c", "d"] }, "rowSplit should hide the overflow beyond the limit"],
  [[], 3, { shown: [], hidden: [] }, "rowSplit should handle an empty row"],
];
for (const [items, limit, expected, message] of splitCases) assert.deepEqual(rowSplit(items, limit), expected, message);
console.log("plex tests passed");

import { isEssay } from "../app.js";

const essayCases = [
  [{ date: "2026-01-01", words: 250 }, true, "isEssay should accept a dated note at exactly the word threshold"],
  [{ date: "2026-01-01", words: 249 }, false, "isEssay should reject a dated note just under the threshold"],
  [{ date: "", words: 900 }, false, "isEssay should reject undated notes however long"],
  [{ date: "2026-01-01" }, false, "isEssay should reject notes without a word count"],
  [{ date: "2026-01-01", words: 900, stub: true }, false, "isEssay should reject stubs"],
];
for (const [note, expected, message] of essayCases) assert.equal(isEssay(note), expected, message);
console.log("essay tests passed");
