import { noteToHtml } from "./vendor/org.js";

const ENTRY = "about-these-notes";
const SPINE_STEP = 42;

const noteCache = new Map();
let index = { notes: {} };

export function parseStack(search) {
  const params = new URLSearchParams(search);
  const compact = (params.get("stack") || "").split(",").filter(Boolean);
  const legacy = params.getAll("stackedNotes");
  const slugs = compact.length ? compact : legacy;
  return slugs.length ? slugs : [ENTRY];
}

export function stackUrl(stack) {
  return `?stack=${stack.join(",")}`;
}

export function stackAfter(stack, paneIndex, slug) {
  const kept = stack.slice(0, paneIndex + 1);
  return kept.includes(slug) ? kept : [...kept, slug];
}

export function closePane(stack, paneIndex) {
  if (stack.length <= 1 || paneIndex >= stack.length) return stack;
  return stack.filter((_, i) => i !== paneIndex);
}

export function visiblePanes(stack, narrow) {
  const indexed = stack.map((slug, paneIndex) => [slug, paneIndex]);
  return narrow ? indexed.slice(-1) : indexed;
}

export function trailOf(stack, narrow) {
  return narrow ? stack.slice(0, -1) : [];
}

export function timelineEntries(index) {
  return Object.entries(index.notes)
    .filter(([, note]) => note.date)
    .map(([slug, note]) => ({ slug, title: note.title, date: note.date, year: note.date.slice(0, 4) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

const RANK_BLEND = 0.4;

function dateSpan(entries) {
  const times = entries.map((entry) => Date.parse(entry.date));
  return { min: Math.min(...times), span: Math.max(...times) - Math.min(...times) };
}

function linearX(time, min, span) {
  return span ? (time - min) / span : 0.5;
}

function fractionalRank(times, time) {
  const upper = times.findIndex((t) => t > time);
  if (upper < 0) return times.length - 1;
  if (upper === 0) return 0;
  return upper - 1 + (time - times[upper - 1]) / (times[upper] - times[upper - 1]);
}

function blendedX(times, min, span) {
  const steps = Math.max(times.length - 1, 1);
  return (time, rank) =>
    (1 - RANK_BLEND) * linearX(time, min, span) +
    RANK_BLEND * (rank ?? fractionalRank(times, time)) / steps;
}

function assignLane(lastAt, x, minGap) {
  const free = lastAt.findIndex((last) => x - last >= minGap);
  return free >= 0 ? free : lastAt.indexOf(Math.min(...lastAt));
}

export function timeArrowLayout(entries, minGap) {
  const ordered = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug)
  );
  if (ordered.length === 1) return [{ ...ordered[0], x: 0.5, lane: 0 }];
  const { min, span } = dateSpan(ordered);
  const scale = blendedX(ordered.map((entry) => Date.parse(entry.date)), min, span);
  const lastAt = [-Infinity, -Infinity, -Infinity];
  return ordered.map((entry, rank) => {
    const x = scale(Date.parse(entry.date), rank);
    const lane = assignLane(lastAt, x, minGap);
    lastAt[lane] = x;
    return { ...entry, x, lane };
  });
}

export function arcPairs(index, layout) {
  const xOf = new Map(layout.map((entry) => [entry.slug, entry.x]));
  const seen = new Set();
  const pairs = [];
  layout.forEach(({ slug }) => {
    ((index.notes[slug] || {}).links || []).forEach((target) => {
      if (target === slug || !xOf.has(target)) return;
      const [from, to] = xOf.get(slug) <= xOf.get(target) ? [slug, target] : [target, slug];
      const key = `${from}→${to}`;
      if (seen.has(key)) return;
      seen.add(key);
      pairs.push({ from, to, fromX: xOf.get(from), toX: xOf.get(to) });
    });
  });
  return pairs;
}

const ARC_MIN = 6;
const ARC_MAX = 44;

export function arcHeight(span) {
  return Math.min(ARC_MIN + span * 90, ARC_MAX);
}

const DOT_MIN = 9;
const DOT_MAX = 17;

export function dotScale(degree, maxDegree) {
  if (!maxDegree) return DOT_MIN;
  return DOT_MIN + (DOT_MAX - DOT_MIN) * Math.sqrt(degree / maxDegree);
}

export function yearTicks(entries) {
  const { min, span } = dateSpan(entries);
  if (!span) return [];
  const times = entries.map((entry) => Date.parse(entry.date)).sort((a, b) => a - b);
  const scale = blendedX(times, min, span);
  const ticks = [];
  const firstYear = new Date(min).getUTCFullYear() + 1;
  for (let year = firstYear; ; year++) {
    const time = Date.parse(`${year}-01-01`);
    if (linearX(time, min, span) >= 1) break;
    if (time > min) ticks.push({ year: String(year), x: scale(time) });
  }
  return ticks;
}

export function slugsForTag(index, tag) {
  return Object.entries(index.notes)
    .filter(([, note]) => (note.tags || []).includes(tag))
    .sort(([slugA, a], [slugB, b]) => {
      if (!a.date !== !b.date) return a.date ? -1 : 1;
      return a.date.localeCompare(b.date) || slugA.localeCompare(slugB);
    })
    .map(([slug]) => slug);
}

const SYNTHETIC = new Set(["timeline"]);

export function trailAsOrg(stack, notes) {
  return stack
    .filter((slug) => !SYNTHETIC.has(slug) && notes[slug])
    .map((slug) => `- [[file:${notes[slug].file}][${notes[slug].title}]]`)
    .join("\n");
}

export function slugFromHref(href) {
  const match = /^(?:file:)?(?:\.\/)?([^/]+)\.(?:org|md)$/.exec(href);
  return match ? match[1] : null;
}

function fileOf(slug) {
  return metaOf(slug).file || `${slug}.org`;
}

async function fetchNote(slug) {
  if (!noteCache.has(slug)) {
    const response = await fetch(`notes/${fileOf(slug)}`);
    if (!response.ok) throw new Error(`note not found: ${slug}`);
    noteCache.set(slug, await response.text());
  }
  return noteCache.get(slug);
}

const TIMELINE = "timeline";

function metaOf(slug) {
  if (slug === TIMELINE) return { title: "Timeline", date: "", tags: [], backlinks: [], file: "" };
  return index.notes[slug] || { title: slug, date: "", tags: [], backlinks: [] };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderBacklinks(slug, openFromPane, paneIndex) {
  const section = el("section", "backlinks");
  section.append(el("h2", "", "Links to this note"));
  const backlinks = metaOf(slug).backlinks;
  if (!backlinks.length) {
    section.append(el("p", "none", "Nothing links here yet."));
    return section;
  }
  backlinks.forEach((source) => {
    const link = el("a", "", metaOf(source).title || source);
    link.href = stackUrl([source]);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openFromPane(paneIndex, source);
    });
    section.append(link);
  });
  return section;
}

function adoptContentLinks(content, openFromPane, paneIndex) {
  content.querySelectorAll("img[src^='file:']").forEach((img) => {
    img.src = img.getAttribute("src").replace(/^file:/, "");
  });
  content.querySelectorAll("a[href]").forEach((anchor) => {
    const slug = slugFromHref(anchor.getAttribute("href"));
    if (slug) {
      anchor.className = "note-link";
      anchor.href = stackUrl([slug]);
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        openFromPane(paneIndex, slug);
      });
    } else {
      anchor.target = "_blank";
      anchor.rel = "noopener";
    }
  });
}

function closeButton(paneIndex, closeFromPane, closable) {
  const button = el("button", "pane-close", "×");
  button.setAttribute("aria-label", "close pane");
  button.disabled = !closable;
  button.addEventListener("click", () => closeFromPane(paneIndex));
  return button;
}

function tagLink(tag, openTag) {
  const link = el("a", "tag-link", tag);
  link.href = stackUrl(slugsForTag(index, tag));
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openTag(tag);
  });
  return link;
}

function tagList(tags, openTag) {
  const span = el("span", "tags");
  tags.forEach((tag, i) => {
    if (i) span.append(" ");
    span.append(tagLink(tag, openTag));
  });
  return span;
}

function renderModeline(slug, paneIndex, closeFromPane, closable, openTag) {
  const meta = metaOf(slug);
  const footer = el("footer", "pane-footer");
  footer.innerHTML = `<span class="slug">${slug}</span> ${meta.date} `;
  if (meta.tags.length) footer.append("(", tagList(meta.tags, openTag), ")");
  footer.append(closeButton(paneIndex, closeFromPane, closable));
  return footer;
}

function renderPane(slug, paneIndex, noteText, openFromPane, closeFromPane, closable, openTag) {
  const pane = el("article", "pane");
  pane.style.left = `${paneIndex * SPINE_STEP}px`;
  pane.style.zIndex = paneIndex;

  const spine = el("div", "pane-spine", metaOf(slug).title || slug);
  spine.tabIndex = 0;
  spine.addEventListener("click", () => pane.scrollIntoView({ inline: "start" }));

  const body = el("div", "pane-body");
  body.append(el("h1", "note-title", metaOf(slug).title || slug));
  const dateLine = el("p", "note-date", metaOf(slug).date);
  if (metaOf(slug).tags.length) dateLine.append(" · ", tagList(metaOf(slug).tags, openTag));
  if (metaOf(slug).date || metaOf(slug).tags.length) body.append(dateLine);

  const content = el("div", "note-content");
  content.innerHTML = noteToHtml(fileOf(slug), noteText);
  adoptContentLinks(content, openFromPane, paneIndex);
  body.append(content, renderBacklinks(slug, openFromPane, paneIndex));

  pane.append(spine, body, renderModeline(slug, paneIndex, closeFromPane, closable, openTag));
  return pane;
}

function renderTimelinePane(paneIndex, openFromPane, closeFromPane, closable, openTag) {
  const pane = el("article", "pane");
  pane.style.left = `${paneIndex * SPINE_STEP}px`;
  pane.style.zIndex = paneIndex;

  const spine = el("div", "pane-spine", "Timeline");
  spine.tabIndex = 0;
  spine.addEventListener("click", () => pane.scrollIntoView({ inline: "start" }));

  const body = el("div", "pane-body");
  body.append(el("h1", "note-title", "Timeline"));
  const content = el("div", "note-content timeline");
  let year = "";
  timelineEntries(index).forEach((entry) => {
    if (entry.year !== year) {
      year = entry.year;
      content.append(el("h2", "timeline-year", year));
    }
    const row = el("p", "timeline-entry");
    const link = el("a", "note-link", entry.title);
    link.href = stackUrl([entry.slug]);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openFromPane(paneIndex, entry.slug);
    });
    row.append(el("span", "timeline-date", entry.date), link);
    const tags = metaOf(entry.slug).tags;
    if (tags.length) row.append(" ", tagList(tags, openTag));
    content.append(row);
  });
  body.append(content);
  pane.append(spine, body, renderModeline(TIMELINE, paneIndex, closeFromPane, closable, openTag));
  return pane;
}

function degreeOf(slug) {
  const note = index.notes[slug] || {};
  return (note.links || []).length + (note.backlinks || []).length;
}

function timeArrowDot(entry, stack, openFromPane, maxDegree) {
  const dot = el("button", "arrow-dot", "");
  dot.style.left = `${entry.x * 100}%`;
  const size = dotScale(degreeOf(entry.slug), maxDegree);
  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;
  dot.dataset.slug = entry.slug;
  dot.dataset.lane = entry.lane;
  dot.dataset.label = `${entry.date} · ${entry.title}`;
  dot.setAttribute("aria-label", `${entry.title} (${entry.date})`);
  if (stack.includes(entry.slug)) dot.classList.add("in-stack");
  dot.addEventListener("click", () => openFromPane(stack.length - 1, entry.slug));
  return dot;
}

const ARC_VIEW_WIDTH = 1000;
const ARC_BASELINE = 72;

function arcPath(pair) {
  const x1 = pair.fromX * ARC_VIEW_WIDTH;
  const x2 = pair.toX * ARC_VIEW_WIDTH;
  const peak = ARC_BASELINE - 2 * arcHeight(pair.toX - pair.fromX);
  return `M ${x1} ${ARC_BASELINE} Q ${(x1 + x2) / 2} ${peak} ${x2} ${ARC_BASELINE}`;
}

function renderArcs(bar, layout) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "arrow-arcs");
  svg.setAttribute("viewBox", `0 0 ${ARC_VIEW_WIDTH} 96`);
  svg.setAttribute("preserveAspectRatio", "none");
  arcPairs(index, layout).forEach((pair) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", arcPath(pair));
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.dataset.from = pair.from;
    path.dataset.to = pair.to;
    svg.append(path);
  });
  bar.append(svg);
  return svg;
}

function highlightArcs(svg, slug) {
  svg.querySelectorAll("path").forEach((path) => {
    const touches = slug && (path.dataset.from === slug || path.dataset.to === slug);
    path.classList.toggle("lit", Boolean(touches));
    path.classList.toggle("dim", Boolean(slug) && !touches);
  });
}

function renderTimeArrow(stack, openFromPane) {
  const bar = document.getElementById("timearrow");
  bar.replaceChildren();
  if (narrowScreen.matches) return;
  const entries = timelineEntries(index);
  if (entries.length < 2) return;
  const layout = timeArrowLayout(entries, 0.018);
  const svg = renderArcs(bar, layout);
  yearTicks(entries).forEach((tick) => {
    const label = el("span", "arrow-year", tick.year);
    label.style.left = `${tick.x * 100}%`;
    bar.append(label);
  });
  const maxDegree = Math.max(...entries.map((entry) => degreeOf(entry.slug)));
  layout.forEach((entry) => bar.append(timeArrowDot(entry, stack, openFromPane, maxDegree)));
  bar.addEventListener("mouseover", (event) => {
    const dot = event.target.closest(".arrow-dot");
    if (dot) highlightArcs(svg, dot.dataset.slug);
  });
  bar.addEventListener("mouseout", (event) => {
    if (event.target.closest(".arrow-dot")) highlightArcs(svg, null);
  });
}

function renderErrorPane(slug, paneIndex) {
  const pane = el("article", "pane");
  pane.style.left = `${paneIndex * SPINE_STEP}px`;
  pane.append(el("div", "pane-error", `Couldn't load "${slug}".`));
  return pane;
}

const narrowScreen =
  typeof window === "undefined"
    ? { matches: false, addEventListener() {} }
    : window.matchMedia("(max-width: 700px)");

function renderTrail(stack, openTrail) {
  const nav = document.getElementById("trail");
  nav.replaceChildren();
  trailOf(stack, narrowScreen.matches).forEach((slug, depth) => {
    const chip = el("button", "trail-chip", metaOf(slug).title || slug);
    chip.addEventListener("click", () => openTrail(stack.slice(0, depth + 1)));
    nav.append(chip);
  });
}

function revealLastPane(panes) {
  if (narrowScreen.matches) window.scrollTo(0, 0);
  else panes[panes.length - 1].scrollIntoView({ inline: "end" });
}

async function renderStack(stack, openFromPane, openTrail, closeFromPane, openTag) {
  renderTrail(stack, openTrail);
  const container = document.getElementById("panes");
  container.replaceChildren();
  const panes = await Promise.all(
    visiblePanes(stack, narrowScreen.matches).map(async ([slug, paneIndex]) => {
      const closable = stack.length > 1;
      if (slug === TIMELINE) return renderTimelinePane(paneIndex, openFromPane, closeFromPane, closable, openTag);
      try {
        return renderPane(slug, paneIndex, await fetchNote(slug), openFromPane, closeFromPane, closable, openTag);
      } catch {
        return renderErrorPane(slug, paneIndex);
      }
    })
  );
  container.append(...panes);
  renderTimeArrow(stack, openFromPane);
  document.title = `${metaOf(stack[stack.length - 1]).title} — @vlnn`;
  revealLastPane(panes);
}

function toast(message) {
  const note = el("div", "toast", message);
  document.body.append(note);
  setTimeout(() => note.remove(), 1800);
}

function copyTrail() {
  const org = trailAsOrg(parseStack(location.search), index.notes);
  if (!org) return;
  navigator.clipboard
    .writeText(org)
    .then(() => toast("trail copied as org links"))
    .catch(() => toast("clipboard unavailable"));
}

function start() {
  const rerender = () => renderStack(parseStack(location.search), openFromPane, openTrail, closeFromPane, openTag);
  const navigate = (stack) => {
    history.pushState(null, "", stackUrl(stack));
    renderStack(stack, openFromPane, openTrail, closeFromPane, openTag);
  };
  const openFromPane = (paneIndex, slug) =>
    navigate(stackAfter(parseStack(location.search), paneIndex, slug));
  const openTag = (tag) => {
    const tagged = slugsForTag(index, tag);
    if (tagged.length) navigate(tagged);
  };
  const closeFromPane = (paneIndex) => {
    const stack = parseStack(location.search);
    const closed = closePane(stack, paneIndex);
    if (closed !== stack) navigate(closed);
  };
  const openTrail = navigate;
  document.querySelectorAll("a[href^='?stack']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(parseStack(new URL(anchor.href).search));
    });
  });
  window.addEventListener("popstate", rerender);
  narrowScreen.addEventListener("change", rerender);
  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "y") copyTrail();
    if (event.key === "q") closeFromPane(parseStack(location.search).length - 1);
  });
  rerender();
}

if (typeof document !== "undefined" && document.getElementById("panes")) {
  fetch("index.json")
    .then((response) => response.json())
    .then((data) => {
      index = data;
      start();
    });
}
