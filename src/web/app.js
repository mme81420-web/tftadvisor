import { recommend } from '../engine/advisor.js';
import { advance } from '../app/session.js';

const FIELDS = ['round', 'level', 'xp', 'gold', 'hp', 'streak'];
const NUMERIC = new Set(['level', 'xp', 'gold', 'hp', 'streak']);
const ACTION_LABELS = {
  save: 'Save',
  level: 'Level',
  roll: 'Roll',
  level_and_roll: 'Level + roll',
};
const STORAGE_KEY = 'tft-tracker-state';
const $ = (id) => document.getElementById(id);

let lastRec = null;

function readState() {
  const state = {};
  for (const f of FIELDS) state[f] = NUMERIC.has(f) ? Number($(f).value) : $(f).value.trim();
  state.strategy = $('strategy').value;
  if (state.strategy === 'reroll') {
    state.carryCost = Number($('carryCost').value);
    state.carryDone = $('carryDone').checked;
  }
  return state;
}

function writeState(state) {
  for (const f of FIELDS) if (state[f] !== undefined) $(f).value = state[f];
  if (state.strategy) $('strategy').value = state.strategy;
  if (state.carryCost) $('carryCost').value = state.carryCost;
  $('carryDone').checked = Boolean(state.carryDone);
  syncStrategyControls();
}

function syncStrategyControls() {
  const reroll = $('strategy').value === 'reroll';
  $('carryCost').hidden = !reroll;
  $('carryDoneLabel').hidden = !reroll;
}

function render() {
  const state = readState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  try {
    const rec = recommend(state);
    lastRec = rec;
    $('error').hidden = true;
    $('action').textContent = ACTION_LABELS[rec.action];
    $('action').dataset.action = rec.action;
    $('advice').dataset.mode = rec.mode;
    const parts = [];
    if (rec.xpGold > 0) parts.push(`<b>${rec.xpGold}g</b> XP → level ${rec.levelTo}`);
    if (rec.rollGold > 0) parts.push(`<b>${rec.rolls}</b> rolls (${rec.rollGold}g)`);
    parts.push(`keep <b>${rec.goldAfter}g</b>`);
    parts.push(`+${rec.incomeNextRound}g next round`);
    $('numbers').innerHTML = parts.join('<span class="sep">·</span>');
    $('reasons').replaceChildren(...rec.reasons.map((r) => Object.assign(document.createElement('li'), { textContent: r })));
  } catch (err) {
    lastRec = null;
    $('error').textContent = err.message;
    $('error').hidden = false;
  }
}

function next(result) {
  if (!lastRec) return;
  writeState(advance(readState(), lastRec, result || null));
  render();
  $('gold').focus();
  $('gold').select();
}

$('state').addEventListener('input', render);
$('state').addEventListener('submit', (e) => e.preventDefault());
for (const id of ['strategy', 'carryCost', 'carryDone']) {
  $(id).addEventListener('change', () => {
    syncStrategyControls();
    render();
  });
}
for (const btn of document.querySelectorAll('[data-result]')) {
  btn.addEventListener('click', () => next(btn.dataset.result));
}
$('newGame').addEventListener('click', () => {
  writeState({ round: '2-1', level: 3, xp: 0, gold: 10, hp: 100, streak: 0, carryDone: false });
  render();
});
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select') || e.ctrlKey || e.metaKey || e.altKey) return;
  const result = { w: 'win', l: 'loss', n: '' }[e.key.toLowerCase()];
  if (result === undefined) return;
  // Otherwise the key is typed into the gold field next() focuses.
  e.preventDefault();
  next(result);
});

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved) writeState(saved);
} catch {}
syncStrategyControls();
render();
