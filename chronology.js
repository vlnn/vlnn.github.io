const KIND = "chronology";

const DAY = 864e5;
const MONTH = 30.436875 * DAY;
const YEAR = 12 * MONTH;

const DATE = String.raw`-?\d{4,6}(?:-\d{2}(?:-\d{2})?)?`;
const RANGE_MARK = String.raw`\s*(?:\.\.|–|/|-)\s*`;
const LABEL_MARK = String.raw`(?:\s*[—–:]\s*|\s+-\s+|\s+|$)`;
const DATE_PARTS = /^(-?\d{4,6})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const DATED_ITEM = new RegExp(`^((${DATE})(?:${RANGE_MARK}(${DATE}))?)${LABEL_MARK}(.*)$`);

const FIT_MARGIN = 0.05;
const FINEST_ZOOM = 3;

export function isChronology(note) {
  return note?.kind === KIND || Boolean(note?.tags?.includes(KIND));
}

// Date.UTC reads years 0–99 as 1900–1999, so the year is set separately
function monthStart(monthIndex) {
  const date = new Date(Date.UTC(2000, ((monthIndex % 12) + 12) % 12, 1));
  date.setUTCFullYear(Math.floor(monthIndex / 12));
  return date.getTime();
}

function monthIndexOf(time) {
  const date = new Date(time);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function inCalendar(month, day) {
  return (month === undefined || (month >= 1 && month <= 12)) && (day === undefined || (day >= 1 && day <= 31));
}

function daySpan(firstMonth, day) {
  const from = monthStart(firstMonth) + (day - 1) * DAY;
  return { from, to: from + DAY };
}

function monthsSpan(firstMonth, months) {
  return { from: monthStart(firstMonth), to: monthStart(firstMonth + months) };
}

export function parseChronoDate(text) {
  const match = DATE_PARTS.exec(text);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map((part) => (part === undefined ? undefined : Number(part)));
  if (!inCalendar(month, day)) return null;
  const firstMonth = year * 12 + (month ?? 1) - 1;
  if (day !== undefined) return daySpan(firstMonth, day);
  return monthsSpan(firstMonth, month === undefined ? 12 : 1);
}

function spanBetween(start, end) {
  if (!start || !end || end.from < start.from) return null;
  return { from: start.from, to: end.to };
}

export function parseDatedItem(text) {
  const match = DATED_ITEM.exec(text.replace(/\s+/g, " ").trim());
  if (!match) return null;
  const [, when, first, last, label] = match;
  const span = spanBetween(parseChronoDate(first), parseChronoDate(last ?? first));
  return span && { when, label: label || when, ...span };
}

export function fitView(events) {
  const from = Math.min(...events.map((event) => event.from));
  const to = Math.max(...events.map((event) => event.to));
  const margin = (to - from) * FIT_MARGIN;
  return { from: from - margin, to: to + margin };
}

export function zoomLimits(events) {
  const fit = fitView(events);
  const shortest = Math.min(...events.map((event) => event.to - event.from));
  return { ...fit, minSpan: Math.min(shortest * FINEST_ZOOM, fit.to - fit.from) };
}

function spanOf(view) {
  return view.to - view.from;
}

function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

function viewWithin(limits, span, from) {
  const start = clamp(from, limits.from, limits.to - span);
  return { from: start, to: start + span };
}

export function zoomView(view, factor, anchor, limits) {
  const zoomed = clamp(spanOf(view) / factor, limits.minSpan, spanOf(limits));
  return viewWithin(limits, zoomed, anchor - (anchor - view.from) * (zoomed / spanOf(view)));
}

export function panView(view, shift, limits) {
  return viewWithin(limits, spanOf(view), view.from + shift);
}

export function timeToX(view, width, time) {
  return ((time - view.from) / spanOf(view)) * width;
}

export function xToTime(view, width, x) {
  return view.from + (x / width) * spanOf(view);
}

const pad = (number, length) => String(Math.abs(number)).padStart(length, "0");

function isoYear(date) {
  return `${date.getUTCFullYear() < 0 ? "-" : ""}${pad(date.getUTCFullYear(), 4)}`;
}

function isoMonth(date) {
  return `${isoYear(date)}-${pad(date.getUTCMonth() + 1, 2)}`;
}

function isoDay(date) {
  return `${isoMonth(date)}-${pad(date.getUTCDate(), 2)}`;
}

const DAY_STEPS = [1, 7].map((days) => ({ length: days * DAY, days }));
const MONTH_STEPS = [1, 3, 6].map((months) => ({ length: months * MONTH, months }));
const YEAR_STEPS = [0, 1, 2, 3, 4, 5]
  .flatMap((power) => [1, 2, 5].map((digit) => digit * 10 ** power))
  .map((years) => ({ length: years * YEAR, months: years * 12 }));
const TICK_STEPS = [...DAY_STEPS, ...MONTH_STEPS, ...YEAR_STEPS];

function tickStep(span, maxTicks) {
  return TICK_STEPS.find((step) => span / step.length <= maxTicks) ?? TICK_STEPS.at(-1);
}

function dayTicks(view, days) {
  const ticks = [];
  const step = days * DAY;
  for (let at = Math.ceil(view.from / step) * step; at <= view.to; at += step) {
    ticks.push({ at, label: isoDay(new Date(at)) });
  }
  return ticks;
}

function firstMonthFrom(time, months) {
  const month = monthIndexOf(time);
  const started = monthStart(month) < time ? month + 1 : month;
  return Math.ceil(started / months) * months;
}

function monthTicks(view, months) {
  const ticks = [];
  const label = months < 12 ? isoMonth : isoYear;
  for (let month = firstMonthFrom(view.from, months); monthStart(month) <= view.to; month += months) {
    ticks.push({ at: monthStart(month), label: label(new Date(monthStart(month))) });
  }
  return ticks;
}

export function ticksFor(view, maxTicks) {
  const step = tickStep(spanOf(view), maxTicks);
  return step.days ? dayTicks(view, step.days) : monthTicks(view, step.months);
}

function rangePrecision(span) {
  if (span >= 2 * YEAR) return isoYear;
  return span >= 2 * MONTH ? isoMonth : isoDay;
}

export function rangeLabel(view) {
  const label = rangePrecision(spanOf(view));
  return `${label(new Date(view.from))} → ${label(new Date(view.to))}`;
}

function leastBy(rows, edge) {
  return rows.reduce((least, row) => (row[edge] < least[edge] ? row : least));
}

function rowFor(rows, left) {
  const free = rows.findIndex((row) => row.labelEnd <= left);
  if (free >= 0) return free;
  const cuttable = rows.filter((row) => row.barEnd <= left);
  return rows.indexOf(cuttable.length ? leastBy(cuttable, "labelEnd") : leastBy(rows, "barEnd"));
}

// boxes come sorted by left; a label gives way to the next event in its row, a bar never does
export function layoutRows(boxes, maxRows, gap) {
  const rows = Array.from({ length: maxRows }, () => ({ barEnd: -Infinity, labelEnd: -Infinity, last: null }));
  const placed = [];
  boxes.forEach((box, position) => {
    const row = rowFor(rows, box.left - gap);
    const { last } = rows[row];
    if (last !== null) placed[last].room = clamp(box.left - gap - boxes[last].left, 0, placed[last].room);
    placed.push({ row, room: box.label });
    rows[row] = { barEnd: box.left + box.bar, labelEnd: box.left + Math.max(box.bar, box.label), last: position };
  });
  return placed;
}

const MAX_ROWS = 6;
const POINT = 5;
const GAP = 10;
const MIN_ROOM = 18;
const TICK_ROOM = 96;
const DRAG_THRESHOLD = 4;
const BUTTON_ZOOM = 1.6;
const KEY_PAN = 0.2;
const WHEEL_ZOOM = 0.01;
const LINE_HEIGHT = 16;
const TONES = 5;
const HINT = "drag to pan · ctrl+scroll or pinch to zoom · click an event to find it below";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function ownText(item) {
  const copy = item.cloneNode(true);
  copy.querySelectorAll("ul, ol").forEach((nested) => nested.remove());
  return copy.textContent;
}

function headingBefore(node) {
  let earlier = node.previousElementSibling;
  while (earlier && !/^H[1-6]$/.test(earlier.tagName)) earlier = earlier.previousElementSibling;
  return earlier;
}

function datedEvents(content) {
  return [...content.querySelectorAll(":scope > ul > li, :scope > ol > li")].flatMap((item) => {
    const event = parseDatedItem(ownText(item));
    return event ? [{ ...event, item, heading: headingBefore(item.parentElement) }] : [];
  });
}

function headingsOf(events) {
  return [...new Set(events.map((event) => event.heading))];
}

function groupName(heading) {
  return heading ? heading.textContent : "ungrouped";
}

function markTitle(event, grouped) {
  const group = grouped ? ` (${groupName(event.heading)})` : "";
  return event.label === event.when ? `${event.when}${group}` : `${event.when} — ${event.label}${group}`;
}

function toneClass(headings, heading) {
  return `chrono-tone-${headings.indexOf(heading) % TONES}`;
}

function buildMark(event, headings) {
  const mark = el("button", `chrono-mark ${toneClass(headings, event.heading)}`);
  mark.type = "button";
  mark.title = markTitle(event, headings.length > 1);
  mark.append(el("span", "chrono-label", event.label), el("span", "chrono-bar"));
  return mark;
}

function buildLegend(headings) {
  const legend = el("div", "chrono-legend");
  headings.forEach((heading) => legend.append(el("span", toneClass(headings, heading), groupName(heading))));
  return legend;
}

function zoomButton(label, name, onClick) {
  const button = el("button", "chrono-button", label);
  button.type = "button";
  button.setAttribute("aria-label", name);
  button.addEventListener("click", onClick);
  return button;
}

function linkHighlights(mark, item) {
  const light = (node, on) => () => node.classList.toggle("chrono-lit", on);
  ["mouseenter", "focus"].forEach((type) => mark.addEventListener(type, light(item, true)));
  ["mouseleave", "blur"].forEach((type) => mark.addEventListener(type, light(item, false)));
  item.addEventListener("mouseenter", light(mark, true));
  item.addEventListener("mouseleave", light(mark, false));
}

function placeMark(mark, event, slot, view, width) {
  const left = timeToX(view, width, event.from);
  const bar = Math.max(timeToX(view, width, event.to) - left, POINT);
  const start = left < 0 && left + bar > 0 ? 0 : left;
  const room = start === left ? slot.room : Math.max(slot.room, bar) + left;
  mark.hidden = start + Math.max(bar, slot.room) < 0 || start > width;
  mark.style.left = `${start}px`;
  mark.style.setProperty("--row", slot.row);
  mark.lastElementChild.style.width = `${Math.min(left + bar - start, width)}px`;
  mark.firstElementChild.style.maxWidth = `${room}px`;
  mark.firstElementChild.style.visibility = room < MIN_ROOM ? "hidden" : "";
}

function drawTicks(layer, view, width) {
  const ticks = ticksFor(view, Math.max(Math.floor(width / TICK_ROOM), 2)).map((tick) => {
    const line = el("span", "chrono-tick", tick.label);
    line.style.left = `${timeToX(view, width, tick.at)}px`;
    return line;
  });
  layer.replaceChildren(...ticks);
}

function wheelZoom(event) {
  const pixels = event.deltaY * (event.deltaMode === 1 ? LINE_HEIGHT : 1);
  return clamp(Math.exp(-pixels * WHEEL_ZOOM), 0.5, 2);
}

function distance([a, b]) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function wirePointers(stage, chart) {
  const pointers = new Map();
  let travelled = 0;
  let dragged = false;
  const release = (event) => {
    pointers.delete(event.pointerId);
    stage.classList.toggle("dragging", false);
  };
  const pinch = (before) => {
    const fingers = [...pointers.values()];
    chart.zoomAt(distance(fingers) / (before || 1), (fingers[0].x + fingers[1].x) / 2);
    dragged = true;
  };
  const drag = (event, shift) => {
    travelled += Math.abs(shift);
    if (travelled <= DRAG_THRESHOLD) return;
    dragged = true;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
    chart.panBy(-shift);
  };
  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!pointers.size) [travelled, dragged] = [0, false];
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  });
  stage.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const before = pointers.size === 2 ? distance([...pointers.values()]) : 0;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) pinch(before);
    else drag(event, event.clientX - previous.x);
  });
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  // a drag that ends over an event must not count as clicking it
  stage.addEventListener(
    "click",
    (event) => {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
}

function wireWheel(stage, chart) {
  stage.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        chart.zoomAt(wheelZoom(event), event.clientX);
      } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && chart.panBy(event.deltaX)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
  stage.addEventListener("dblclick", (event) => {
    if (!event.target.closest(".chrono-mark")) chart.zoomAt(2, event.clientX);
  });
}

function wireKeys(stage, chart) {
  const actions = {
    ArrowLeft: () => chart.panBy(-stage.clientWidth * KEY_PAN),
    ArrowRight: () => chart.panBy(stage.clientWidth * KEY_PAN),
    "+": () => chart.zoomCentre(BUTTON_ZOOM),
    "=": () => chart.zoomCentre(BUTTON_ZOOM),
    "-": () => chart.zoomCentre(1 / BUTTON_ZOOM),
    0: () => chart.fit(),
  };
  stage.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || !actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
  });
}

function buildChart(events, headings, stage, readout) {
  const limits = zoomLimits(events);
  const ticks = el("div", "chrono-ticks");
  const marks = events.map((event) => buildMark(event, headings));
  let view = fitView(events);
  let labelWidths = null;
  let slots = [];
  let laidOutFor = "";

  const measure = () => {
    marks.forEach((mark) => {
      mark.hidden = false;
      mark.firstElementChild.style.maxWidth = "";
    });
    labelWidths = marks.map((mark) => mark.firstElementChild.offsetWidth);
    laidOutFor = "";
  };
  const layout = (width) => {
    const scale = `${spanOf(view)}/${width}`;
    if (scale === laidOutFor) return;
    laidOutFor = scale;
    const boxes = events.map((event, position) => ({
      left: timeToX(view, width, event.from),
      bar: Math.max(timeToX(view, width, event.to) - timeToX(view, width, event.from), POINT),
      label: labelWidths[position],
    }));
    slots = layoutRows(boxes, Math.min(MAX_ROWS, events.length), GAP);
  };
  const draw = () => {
    const width = stage.clientWidth;
    if (!width) return;
    if (!labelWidths) measure();
    layout(width);
    marks.forEach((mark, position) => placeMark(mark, events[position], slots[position], view, width));
    drawTicks(ticks, view, width);
    readout.textContent = rangeLabel(view);
  };
  const show = (next) => {
    const moved = next.from !== view.from || next.to !== view.to;
    view = next;
    if (moved) draw();
    return moved;
  };
  const offsetOf = (clientX) => clientX - stage.getBoundingClientRect().left;
  const chart = {
    draw,
    remeasure: () => {
      labelWidths = null;
      draw();
    },
    fit: () => show(fitView(events)),
    panBy: (pixels) => show(panView(view, (pixels / stage.clientWidth) * spanOf(view), limits)),
    zoomAt: (factor, clientX) => show(zoomView(view, factor, xToTime(view, stage.clientWidth, offsetOf(clientX)), limits)),
    zoomCentre: (factor) => show(zoomView(view, factor, (view.from + view.to) / 2, limits)),
  };

  stage.style.setProperty("--rows", Math.min(MAX_ROWS, events.length));
  stage.append(ticks, el("div", "chrono-arrow"), ...marks);
  return { chart, marks };
}

function buildFigure(events, headings, reveal) {
  const figure = el("figure", "chrono");
  const readout = el("span", "chrono-range");
  const stage = el("div", "chrono-stage");
  stage.tabIndex = 0;
  stage.setAttribute("role", "group");
  stage.setAttribute("aria-label", `Arrow of time with ${events.length} events. ${HINT}`);
  const { chart, marks } = buildChart(events, headings, stage, readout);

  marks.forEach((mark, position) => {
    mark.addEventListener("click", () => reveal(events[position].item));
    linkHighlights(mark, events[position].item);
  });
  const zoom = el("span", "chrono-zoom");
  zoom.append(
    zoomButton("−", "zoom out", () => chart.zoomCentre(1 / BUTTON_ZOOM)),
    zoomButton("+", "zoom in", () => chart.zoomCentre(BUTTON_ZOOM)),
    zoomButton("fit", "show everything", () => chart.fit())
  );
  const head = el("div", "chrono-head");
  head.append(readout, zoom);
  figure.append(head, stage);
  if (headings.length > 1) figure.append(buildLegend(headings));
  figure.append(el("figcaption", "chrono-hint", HINT));

  wirePointers(stage, chart);
  wireWheel(stage, chart);
  wireKeys(stage, chart);
  new ResizeObserver(chart.draw).observe(stage);
  document.fonts?.ready.then(chart.remeasure);
  return figure;
}

export function mountChronology(content, reveal) {
  const inDocumentOrder = datedEvents(content);
  if (!inDocumentOrder.length) return;
  const first = inDocumentOrder[0];
  const events = [...inDocumentOrder].sort((a, b) => a.from - b.from || a.to - b.to);
  (first.heading ?? first.item.parentElement).before(buildFigure(events, headingsOf(inDocumentOrder), reveal));
}
