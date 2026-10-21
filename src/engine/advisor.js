// Decision engine: given the player's current state, recommend whether to
// level, roll, or save this round, and how much gold to put into each.

import { DEFAULT_RULES, MAX_LEVEL, STARTING_HP } from './constants.js';
import { addXp, goldToReachLevel, interest, projectedIncome } from './economy.js';
import { compareRounds, isAtOrAfter, parseRound } from './rounds.js';

export const STRATEGIES = Object.freeze(['standard', 'fast8', 'reroll']);

// Fast 8 skips the 3-5 roll and goes straight to 8 on 4-1.
const FAST8_CURVE = Object.freeze([
  { round: '2-1', level: 4 },
  { round: '2-5', level: 5 },
  { round: '3-2', level: 6 },
  { round: '3-5', level: 7 },
  { round: '4-1', level: 8 },
  { round: '5-1', level: 9 },
]);

// Round each strategy makes its main roll-down.
const ROLLDOWN_ROUND = Object.freeze({ standard: '4-2', fast8: '4-1' });

// Round a reroll comp starts slow rolling, by carry cost.
const REROLL_START_ROUND = Object.freeze({ 1: '3-1', 2: '3-2', 3: '3-5' });

export const HP_ALL_IN = 20;
export const HP_STABILIZE = 40;
const STABILIZE_FLOOR = 10;
const ROLLDOWN_FLOOR = 10;

function normalize(state) {
  const s = {
    level: 1,
    xp: 0,
    gold: 0,
    hp: STARTING_HP,
    streak: 0,
    strategy: 'standard',
    carryCost: null,
    carryDone: false,
    ...state,
  };
  if (s.round === undefined) throw new Error('state.round is required, e.g. "3-2"');
  if (!STRATEGIES.includes(s.strategy)) throw new Error(`Unknown strategy: ${s.strategy}`);
  if (s.strategy === 'reroll' && ![1, 2, 3].includes(s.carryCost)) {
    throw new Error('reroll strategy needs carryCost of 1, 2 or 3');
  }
  s.stage = parseRound(s.round).stage;
  return s;
}

// Highest level the curve expects you to be at by this round.
export function curveLevelAt(round, curve) {
  let level = 1;
  for (const step of curve) if (isAtOrAfter(round, step.round)) level = Math.max(level, step.level);
  return level;
}

function hpMode(s) {
  if (s.stage <= 2) return 'healthy';
  if (s.hp <= HP_ALL_IN) return 'all_in';
  if (s.hp <= HP_STABILIZE) return 'stabilize';
  return 'healthy';
}

// Rounds gold down to what can actually be spent on rerolls.
function rollable(gold, rules) {
  return Math.max(0, Math.floor(gold / rules.rerollCost) * rules.rerollCost);
}

// Rounds gold down to what can actually be spent on XP.
function xpBuyable(gold, rules) {
  return Math.max(0, Math.floor(gold / rules.xpPurchaseCost) * rules.xpPurchaseCost);
}

function planLevel(s, targetLevel, rules, reasons, why) {
  if (targetLevel <= s.level) return { levelTo: s.level, xpGold: 0 };
  const cost = goldToReachLevel(s.level, s.xp, targetLevel, rules);
  if (cost <= s.gold) {
    reasons.push(`Level to ${targetLevel} (${cost}g): ${why}.`);
    return { levelTo: targetLevel, xpGold: cost };
  }
  reasons.push(`Want level ${targetLevel} (${why}) but need ${cost}g; save until you can afford it.`);
  return { levelTo: s.level, xpGold: 0 };
}

function planCurve(s, curve, rules, reasons) {
  const target = curveLevelAt(s.round, curve);
  const plan = planLevel(s, target, rules, reasons, `on curve for ${s.round}`);
  let rollFloor = null;

  const rolldownRound = ROLLDOWN_ROUND[s.strategy] ?? ROLLDOWN_ROUND.standard;
  if (compareRounds(s.round, rolldownRound) === 0 && plan.levelTo >= 8) {
    rollFloor = ROLLDOWN_FLOOR;
    reasons.push(`Roll down to ~${ROLLDOWN_FLOOR}g on ${rolldownRound} at level ${plan.levelTo} to find your 4-cost board.`);
  }
  return { ...plan, rollFloor };
}

function planReroll(s, rules, reasons) {
  const rerollLevel = rules.rerollLevelByCost[s.carryCost];
  const startRound = REROLL_START_ROUND[s.carryCost];
  // Follow the normal curve but cap at the reroll level until the carry is found.
  const target = Math.min(curveLevelAt(s.round, rules.levelCurve), rerollLevel);
  const plan = planLevel(s, target, rules, reasons, `heading to level ${rerollLevel} to reroll ${s.carryCost}-costs`);
  let rollFloor = null;

  if (plan.levelTo >= rerollLevel && isAtOrAfter(s.round, startRound)) {
    rollFloor = rules.interestStep * rules.maxInterest;
    reasons.push(`Slow roll above ${rollFloor}g at level ${plan.levelTo} for your ${s.carryCost}-cost 3-stars.`);
  }
  return { ...plan, rollFloor };
}

/**
 * Recommend this round's action.
 *
 * state: {
 *   round: '3-2',             required
 *   level, xp, gold, hp,      current values
 *   streak,                   +N for an N-win streak, -N for an N-loss streak
 *   strategy,                 'standard' | 'fast8' | 'reroll'
 *   carryCost,                1-3, required for 'reroll'
 *   carryDone,                true once reroll carries are 3-starred
 * }
 *
 * Returns { action, mode, levelTo, xpGold, rollGold, rolls, goldAfter,
 *           incomeNextRound, reasons }.
 */
export function recommend(state, rules = DEFAULT_RULES) {
  const s = normalize(state);
  const reasons = [];
  const mode = hpMode(s);

  const useReroll = s.strategy === 'reroll' && !s.carryDone;
  if (s.strategy === 'reroll' && s.carryDone) {
    reasons.push('Reroll carries are done; switching to the standard curve.');
  }
  let { levelTo, xpGold, rollFloor } = useReroll
    ? planReroll(s, rules, reasons)
    : planCurve(s, s.strategy === 'fast8' ? FAST8_CURVE : rules.levelCurve, rules, reasons);

  // HP pressure overrides econ.
  if (mode === 'all_in') {
    rollFloor = 0;
    reasons.push(`HP ${s.hp} is critical: roll everything to stabilize this round.`);
  } else if (mode === 'stabilize' && (rollFloor === null || rollFloor > STABILIZE_FLOOR)) {
    rollFloor = STABILIZE_FLOOR;
    reasons.push(`HP ${s.hp} is low: roll down to ~${STABILIZE_FLOOR}g to strengthen your board.`);
  }

  // Excess gold above max interest gets spent rather than banked.
  const maxInterestGold = rules.interestStep * rules.maxInterest;
  if (rollFloor === null && s.gold - xpGold > maxInterestGold) {
    const excess = s.gold - xpGold - maxInterestGold;
    const pushLevel = !useReroll && levelTo < Math.min(9, MAX_LEVEL) && s.stage >= 3;
    if (pushLevel && xpBuyable(excess, rules) > 0) {
      const extra = xpBuyable(excess, rules);
      xpGold += extra;
      levelTo = addXp(s.level, s.xp, (xpGold / rules.xpPurchaseCost) * rules.xpPerPurchase, rules).level;
      reasons.push(`Above ${maxInterestGold}g: put the extra ${extra}g into XP.`);
    } else if (!pushLevel && s.stage >= 3) {
      rollFloor = maxInterestGold;
      reasons.push(`Above ${maxInterestGold}g with nothing to level toward: roll the excess.`);
    }
  }

  const rollGold = rollFloor === null ? 0 : rollable(s.gold - xpGold - rollFloor, rules);
  const goldAfter = s.gold - xpGold - rollGold;

  if (xpGold === 0 && rollGold === 0) {
    const kept = interest(goldAfter, rules);
    reasons.push(`Save: hold ${goldAfter}g for ${kept} interest.`);
  }

  let action = 'save';
  if (xpGold > 0 && rollGold > 0) action = 'level_and_roll';
  else if (xpGold > 0) action = 'level';
  else if (rollGold > 0) action = 'roll';

  return {
    action,
    mode,
    levelTo,
    xpGold,
    rollGold,
    rolls: rollGold / rules.rerollCost,
    goldAfter,
    incomeNextRound: projectedIncome(goldAfter, s.streak, rules),
    reasons,
  };
}
