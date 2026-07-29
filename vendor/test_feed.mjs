import assert from "node:assert/strict";
import { escapeXml, rfc822, feedItems, buildFeed } from "../tools/build_feed.mjs";

assert.equal(escapeXml('a<b>&"c"'), "a&lt;b&gt;&amp;&quot;c&quot;", "escapeXml should escape all xml-significant characters");
assert.equal(rfc822("2024-05-20"), "Mon, 20 May 2024 00:00:00 GMT", "rfc822 should format org dates as RFC-822 pubDates at midnight UTC");

const index = {
  notes: {
    b: { title: "B & co", date: "2022-01-01", file: "b.org", tags: [] },
    a: { title: "A", date: "2024-06-01", file: "a.md", tags: ["x"] },
    meta: { title: "No date", date: "", file: "meta.org", tags: [] },
  },
};
const rendered = { a: "<p><strong>bold</strong></p>", b: "<p>hi</p>", meta: "<p>skip</p>" };

const items = feedItems("https://vlnn.dev", index, rendered);
assert.deepEqual(items.map((item) => item.slug), ["a", "b"], "feedItems should order dated notes newest first and drop undated ones");
assert.equal(items[0].link, "https://vlnn.dev/?stack=a", "feedItems should permalink into the stacked view");

const xml = buildFeed("https://vlnn.dev", index, rendered);
assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "buildFeed should emit an xml prolog");
assert.ok(xml.includes("<title>B &amp; co</title>"), "buildFeed should escape titles");
assert.ok(xml.includes("&lt;strong&gt;bold&lt;/strong&gt;"), "buildFeed should embed rendered note html escaped in descriptions");
assert.ok(xml.indexOf("stack=a") < xml.indexOf("stack=b"), "buildFeed should keep newest-first item order");
assert.ok(!xml.includes("No date"), "buildFeed should exclude undated notes");
console.log("feed tests passed");
