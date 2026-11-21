import assert from "node:assert/strict";
import {
  parseChronoDate,
  parseDatedItem,
  fitView,
  zoomLimits,
  zoomView,
  panView,
  timeToX,
  xToTime,
  ticksFor,
  layoutRows,
  rangeLabel,
  isChronology,
} from "../chronology.js";

const utc = (year, month = 1, day = 1) => Date.UTC(year, month - 1, day);
const DAY = 864e5;

const dateCases = [
  ["1969-07-20", { from: utc(1969, 7, 20), to: utc(1969, 7, 21) }, "parseChronoDate should make a full date span exactly that day"],
  ["1957-10", { from: utc(1957, 10), to: utc(1957, 11) }, "parseChronoDate should make a year-month span the whole month"],
  ["1957-12", { from: utc(1957, 12), to: utc(1958, 1) }, "parseChronoDate should roll a December span over into the next year"],
  ["1961", { from: utc(1961), to: utc(1962) }, "parseChronoDate should make a bare year span the whole year"],
  ["1957-13", null, "parseChronoDate should reject a month past December"],
  ["1957-10-32", null, "parseChronoDate should reject a day past the 31st"],
  ["1957-00", null, "parseChronoDate should reject month zero"],
  ["957", null, "parseChronoDate should reject years that are not zero-padded to four digits"],
  ["soon", null, "parseChronoDate should reject text that is not a date"],
];
for (const [text, expected, message] of dateCases) assert.deepEqual(parseChronoDate(text), expected, message);

{
  const ides = parseChronoDate("-0044-03-15");
  assert.equal(new Date(ides.from).getUTCFullYear(), -44, "parseChronoDate should read a leading minus as a BCE year");
  assert.equal(ides.to - ides.from, DAY, "parseChronoDate should keep day precision for BCE dates");
  const nero = parseChronoDate("0064");
  assert.equal(new Date(nero.from).getUTCFullYear(), 64, "parseChronoDate should not shift two-digit years into the 1900s");
}
console.log("chronology date tests passed");

const span = (from, to) => ({ from, to });
const itemCases = [
  [
    "1969-07-20 — Apollo 11 lands",
    { when: "1969-07-20", label: "Apollo 11 lands", ...span(utc(1969, 7, 20), utc(1969, 7, 21)) },
    "parseDatedItem should split a date from its label at an em dash",
  ],
  [
    "1957: Sputnik",
    { when: "1957", label: "Sputnik", ...span(utc(1957), utc(1958)) },
    "parseDatedItem should accept a colon between date and label",
  ],
  [
    "1961-04 Gagarin flies",
    { when: "1961-04", label: "Gagarin flies", ...span(utc(1961, 4), utc(1961, 5)) },
    "parseDatedItem should accept a bare space between date and label",
  ],
  [
    "1961..1972 — Apollo program",
    { when: "1961..1972", label: "Apollo program", ...span(utc(1961), utc(1973)) },
    "parseDatedItem should read a..b as a range ending when the second date ends",
  ],
  [
    "1939-1945 war",
    { when: "1939-1945", label: "war", ...span(utc(1939), utc(1946)) },
    "parseDatedItem should read two hyphenated years as a range",
  ],
  [
    "1998-11-20 – 2011-07-08: assembly",
    { when: "1998-11-20 – 2011-07-08", label: "assembly", ...span(utc(1998, 11, 20), utc(2011, 7, 9)) },
    "parseDatedItem should read an en dash between two dates as a range",
  ],
  [
    "1990/1993 - blurry years",
    { when: "1990/1993", label: "blurry years", ...span(utc(1990), utc(1994)) },
    "parseDatedItem should read the ISO slash as a range",
  ],
  [
    "  1977-09-05\n  Voyager 1  ",
    { when: "1977-09-05", label: "Voyager 1", ...span(utc(1977, 9, 5), utc(1977, 9, 6)) },
    "parseDatedItem should ignore surrounding whitespace and line breaks",
  ],
  ["1957", { when: "1957", label: "1957", ...span(utc(1957), utc(1958)) }, "parseDatedItem should label a bare date with itself"],
  ["1972..1961 backwards", null, "parseDatedItem should reject a range that ends before it starts"],
  ["2000s were odd", null, "parseDatedItem should reject a number glued to text"],
  ["3 apples", null, "parseDatedItem should reject short numbers"],
  ["Apollo 1969", null, "parseDatedItem should reject items that do not start with a date"],
  ["1957-1 x", null, "parseDatedItem should reject a malformed month"],
];
for (const [text, expected, message] of itemCases) assert.deepEqual(parseDatedItem(text), expected, message);
console.log("chronology item tests passed");

const kindCases = [
  [{ kind: "chronology" }, true, "isChronology should accept the chronology kind"],
  [{ kind: "", tags: ["apl", "chronology"] }, true, "isChronology should accept the chronology tag, which survives tools that rewrite frontmatter"],
  [{ kind: "", tags: ["apl"] }, false, "isChronology should reject notes tagged with something else"],
  [{ kind: "" }, false, "isChronology should reject ordinary notes"],
  [{}, false, "isChronology should reject notes indexed before kinds existed"],
  [undefined, false, "isChronology should reject unknown notes"],
];
for (const [note, expected, message] of kindCases) assert.equal(isChronology(note), expected, message);

const events = [span(1000, 2000), span(5000, 9000), span(3000, 3100)];

assert.deepEqual(fitView(events), span(600, 9400), "fitView should cover every event plus a 5% margin on each side");
assert.deepEqual(
  zoomLimits(events),
  { from: 600, to: 9400, minSpan: 300 },
  "zoomLimits should stop zooming in at three times the shortest event"
);

const limits = { from: 0, to: 1000, minSpan: 10 };
const viewCases = [
  [() => zoomView(span(0, 1000), 2, 500, limits), span(250, 750), "zoomView should halve the span around a centred anchor"],
  [() => zoomView(span(0, 1000), 2, 0, limits), span(0, 500), "zoomView should keep the anchor time where it was"],
  [() => zoomView(span(250, 750), 0.25, 500, limits), span(0, 1000), "zoomView should not zoom out past the limits"],
  [() => zoomView(span(495, 505), 4, 500, limits), span(495, 505), "zoomView should not zoom in past the minimum span"],
  [() => zoomView(span(0, 500), 0.5, 500, limits), span(0, 1000), "zoomView should slide back inside the limits when zooming out at an edge"],
  [() => panView(span(100, 300), 50, limits), span(150, 350), "panView should shift the view by the given time"],
  [() => panView(span(100, 300), -500, limits), span(0, 200), "panView should stop at the left limit keeping the span"],
  [() => panView(span(700, 900), 500, limits), span(800, 1000), "panView should stop at the right limit keeping the span"],
  [() => timeToX(span(100, 300), 400, 150), 100, "timeToX should map time linearly onto the width"],
  [() => xToTime(span(100, 300), 400, 100), 150, "xToTime should invert timeToX"],
];
for (const [run, expected, message] of viewCases) assert.deepEqual(run(), expected, message);
console.log("chronology view tests passed");

const labels = (view, maxTicks) => ticksFor(view, maxTicks).map((tick) => tick.label);
const tickCases = [
  [span(utc(1957), utc(1961)), 6, ["1957", "1958", "1959", "1960", "1961"], "ticksFor should mark every year when they fit"],
  [span(utc(1955, 6), utc(1975, 6)), 6, ["1960", "1965", "1970", "1975"], "ticksFor should fall back to round multiples of years"],
  [span(utc(1969, 6, 20), utc(1969, 9, 10)), 4, ["1969-07", "1969-08", "1969-09"], "ticksFor should mark months inside a single year"],
  [span(utc(1969, 11, 15), utc(1970, 2, 15)), 4, ["1969-12", "1970-01", "1970-02"], "ticksFor should carry month ticks across new year"],
  [span(utc(1969, 7, 19), utc(1969, 7, 22)), 5, ["1969-07-19", "1969-07-20", "1969-07-21", "1969-07-22"], "ticksFor should mark days when zoomed all the way in"],
  [span(utc(1900), utc(2000)), 3, ["1900", "1950", "2000"], "ticksFor should respect the tick budget"],
];
for (const [view, maxTicks, expected, message] of tickCases) assert.deepEqual(labels(view, maxTicks), expected, message);

assert.equal(
  ticksFor(span(utc(1957), utc(1961)), 6)[1].at,
  utc(1958),
  "ticksFor should place each tick at the start of its period"
);
{
  const bce = new Date(Date.UTC(2000, 0, 1));
  bce.setUTCFullYear(-100);
  const ce = new Date(Date.UTC(2000, 0, 1));
  ce.setUTCFullYear(100);
  assert.deepEqual(
    labels(span(bce.getTime(), ce.getTime()), 5),
    ["-0100", "-0050", "0000", "0050", "0100"],
    "ticksFor should label BCE years with a minus and pad every year to four digits"
  );
}
const rangeCases = [
  [span(utc(1957), utc(1972)), "1957 → 1972", "rangeLabel should name only years for a view of several years"],
  [span(utc(1969, 5, 3), utc(1970, 2, 1)), "1969-05 → 1970-02", "rangeLabel should name months for a view of several months"],
  [span(utc(1969, 7, 19), utc(1969, 7, 22)), "1969-07-19 → 1969-07-22", "rangeLabel should name days for a view of a few days"],
];
for (const [view, expected, message] of rangeCases) assert.equal(rangeLabel(view), expected, message);
console.log("chronology tick tests passed");

const box = (left, bar, label) => ({ left, bar, label });
const GAP = 8;
const rowCases = [
  [
    [box(0, 5, 100), box(200, 5, 100)],
    3,
    [{ row: 0, room: 100 }, { row: 0, room: 100 }],
    "layoutRows should share a row between events that do not touch",
  ],
  [
    [box(0, 5, 100), box(50, 5, 100)],
    3,
    [{ row: 0, room: 100 }, { row: 1, room: 100 }],
    "layoutRows should open a new row for an event under an earlier label",
  ],
  [
    [box(0, 5, 100), box(50, 5, 100), box(120, 5, 100)],
    3,
    [{ row: 0, room: 100 }, { row: 1, room: 100 }, { row: 0, room: 100 }],
    "layoutRows should reuse the lowest row that has become free",
  ],
  [
    [box(0, 5, 100), box(50, 5, 100)],
    1,
    [{ row: 0, room: 50 - GAP }, { row: 0, room: 100 }],
    "layoutRows should cut an earlier label short once rows run out",
  ],
  [
    [box(0, 5, 200), box(20, 5, 60), box(50, 5, 100)],
    2,
    [{ row: 0, room: 200 }, { row: 1, room: 30 - GAP }, { row: 1, room: 100 }],
    "layoutRows should cut the label that loses least",
  ],
  [
    [box(0, 300, 40), box(100, 5, 40), box(150, 5, 40)],
    2,
    [{ row: 0, room: 40 }, { row: 1, room: 40 }, { row: 1, room: 40 }],
    "layoutRows should keep later events off a long bar while another row is open",
  ],
  [[], 3, [], "layoutRows should lay out nothing for no events"],
];
for (const [boxes, maxRows, expected, message] of rowCases) assert.deepEqual(layoutRows(boxes, maxRows, GAP), expected, message);
console.log("chronology layout tests passed");
