import { mdToHtml } from "./vendor/org.js";

const ENTRY = "about-these-notes";
const SPINE_STEP = 42;

const noteCache = new Map();
let index = { notes: {} };

const SLUG_SHAPE = /^[A-Za-z0-9_-]+$/;
const TEST_PREFIX = "test:";

function innerSlug(slug) {
  return slug.startsWith(TEST_PREFIX) ? slug.slice(TEST_PREFIX.length) : slug;
}

function validSlug(slug) {
  return SLUG_SHAPE.test(innerSlug(slug));
}

export function parseStack(search) {
  const params = new URLSearchParams(search);
  const compact = (params.get("stack") || "").split(",").filter(Boolean);
  const legacy = params.getAll("stackedNotes");
  const slugs = (compact.length ? compact : legacy).filter(validSlug);
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

export function appendPane(stack, slug) {
  return stack.includes(slug) ? stack : [...stack, slug];
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
const BLEND_STEP = 0.05;

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

function blendedX(times, min, span, blend) {
  const steps = Math.max(times.length - 1, 1);
  return (time, rank) =>
    (1 - blend) * linearX(time, min, span) +
    blend * (rank ?? fractionalRank(times, time)) / steps;
}

function assignLane(lastAt, x, minGap) {
  const free = lastAt.findIndex((last) => x - last >= minGap);
  return free >= 0 ? free : lastAt.indexOf(Math.min(...lastAt));
}

function layoutWithBlend(entries, minGap, blend) {
  const ordered = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.slug ?? a.id ?? "").localeCompare(b.slug ?? b.id ?? "")
  );
  if (ordered.length === 1) return [{ ...ordered[0], x: 0.5, lane: 0 }];
  const { min, span } = dateSpan(ordered);
  const scale = blendedX(ordered.map((entry) => Date.parse(entry.date)), min, span, blend);
  const lastAt = [-Infinity, -Infinity, -Infinity];
  return ordered.map((entry, rank) => {
    const x = scale(Date.parse(entry.date), rank);
    const lane = assignLane(lastAt, x, minGap);
    lastAt[lane] = x;
    return { ...entry, x, lane };
  });
}

export function minLaneGap(layout) {
  const lastAt = new Map();
  let gap = Infinity;
  [...layout]
    .sort((a, b) => a.x - b.x)
    .forEach(({ x, lane }) => {
      if (lastAt.has(lane)) gap = Math.min(gap, x - lastAt.get(lane));
      lastAt.set(lane, x);
    });
  return gap;
}

function blendCandidates() {
  const candidates = [];
  for (let blend = RANK_BLEND; blend < 1; blend += BLEND_STEP) candidates.push(Math.round(blend * 100) / 100);
  return [...candidates, 1];
}

export function feasibleBlend(entries, minGap) {
  return (
    blendCandidates().find((blend) => minLaneGap(layoutWithBlend(entries, minGap, blend)) >= minGap) ?? 1
  );
}

export function timeArrowLayout(entries, minGap, blend = feasibleBlend(entries, minGap)) {
  return layoutWithBlend(entries, minGap, blend);
}

export function arcPairs(index, layout) {
  const dotOf = new Map(layout.map((entry) => [entry.slug, entry]));
  const seen = new Set();
  const pairs = [];
  layout.forEach(({ slug }) => {
    ((index.notes[slug] || {}).links || []).forEach((target) => {
      if (target === slug || !dotOf.has(target)) return;
      const [from, to] = dotOf.get(slug).x <= dotOf.get(target).x ? [slug, target] : [target, slug];
      const key = `${from}→${to}`;
      if (seen.has(key)) return;
      seen.add(key);
      pairs.push({
        from,
        to,
        fromX: dotOf.get(from).x,
        toX: dotOf.get(to).x,
        fromLane: dotOf.get(from).lane,
        toLane: dotOf.get(to).lane,
      });
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

export function fisheyeX(x, focus, distortion) {
  if (!distortion || x === focus) return x;
  const bound = x < focus ? 0 : 1;
  const t = (x - focus) / (bound - focus);
  const magnified = ((distortion + 1) * t) / (distortion * t + 1);
  return focus + magnified * (bound - focus);
}

export function yearTicks(entries, blend = RANK_BLEND) {
  const { min, span } = dateSpan(entries);
  if (!span) return [];
  const times = entries.map((entry) => Date.parse(entry.date)).sort((a, b) => a - b);
  const scale = blendedX(times, min, span, blend);
  const ticks = [];
  const firstYear = new Date(min).getUTCFullYear() + 1;
  for (let year = firstYear; ; year++) {
    const time = Date.parse(`${year}-01-01`);
    if (linearX(time, min, span) >= 1) break;
    if (time > min) ticks.push({ year: String(year), x: scale(time) });
  }
  return ticks;
}

const MONTH_LABELS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function monthTicks(entries, blend = RANK_BLEND) {
  const { min, span } = dateSpan(entries);
  if (!span) return [];
  const times = entries.map((entry) => Date.parse(entry.date)).sort((a, b) => a - b);
  const scale = blendedX(times, min, span, blend);
  const ticks = [];
  const start = new Date(min);
  for (let months = start.getUTCFullYear() * 12 + start.getUTCMonth() + 1; ; months++) {
    const time = Date.UTC(Math.floor(months / 12), months % 12, 1);
    if (linearX(time, min, span) >= 1) break;
    if (months % 12 !== 0 && time > min) ticks.push({ label: MONTH_LABELS[months % 12], x: scale(time) });
  }
  return ticks;
}

export function thinTicks(ticks, minGap) {
  const kept = [];
  ticks.forEach((tick) => {
    if (kept.every((other) => Math.abs(other.x - tick.x) >= minGap - 1e-9)) kept.push(tick);
  });
  return kept;
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

export function tokenize(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function haystackOf(note) {
  return {
    title: note.title.toLowerCase(),
    tags: (note.tags || []).join(" ").toLowerCase(),
    body: note.body.toLowerCase(),
  };
}

function tokenScore(token, haystack) {
  if (haystack.title.includes(token)) return 10;
  if (haystack.tags.includes(token)) return 5;
  if (haystack.body.includes(token)) return 1;
  return 0;
}

function noteScore(tokens, note) {
  const haystack = haystackOf(note);
  const scores = tokens.map((token) => tokenScore(token, haystack));
  return scores.every(Boolean) ? scores.reduce((sum, score) => sum + score, 0) : 0;
}

export function searchNotes(query, corpus) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  return corpus
    .map((note) => ({ ...note, score: noteScore(tokens, note) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export function snippetFor(body, tokens, radius) {
  const lower = body.toLowerCase();
  const [at, length] =
    tokens.map((token) => [lower.indexOf(token), token.length]).find(([i]) => i >= 0) || [0, radius];
  const start = Math.max(at - radius, 0);
  const end = Math.min(at + length + radius, body.length);
  return `${start > 0 ? "…" : ""}${body.slice(start, end)}${end < body.length ? "…" : ""}`;
}

export function tagCounts(index) {
  const counts = new Map();
  Object.values(index.notes).forEach((note) =>
    (note.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  );
  return [...counts.entries()].sort(([tagA, a], [tagB, b]) => b - a || tagA.localeCompare(tagB));
}

const TAG_FONT_MIN = 13;
const TAG_FONT_MAX = 30;

export function tagScale(count, maxCount) {
  if (!maxCount) return TAG_FONT_MIN;
  return Math.round(TAG_FONT_MIN + (TAG_FONT_MAX - TAG_FONT_MIN) * Math.sqrt(count / maxCount));
}

const SYNTHETIC = new Set(["timeline", "tags", "test"]);

export function testSlugOf(slug) {
  return slug.startsWith(TEST_PREFIX) ? slug.slice(TEST_PREFIX.length) : null;
}

function isSynthetic(slug) {
  return SYNTHETIC.has(slug) || testSlugOf(slug) !== null;
}

function promptsWithSource(notes, slug) {
  return ((notes[slug] || {}).prompts || []).map((prompt) => ({ ...prompt, slug }));
}

export function quizPrompts(index, stack) {
  const open = [...new Set(stack.filter((slug) => !isSynthetic(slug)))];
  const fromOpen = open.flatMap((slug) => promptsWithSource(index.notes, slug));
  if (fromOpen.length) return fromOpen;
  return Object.keys(index.notes).flatMap((slug) => promptsWithSource(index.notes, slug));
}

export function quizStart() {
  return { position: 0, revealed: false, recalled: 0 };
}

export function quizReveal(state) {
  return { ...state, revealed: true };
}

export function quizGrade(state, recalled) {
  return { position: state.position + 1, revealed: false, recalled: state.recalled + (recalled ? 1 : 0) };
}

export function quizDone(state, total) {
  return state.position >= total;
}

export function trailAsMd(stack, notes) {
  return stack
    .filter((slug) => !SYNTHETIC.has(slug) && notes[slug])
    .map((slug) => `- [${notes[slug].title}](${notes[slug].file})`)
    .join("\n");
}

export function slugFromHref(href) {
  const match = /^(?:file:)?(?:\.\/)?([^/]+)\.md$/.exec(href);
  return match ? match[1] : null;
}

function fileOf(slug) {
  return metaOf(slug).file || `${slug}.md`;
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
const TAGS = "tags";
const TEST = "test";
const SYNTHETIC_TITLES = { [TIMELINE]: "Timeline", [TAGS]: "Tags", [TEST]: "Test" };

export function paneKey(slug, paneIndex, closable) {
  if (slug === TEST) return null;
  return `${paneIndex}:${closable ? "closable" : "solo"}:${slug}`;
}

function metaOf(slug) {
  const synthetic = SYNTHETIC_TITLES[slug];
  if (synthetic) return { title: synthetic, date: "", tags: [], backlinks: [], file: "" };
  const testFor = testSlugOf(slug);
  if (testFor) return { title: `Test: ${metaOf(testFor).title}`, date: "", tags: [], backlinks: [], file: "" };
  return index.notes[slug] || { title: slug, date: "", tags: [], backlinks: [] };
}

function promptsOf(slug) {
  return (index.notes[slug] || {}).prompts || [];
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderTestLink(slug, openFromPane, paneIndex) {
  const count = promptsOf(slug).length;
  if (!count) return "";
  const section = el("section", "test-link");
  const link = el("a", "note-link", "test yourself");
  link.href = stackUrl([slug, TEST_PREFIX + slug]);
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openFromPane(paneIndex, TEST_PREFIX + slug);
  });
  section.append(`${count} prompt${count === 1 ? "" : "s"} — `, link);
  return section;
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
  footer.append(el("span", "slug", slug), ` ${meta.date} `);
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
  content.innerHTML = mdToHtml(noteText);
  content.querySelectorAll(".block-test").forEach((block) => block.remove());
  content.querySelectorAll("code.language-test").forEach((code) => (code.closest("pre") || code).remove());
  adoptContentLinks(content, openFromPane, paneIndex);
  body.append(content, renderTestLink(slug, openFromPane, paneIndex), renderBacklinks(slug, openFromPane, paneIndex));

  pane.append(spine, body, renderModeline(slug, paneIndex, closeFromPane, closable, openTag));
  return pane;
}

function syntheticPaneShell(title, paneIndex) {
  const pane = el("article", "pane");
  pane.style.left = `${paneIndex * SPINE_STEP}px`;
  pane.style.zIndex = paneIndex;
  const spine = el("div", "pane-spine", title);
  spine.tabIndex = 0;
  spine.addEventListener("click", () => pane.scrollIntoView({ inline: "start" }));
  const body = el("div", "pane-body");
  body.append(el("h1", "note-title", title));
  pane.append(spine, body);
  return { pane, body };
}

function renderTagsPane(paneIndex, closeFromPane, closable, openTag) {
  const { pane, body } = syntheticPaneShell("Tags", paneIndex);
  const content = el("div", "note-content tag-cloud");
  const counts = tagCounts(index);
  const maxCount = counts.length ? counts[0][1] : 0;
  counts.forEach(([tag, count]) => {
    const link = tagLink(tag, openTag);
    link.style.fontSize = `${tagScale(count, maxCount)}px`;
    link.dataset.count = count;
    link.title = `${count} note${count === 1 ? "" : "s"}`;
    content.append(link, " ");
  });
  if (!counts.length) content.append(el("p", "none", "No tags yet."));
  body.append(content);
  pane.append(renderModeline(TAGS, paneIndex, closeFromPane, closable, openTag));
  return pane;
}

function renderTimelinePane(paneIndex, openFromPane, closeFromPane, closable, openTag) {
  const { pane, body } = syntheticPaneShell("Timeline", paneIndex);
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
  pane.append(renderModeline(TIMELINE, paneIndex, closeFromPane, closable, openTag));
  return pane;
}

function quizButton(label, onClick) {
  const button = el("button", "quiz-button", label);
  button.addEventListener("click", onClick);
  return button;
}

function noteLinkTo(slug, paneIndex, openFromPane) {
  const link = el("a", "note-link", metaOf(slug).title || slug);
  link.href = stackUrl([slug]);
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openFromPane(paneIndex, slug);
  });
  return link;
}

function renderedPromptText(className, prompt, field, openFromPane, paneIndex) {
  const box = el("div", className);
  box.innerHTML = mdToHtml(prompt[field]);
  adoptContentLinks(box, openFromPane, paneIndex);
  return box;
}

function renderQuizStep(content, prompts, state, rerender, showSource, openFromPane, paneIndex) {
  content.replaceChildren();
  if (quizDone(state, prompts.length)) {
    content.append(el("p", "quiz-score", `recalled ${state.recalled}/${prompts.length}`));
    content.append(quizButton("start over", () => rerender(quizStart())));
    return;
  }
  const prompt = prompts[state.position];
  content.append(el("p", "quiz-progress", `${state.position + 1}/${prompts.length}`));
  content.append(renderedPromptText("quiz-question", prompt, "q", openFromPane, paneIndex));
  if (showSource) {
    const from = el("p", "quiz-from");
    from.append("from ", noteLinkTo(prompt.slug, paneIndex, openFromPane));
    content.append(from);
  }
  if (!state.revealed) {
    content.append(quizButton("show answer", () => rerender(quizReveal(state))));
    return;
  }
  content.append(renderedPromptText("quiz-answer", prompt, "a", openFromPane, paneIndex));
  const grades = el("div", "quiz-grades");
  grades.append(
    quizButton("recalled", () => rerender(quizGrade(state, true))),
    quizButton("forgot", () => rerender(quizGrade(state, false)))
  );
  content.append(grades);
}

function quizCaption(noteSlug, stack, paneIndex, openFromPane) {
  const caption = el("p", "quiz-source");
  if (noteSlug) {
    caption.append("prompts from ", noteLinkTo(noteSlug, paneIndex, openFromPane));
    return caption;
  }
  const openHavePrompts = stack.some((slug) => !isSynthetic(slug) && promptsOf(slug).length);
  caption.append(openHavePrompts ? "prompts from the open notes" : "prompts from across the garden");
  return caption;
}

function renderTestPane(slug, stack, paneIndex, openFromPane, closeFromPane, closable, openTag) {
  const noteSlug = testSlugOf(slug);
  const { pane, body } = syntheticPaneShell(metaOf(slug).title, paneIndex);
  const prompts = noteSlug ? promptsWithSource(index.notes, noteSlug) : quizPrompts(index, stack);
  const content = el("div", "note-content quiz");
  const rerender = (state) => renderQuizStep(content, prompts, state, rerender, !noteSlug, openFromPane, paneIndex);
  if (prompts.length) rerender(quizStart());
  else content.append(el("p", "none", "No prompts anywhere yet."));
  body.append(quizCaption(noteSlug, stack, paneIndex, openFromPane), content);
  pane.append(renderModeline(slug, paneIndex, closeFromPane, closable, openTag));
  return pane;
}

function degreeOf(slug) {
  const note = index.notes[slug] || {};
  return (note.links || []).length + (note.backlinks || []).length;
}

function timeArrowDot(entry, stack, openFromPane, maxDegree) {
  const dot = el("button", "arrow-dot", "");
  dot.style.left = trackPosition(entry.x);
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

const TRACK_PAD_LEFT = 6;
const TRACK_PAD_RIGHT = 26;

export function trackPosition(x) {
  return `calc(${TRACK_PAD_LEFT}px + ${x} * (100% - ${TRACK_PAD_LEFT + TRACK_PAD_RIGHT}px))`;
}

const ARC_VIEW_WIDTH = 1000;
const DOT_BASELINE = 72.5;
const LANE_STEP = 11;

export function arcEndY(lane) {
  return DOT_BASELINE - LANE_STEP * (lane || 0);
}

function arcPath(pair) {
  const x1 = pair.fromX * ARC_VIEW_WIDTH;
  const x2 = pair.toX * ARC_VIEW_WIDTH;
  const y1 = arcEndY(pair.fromLane);
  const y2 = arcEndY(pair.toLane);
  const peak = Math.min(y1, y2) - 2 * arcHeight(pair.toX - pair.fromX);
  return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${peak} ${x2} ${y2}`;
}

function renderArcs(bar, layout) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "arrow-arcs");
  svg.setAttribute("viewBox", `0 0 ${ARC_VIEW_WIDTH} 96`);
  svg.setAttribute("preserveAspectRatio", "none");
  const arcs = arcPairs(index, layout).map((pair) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", arcPath(pair));
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.dataset.from = pair.from;
    path.dataset.to = pair.to;
    svg.append(path);
    return { path, pair };
  });
  bar.append(svg);
  return { svg, arcs };
}

function highlightArcs(svg, slug) {
  svg.querySelectorAll("path").forEach((path) => {
    const touches = slug && (path.dataset.from === slug || path.dataset.to === slug);
    path.classList.toggle("lit", Boolean(touches));
    path.classList.toggle("dim", Boolean(slug) && !touches);
  });
}

const ARROW_MIN_GAP = 0.018;
const LENS_DISTORTION = 3;
const TICK_MIN_GAP = 0.02;

export function trackFraction(width, offset) {
  const along = (offset - TRACK_PAD_LEFT) / (width - TRACK_PAD_LEFT - TRACK_PAD_RIGHT);
  return Math.min(Math.max(along, 0), 1);
}

function lensX(x, focus) {
  return focus == null ? x : fisheyeX(x, focus, LENS_DISTORTION);
}

function refocusArrow(dots, ticks, arcs, focus) {
  dots.forEach(({ dot, x }) => (dot.style.left = trackPosition(lensX(x, focus))));
  ticks.forEach(({ label, x }) => (label.style.left = trackPosition(lensX(x, focus))));
  arcs.forEach(({ path, pair }) =>
    path.setAttribute(
      "d",
      arcPath({ ...pair, fromX: lensX(pair.fromX, focus), toX: lensX(pair.toX, focus) })
    )
  );
}

function wireLens(bar, dots, ticks, arcs) {
  let frame = null;
  const schedule = (focus) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => refocusArrow(dots, ticks, arcs, focus));
  };
  bar.addEventListener("mousemove", (event) => {
    const rect = bar.getBoundingClientRect();
    schedule(trackFraction(rect.width, event.clientX - rect.left));
  });
  bar.addEventListener("mouseleave", () => schedule(null));
}

function renderTimeArrow(stack, openFromPane) {
  const bar = document.getElementById("timearrow");
  bar.replaceChildren();
  if (narrowScreen.matches) return;
  const entries = timelineEntries(index);
  if (entries.length < 2) return;
  const blend = feasibleBlend(entries, ARROW_MIN_GAP);
  const layout = timeArrowLayout(entries, ARROW_MIN_GAP, blend);
  const { svg, arcs } = renderArcs(bar, layout);
  const marks = thinTicks(
    [
      ...yearTicks(entries, blend).map((tick) => ({ label: tick.year, x: tick.x, style: "arrow-year" })),
      ...monthTicks(entries, blend).map((tick) => ({ ...tick, style: "arrow-month" })),
    ],
    TICK_MIN_GAP
  );
  const ticks = marks.map((mark) => {
    const label = el("span", mark.style, mark.label);
    label.style.left = trackPosition(mark.x);
    bar.append(label);
    return { label, x: mark.x };
  });
  const maxDegree = Math.max(...entries.map((entry) => degreeOf(entry.slug)));
  const dots = layout.map((entry) => {
    const dot = timeArrowDot(entry, stack, openFromPane, maxDegree);
    bar.append(dot);
    return { dot, x: entry.x };
  });
  wireLens(bar, dots, ticks, arcs);
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

async function buildPane(slug, stack, paneIndex, openFromPane, closeFromPane, closable, openTag) {
  if (slug === TIMELINE) return renderTimelinePane(paneIndex, openFromPane, closeFromPane, closable, openTag);
  if (slug === TAGS) return renderTagsPane(paneIndex, closeFromPane, closable, openTag);
  if (slug === TEST || testSlugOf(slug)) return renderTestPane(slug, stack, paneIndex, openFromPane, closeFromPane, closable, openTag);
  try {
    return renderPane(slug, paneIndex, await fetchNote(slug), openFromPane, closeFromPane, closable, openTag);
  } catch {
    return renderErrorPane(slug, paneIndex);
  }
}

function existingPanesByKey(container) {
  return new Map([...container.children].map((pane) => [pane.dataset.paneKey, pane]));
}

async function reusedOrBuiltPane(existing, slug, stack, paneIndex, openFromPane, closeFromPane, closable, openTag) {
  const key = paneKey(slug, paneIndex, closable);
  const reused = key && existing.get(key);
  if (reused) return reused;
  const pane = await buildPane(slug, stack, paneIndex, openFromPane, closeFromPane, closable, openTag);
  if (key) pane.dataset.paneKey = key;
  return pane;
}

// insertBefore detaches a node and resets its scroll, so kept panes are left untouched
export function reconcilePanes(container, panes) {
  [...container.children].filter((child) => !panes.includes(child)).forEach((child) => child.remove());
  panes.forEach((pane, position) => {
    if (container.children[position] !== pane) container.insertBefore(pane, container.children[position] ?? null);
  });
}

async function renderStack(stack, openFromPane, openTrail, closeFromPane, openTag) {
  renderTrail(stack, openTrail);
  const container = document.getElementById("panes");
  const existing = existingPanesByKey(container);
  const closable = stack.length > 1;
  const panes = await Promise.all(
    visiblePanes(stack, narrowScreen.matches).map(([slug, paneIndex]) =>
      reusedOrBuiltPane(existing, slug, stack, paneIndex, openFromPane, closeFromPane, closable, openTag)
    )
  );
  reconcilePanes(container, panes);
  renderTimeArrow(stack, openFromPane);
  document.title = `${metaOf(stack[stack.length - 1]).title} — @vlnn`;
  revealLastPane(panes);
}

const SEARCH_LIMIT = 8;
const SNIPPET_RADIUS = 60;

let corpus = null;

async function loadCorpus() {
  if (!corpus) {
    corpus = await Promise.all(
      Object.keys(index.notes).map(async (slug) => ({
        slug,
        title: metaOf(slug).title,
        tags: metaOf(slug).tags,
        body: await fetchNote(slug).catch(() => ""),
      }))
    );
  }
  return corpus;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function searchHitRow(hit, tokens, openSlug) {
  const row = el("a", "search-hit");
  row.href = stackUrl([hit.slug]);
  row.append(el("span", "search-hit-title", hit.title));
  row.append(el("span", "search-hit-snippet", snippetFor(hit.body, tokens, SNIPPET_RADIUS)));
  row.addEventListener("click", (event) => {
    event.preventDefault();
    openSlug(hit.slug);
  });
  return row;
}

function renderSearchHits(box, hits, tokens, openSlug) {
  box.replaceChildren();
  box.hidden = !hits.length;
  hits.slice(0, SEARCH_LIMIT).forEach((hit) => box.append(searchHitRow(hit, tokens, openSlug)));
}

function moveActiveHit(box, delta) {
  const rows = [...box.children];
  if (!rows.length) return;
  const current = rows.findIndex((row) => row.classList.contains("active"));
  const next = (current + delta + rows.length) % rows.length;
  rows.forEach((row, i) => row.classList.toggle("active", i === next));
}

function searchKeydown(input, box) {
  return (event) => {
    if (event.key === "Escape") {
      box.hidden = true;
      input.blur();
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveHit(box, event.key === "ArrowDown" ? 1 : -1);
    }
    if (event.key === "Enter") {
      const active = box.querySelector(".active") || box.firstElementChild;
      if (active) active.click();
    }
    event.stopPropagation();
  };
}

function wireSearch(openAtEnd) {
  const input = document.getElementById("search");
  const box = document.getElementById("search-results");
  const openSlug = (slug) => {
    input.value = "";
    box.hidden = true;
    input.blur();
    openAtEnd(slug);
  };
  const rerunSearch = async () => {
    const hits = searchNotes(input.value, await loadCorpus());
    renderSearchHits(box, hits, tokenize(input.value), openSlug);
  };
  input.addEventListener("focus", () => loadCorpus());
  input.addEventListener("input", debounce(rerunSearch, 120));
  input.addEventListener("keydown", searchKeydown(input, box));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-search")) box.hidden = true;
  });
  return input;
}

function toast(message) {
  const note = el("div", "toast", message);
  document.body.append(note);
  setTimeout(() => note.remove(), 1800);
}

function copyTrail() {
  const md = trailAsMd(parseStack(location.search), index.notes);
  if (!md) return;
  navigator.clipboard
    .writeText(md)
    .then(() => toast("trail copied as md links"))
    .catch(() => toast("clipboard unavailable"));
}

export function siteTitleText(commit) {
  return commit ? `vlnn.dev/${commit}` : "vlnn.dev / notes";
}

function start() {
  document.querySelector(".site-title").textContent = siteTitleText(index.commit);
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
      if (anchor.dataset.append) return navigate(appendPane(parseStack(location.search), anchor.dataset.append));
      navigate(parseStack(new URL(anchor.href).search));
    });
  });
  const openAtEnd = (slug) => openFromPane(parseStack(location.search).length - 1, slug);
  const searchInput = wireSearch(openAtEnd);
  window.addEventListener("popstate", rerender);
  narrowScreen.addEventListener("change", rerender);
  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("input, textarea")) return;
    if (event.key === "/") {
      event.preventDefault();
      searchInput.focus();
    }
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
