// Grade calculator ported from Moadaly (https://github.com/madjsmail/moadaly).
// Canevas JSON files come straight from Moadaly's canevas/json-pure folder.
//
// LMD rules, as Moadaly applies them:
//   module avg   = Σ note × weight          (weights: [exam, td, tp] in %)
//   unit avg     = module avgs weighted by module coef
//   semester avg = unit avgs weighted by unit coef
//   year avg     = semester avgs weighted by semester coef
//   a module's credits are earned when it, its unit, its semester or the
//   year reaches 10 (compensation); otherwise it goes to rattrapage.

import { CONFIG } from '../config.js';
import {
  lockBodyScroll,
  trackEvent,
  unlockBodyScroll,
} from '../utils/helpers.js';
import { triggerCelebration } from './celebration.js';

const canevasFiles = import.meta.glob('../data/moadaly/*.json', {
  import: 'default',
});
const STORAGE_KEY = CONFIG.moadaly.storageKey;
const LEVEL_KEY = `${STORAGE_KEY}_level`;
const PARTS = [
  ['td', 'TD', 1],
  ['tp', 'TP', 2],
  ['ex', 'Exam', 0],
];

let canevas = null;
let currentId = '';
let wasPassing = false;

const fmt = (n) => n.toFixed(2);
const sum = (list, f) => list.reduce((a, x) => a + f(x), 0);
const weighted = (list) => {
  const coef = sum(list, (x) => x.coef);
  return coef ? sum(list, (x) => x.moy * x.coef) / coef : 0;
};
const semesters = () => [canevas.semestre1, canevas.semestre2];
const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked: the calculator still works, it just forgets.
  }
}

// ── Rendering ──────────────────────────────────────────────────────────────
function moduleRow(m, key) {
  const inputs = PARTS.filter(([, , i]) => m.poids[i] > 0)
    .map(
      ([part, label, i]) => `
        <label class="moadaly-field">
          <span>${label} <b>${m.poids[i]}%</b></span>
          <input type="text" inputmode="decimal" autocomplete="off"
            class="input input-sm" placeholder="0" maxlength="5" data-k="${key}-${part}"
            aria-label="${escapeHtml(m.title)} ${label}" />
        </label>`,
    )
    .join('');
  return `
    <div class="moadaly-module">
      <div class="min-w-0">
        <p class="font-semibold leading-snug">${escapeHtml(m.title.trim())}</p>
        <p class="text-xs text-base-content/55 mt-0.5">
          Coef ${m.coef} · ${m.credit} credits
          <span class="pill pill-warning hidden ml-1" data-retake="${key}">Rattrapage</span>
        </p>
      </div>
      <div class="moadaly-inputs">${inputs}</div>
      <div class="moadaly-score">
        <span class="moadaly-avg" data-avg="${key}">0.00</span>
        <span class="text-xs text-base-content/55"><span data-cr="${key}">0</span>/${m.credit} cr</span>
      </div>
    </div>`;
}

function render() {
  const body = document.getElementById('moadalyContent');
  body.innerHTML = semesters()
    .map(
      (s, si) => `
      <section class="mb-8">
        <h3 class="subhead subhead-row mb-3">
          <i class="fas fa-layer-group text-primary"></i>Semester ${escapeHtml(s.name)}
          <span class="pill pill-lg ml-auto" data-avg="${si}">0.00</span>
        </h3>
        ${s.unites
          .map(
            (u, ui) => `
          <div class="surface moadaly-unit">
            <div class="moadaly-unit-head">
              <span class="font-bold truncate">${escapeHtml(u.title)}</span>
              <span class="text-xs text-base-content/55 hidden sm:inline">${escapeHtml(u.name)}</span>
              <span class="ml-auto flex items-center gap-1.5">
                <span class="pill" data-avg="${si}-${ui}">0.00</span>
                <span class="pill pill-neutral"><span data-cr="${si}-${ui}">0</span>&nbsp;cr</span>
              </span>
            </div>
            ${u.modules.map((m, mi) => moduleRow(m, `${si}-${ui}-${mi}`)).join('')}
          </div>`,
          )
          .join('')}
      </section>`,
    )
    .join('');

  document.getElementById('moadalyS1Label').textContent =
    canevas.semestre1.name;
  document.getElementById('moadalyS2Label').textContent =
    canevas.semestre2.name;
  const sub = document.getElementById('moadalySubtitle');
  sub.textContent = [
    canevas.fullname,
    canevas.startdate && `since ${canevas.startdate}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const saved = readStore()[currentId] || {};
  body.querySelectorAll('input[data-k]').forEach((input) => {
    input.value = saved[input.dataset.k] ?? '';
  });
  wasPassing = compute() >= 10;
}

// ── Calculation ────────────────────────────────────────────────────────────
function readNote(input) {
  const raw = input.value.trim().replace(',', '.');
  const n = Number(raw);
  const valid = raw === '' || (Number.isFinite(n) && n >= 0 && n <= 20);
  input.classList.toggle('input-error', !valid);
  return valid && raw !== '' ? n : 0;
}

function setText(attr, key, value) {
  const el = document.querySelector(`#moadalyModal [${attr}="${key}"]`);
  if (el) el.textContent = value;
}

function compute() {
  const notes = {};
  const touched = new Set();
  document.querySelectorAll('#moadalyContent input[data-k]').forEach((i) => {
    notes[i.dataset.k] = readNote(i);
    if (i.value.trim()) touched.add(i.dataset.k.replace(/-\w+$/, ''));
  });

  const sems = semesters().map((s, si) => {
    const units = s.unites.map((u, ui) => {
      const mods = u.modules.map((m, mi) => ({
        key: `${si}-${ui}-${mi}`,
        coef: m.coef,
        credit: m.credit,
        moy: sum(PARTS, ([p, , i]) => {
          return ((notes[`${si}-${ui}-${mi}-${p}`] || 0) * m.poids[i]) / 100;
        }),
      }));
      return {
        key: `${si}-${ui}`,
        mods,
        coef: sum(mods, (m) => m.coef),
        moy: weighted(mods),
      };
    });
    return {
      key: `${si}`,
      units,
      coef: sum(units, (u) => u.coef),
      moy: weighted(units),
    };
  });
  const year = weighted(sems);

  let yearCredits = 0;
  let yearCreditsMax = 0;
  for (const s of sems) {
    let semCredits = 0;
    let semCreditsMax = 0;
    for (const u of s.units) {
      let unitCredits = 0;
      for (const m of u.mods) {
        const earned = [year, s.moy, u.moy, m.moy].some((v) => v >= 10);
        const cr = earned ? m.credit : 0;
        unitCredits += cr;
        semCreditsMax += m.credit;
        setText('data-avg', m.key, fmt(m.moy));
        setText('data-cr', m.key, cr);
        document
          .querySelector(`#moadalyModal [data-retake="${m.key}"]`)
          ?.classList.toggle('hidden', earned || !touched.has(m.key));
      }
      semCredits += unitCredits;
      setText('data-avg', u.key, fmt(u.moy));
      setText('data-cr', u.key, unitCredits);
    }
    setText('data-avg', s.key, fmt(s.moy));
    setText('data-sem-avg', s.key, fmt(s.moy));
    setText('data-sem-cr', s.key, `${semCredits}/${semCreditsMax}`);
    yearCredits += semCredits;
    yearCreditsMax += semCreditsMax;
  }

  setText('data-sem-avg', 'year', fmt(year));
  setText('data-sem-cr', 'year', `${yearCredits}/${yearCreditsMax}`);
  const status = document.getElementById('moadalyStatus');
  const passed = year >= 10;
  status.className = `pill pill-lg ${passed ? 'pill-success' : 'pill-neutral'}`;
  status.innerHTML = passed
    ? '<i class="fas fa-check"></i> Admis'
    : '<i class="fas fa-hourglass-half"></i> Not yet';
  return year;
}

// Keep marks within 0–20: drop anything but digits and a decimal separator
// (so no minus sign) and cap the value at 20.
function clampNote(input) {
  let value = input.value.replace(/[^\d.,]/g, '');
  if (Number(value.replace(',', '.')) > 20) value = '20';
  if (value !== input.value) input.value = value;
}

function onInput(e) {
  if (!e.target.matches('input[data-k]')) return;
  clampNote(e.target);
  const store = readStore();
  const grades = (store[currentId] ||= {});
  if (e.target.value.trim()) grades[e.target.dataset.k] = e.target.value.trim();
  else delete grades[e.target.dataset.k];
  writeStore(store);

  const passing = compute() >= 10;
  if (passing && !wasPassing) triggerCelebration();
  wasPassing = passing;
}

// ── Open / close ───────────────────────────────────────────────────────────
async function selectCanevas(id) {
  if (!canevasFiles[`../data/moadaly/${id}.json`]) return;
  currentId = id;
  saveLevel(id);
  document.getElementById('moadalyContent').innerHTML = `
    <div class="empty-state">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>`;
  const data = await canevasFiles[`../data/moadaly/${id}.json`]();
  if (id !== currentId) return; // a newer selection won the race
  canevas = data;
  render();
}

function saveLevel(id) {
  for (const sid of ['moadalyPicker', 'moadalySelect']) {
    const select = document.getElementById(sid);
    if (select) select.value = id;
  }
  try {
    localStorage.setItem(LEVEL_KEY, id);
  } catch {
    // Not critical: the picker just falls back to the first year next time.
  }
}

function savedLevel() {
  try {
    return localStorage.getItem(LEVEL_KEY);
  } catch {
    return null;
  }
}

export function openMoadaly(id) {
  id ||=
    document.getElementById('moadalyPicker')?.value || currentId || 'L1Info';
  trackEvent('moadaly_open', { level: id });
  document.getElementById('moadalyModal')?.showModal();
  lockBodyScroll();
  if (id !== currentId || !canevas) selectCanevas(id);
}

function resetGrades() {
  const store = readStore();
  delete store[currentId];
  writeStore(store);
  render();
}

export function initMoadaly() {
  const options = Object.entries(CONFIG.moadaly.groups)
    .map(
      ([group, items]) =>
        `<optgroup label="${group}">${Object.entries(items)
          .map(([id, label]) => `<option value="${id}">${label}</option>`)
          .join('')}</optgroup>`,
    )
    .join('');
  for (const id of ['moadalyPicker', 'moadalySelect']) {
    const select = document.getElementById(id);
    if (select) select.innerHTML = options;
  }
  const picker = document.getElementById('moadalyPicker');
  const level = savedLevel();
  if (picker && level && canevasFiles[`../data/moadaly/${level}.json`])
    picker.value = level;
  picker?.addEventListener('change', (e) => saveLevel(e.target.value));

  const dialog = document.getElementById('moadalyModal');
  if (!dialog) return;
  dialog.addEventListener('close', unlockBodyScroll);
  dialog.addEventListener(
    'click',
    (e) => e.target === dialog && dialog.close(),
  );
  document.getElementById('moadalyContent').addEventListener('input', onInput);
  document
    .getElementById('moadalySelect')
    .addEventListener('change', (e) => selectCanevas(e.target.value));
  document
    .getElementById('moadalyReset')
    .addEventListener('click', resetGrades);

  window.openMoadaly = openMoadaly;
  window.closeMoadaly = () => dialog.close();
}
