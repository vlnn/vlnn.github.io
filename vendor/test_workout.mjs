import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const PAGE = new URL("../workout/index.html", import.meta.url);
const html = readFileSync(PAGE, "utf8").replace(/<link[^>]*>/g, "");

function load(storage = {}) {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://vlnn.dev/workout/",
    beforeParse(window) {
      Object.entries(storage).forEach(([k, v]) => window.localStorage.setItem(k, v));
    }
  });
  return dom.window;
}

const pageEval = (w, expr) => JSON.parse(w.eval(`JSON.stringify(${expr})`));
const pageRun = (w, statement) => { w.eval(statement); };
const QUAD_MOVES = ["wallsit", "stepup", "sitstand"];

function openSession(w, key) {
  w.document.querySelector(`#picker button[data-session="${key}"]`).click();
}

function rowFor(w, key) {
  return w.document.querySelector(`#content li[data-move="${key}"]`);
}

function schemeText(w, key) {
  return rowFor(w, key).querySelector(".scheme").textContent.trim();
}

test("every move has one step per level", () => {
  const w = load();
  const counts = pageEval(w, "Object.entries(MOVES).map(([k, m]) => [k, m.steps.length])");
  const max = pageEval(w, "MAX_LEVEL");
  counts.forEach(([key, n]) =>
    assert.equal(n, max, `${key} should define exactly ${max} steps`));
});

test("every session only references defined moves", () => {
  const w = load();
  const missing = pageEval(w,
    "Object.values(SESSIONS).flatMap(s => s.moves || []).filter(k => !MOVES[k])");
  assert.deepEqual(missing, [], "sessions should only reference moves defined in MOVES");
});

for (const key of ["A", "B", "C"]) {
  test(`session ${key} trains quads`, () => {
    const w = load();
    const moves = pageEval(w, `SESSIONS.${key}.moves`);
    assert.ok(moves.some(m => QUAD_MOVES.includes(m)),
      `session ${key} should include one of ${QUAD_MOVES.join(", ")}`);
  });
}

test("the week includes power work", () => {
  const w = load();
  const all = pageEval(w, "Object.values(SESSIONS).flatMap(s => s.moves || [])");
  assert.ok(all.includes("swing"), "some session should include kettlebell swings");
});

for (const [dial, offset, expected] of [
  [1, 0, 1], [5, 0, 5], [5, -2, 3], [5, 2, 7], [1, -3, 1], [9, 4, 10]
]) {
  test(`effective level for dial ${dial} and offset ${offset} is ${expected}`, () => {
    const w = load();
    assert.equal(pageEval(w, `effectiveLevel(${dial}, ${offset})`), expected,
      "effective level should be dial plus offset, clamped to 1..MAX_LEVEL");
  });
}

test("lowering one move changes only that move", () => {
  const w = load({ "kb-level": "4" });
  openSession(w, "A");
  const before = { swing: schemeText(w, "swing"), row: schemeText(w, "row") };
  rowFor(w, "swing").querySelector('button[data-adjust="-1"]').click();
  assert.notEqual(schemeText(w, "swing"), before.swing, "swing should drop a step after pressing minus");
  assert.equal(schemeText(w, "row"), before.row, "other moves should keep their step");
});

test("move offsets survive a reload", () => {
  const w = load({ "kb-level": "4" });
  openSession(w, "A");
  rowFor(w, "wallsit").querySelector('button[data-adjust="-1"]').click();
  const stored = w.localStorage.getItem("kb-offsets");
  const reloaded = load({ "kb-level": "4", "kb-offsets": stored });
  assert.equal(pageEval(reloaded, "offsetFor('wallsit')"), -1,
    "a saved offset should be restored from localStorage");
});

test("moving the dial keeps per-move offsets", () => {
  const w = load({ "kb-level": "5", "kb-offsets": JSON.stringify({ stepup: -2 }) });
  pageRun(w, "setLevel(7)");
  assert.equal(pageEval(w, "levelFor('stepup')"), 5, "stepup should stay two levels below the dial");
});

test("an adjusted move shows its offset", () => {
  const w = load({ "kb-level": "5", "kb-offsets": JSON.stringify({ stepup: -2 }) });
  openSession(w, "B");
  assert.match(rowFor(w, "stepup").textContent, /−2/, "an adjusted move should display its offset");
});

test("corrupt offsets in storage are ignored", () => {
  const w = load({ "kb-offsets": "not json" });
  assert.equal(pageEval(w, "offsetFor('row')"), 0, "unreadable storage should fall back to no offsets");
});

test("rest day lists periodic check-ins", () => {
  const w = load();
  pageRun(w, "setDay(0)");
  const text = w.document.getElementById("content").textContent.toLowerCase();
  for (const check of ["dead hang", "single-leg stand", "chair stand"]) {
    assert.ok(text.includes(check), `rest card should mention the ${check} check-in`);
  }
});

test("warm-up trains balance", () => {
  const w = load();
  const text = w.document.getElementById("warmup-box").textContent.toLowerCase();
  assert.ok(text.includes("single-leg"), "warm-up should include single-leg balance");
});

test("rules ask for fast lifting", () => {
  const w = load();
  const text = w.document.querySelector(".rules").textContent.toLowerCase();
  assert.ok(text.includes("up fast"), "rules should cue moving the weight up fast");
});
