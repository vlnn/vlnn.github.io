import assert from "node:assert/strict";
import { escapeXml, rfc822, rfc3339, feedItems, buildFeed, buildAtom } from "../tools/build_feed.mjs";

assert.equal(escapeXml('a<b>&"c"'), "a&lt;b&gt;&amp;&quot;c&quot;", "escapeXml should escape all xml-significant characters");
assert.equal(rfc822("2024-05-20"), "Mon, 20 May 2024 00:00:00 GMT", "rfc822 should format note dates as RFC-822 pubDates at midnight UTC");

const feedIndex = {
  notes: {
    essay: { title: "Essay", date: "2026-02-01", words: 300 },
    older: { title: "Older", date: "2026-01-01", words: 1000 },
    glue: { title: "Glue", date: "2026-03-01", words: 40 },
    undated: { title: "Undated", date: "", words: 1000 },
  },
};
assert.deepEqual(
  feedItems("https://x.dev", feedIndex, { essay: "<p>e</p>", older: "<p>o</p>" }).map((item) => item.slug),
  ["essay", "older"],
  "feedItems should publish exactly the essays the timeline shows, newest first"
);
assert.equal(
  feedItems("https://x.dev", feedIndex, { essay: '<img src="file:static/a.png">' })[0].html,
  '<img src="https://x.dev/static/a.png">',
  "feedItems should absolutize file: urls in the rendered html"
);
console.log("feed tests passed");
