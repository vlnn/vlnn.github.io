import assert from "node:assert/strict";
import { escapeXml, rfc822, rfc3339, feedItems, buildFeed, buildAtom } from "../tools/build_feed.mjs";

assert.equal(escapeXml('a<b>&"c"'), "a&lt;b&gt;&amp;&quot;c&quot;", "escapeXml should escape all xml-significant characters");
assert.equal(rfc822("2024-05-20"), "Mon, 20 May 2024 00:00:00 GMT", "rfc822 should format org dates as RFC-822 pubDates at midnight UTC");

const index = {
  notes: {
    b: { title: "B & co", date: "2022-01-01", file: "b.org", tags: [] },
    a: { title: "A", date: "2024-06-01", file: "a.md", tags: ["x"] },
    meta: { title: "No date", date: "", file: "meta.org", tags: [] },
  },
};
const rendered = { a: '<p><strong>bold</strong></p><img src="file:static/x.png">', b: "<p>hi</p>", meta: "<p>skip</p>" };

const items = feedItems("https://vlnn.dev", index, rendered);
assert.deepEqual(items.map((item) => item.slug), ["a", "b"], "feedItems should order dated notes newest first and drop undated ones");
assert.equal(items[0].link, "https://vlnn.dev/?stack=a", "feedItems should permalink into the stacked view");

const xml = buildFeed("https://vlnn.dev", index, rendered);
assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "buildFeed should emit an xml prolog");
assert.ok(xml.includes("<title>B &amp; co</title>"), "buildFeed should escape titles");
assert.ok(xml.includes("&lt;strong&gt;bold&lt;/strong&gt;"), "buildFeed should embed rendered note html escaped in descriptions");
assert.ok(xml.indexOf("stack=a") < xml.indexOf("stack=b"), "buildFeed should keep newest-first item order");
assert.ok(!xml.includes("No date"), "buildFeed should exclude undated notes");
assert.ok(xml.includes(escapeXml('src="https://vlnn.dev/static/x.png"')), "buildFeed should absolutize file: image sources so readers can load them");
assert.ok(!xml.includes("file:static"), "buildFeed should leave no file: urls behind");

assert.equal(rfc3339("2024-05-20"), "2024-05-20T00:00:00Z", "rfc3339 should format org dates as atom timestamps at midnight UTC");

const atom = buildAtom("https://vlnn.dev", index, rendered);
assert.ok(atom.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "buildAtom should emit an xml prolog");
assert.ok(atom.includes('<feed xmlns="http://www.w3.org/2005/Atom">'), "buildAtom should use the atom root element");
assert.ok(atom.includes("<id>https://vlnn.dev/</id>"), "buildAtom should use the site url as feed id");
assert.ok(atom.includes("<updated>2024-06-01T00:00:00Z</updated>"), "buildAtom should set feed updated to the newest note date");
assert.ok(atom.includes('rel="self"') && atom.includes("atom.xml"), "buildAtom should self-link to atom.xml");
assert.ok(atom.includes("<title>B &amp; co</title>"), "buildAtom should escape entry titles");
assert.ok(atom.includes("&lt;strong&gt;bold&lt;/strong&gt;"), "buildAtom should embed rendered note html escaped in content");
assert.ok(atom.includes('<content type="html">'), "buildAtom should mark content as html");
assert.ok(atom.includes("<id>https://vlnn.dev/?stack=a</id>"), "buildAtom should use the permalink as entry id");
assert.ok(atom.indexOf("stack=a") < atom.indexOf("stack=b"), "buildAtom should keep newest-first entry order");
assert.ok(!atom.includes("No date"), "buildAtom should exclude undated notes");
assert.ok(atom.includes("<name>Volodymyr Anokhin</name>"), "buildAtom should declare a feed author as atom requires");
assert.ok(!atom.includes("file:static"), "buildAtom should leave no file: urls behind");
console.log("feed tests passed");
