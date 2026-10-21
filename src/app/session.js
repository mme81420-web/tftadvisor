// Round-to-round bookkeeping for the live tracker: advance the round label and
// prefill next round's state from this round's recommendation and result.

import { DEFAULT_RULES } from '../engine/constants.js';
import { addXp, projectedIncome } from '../engine/economy.js';
import { parseRound } from '../engine/rounds.js';

// Stage 1 has four rounds; every later stage has seven.
export function roundsInStage(stage) {
  return stage === 1 ? 4 : 7;
}

export function nextRound(label) {
  const { stage, round } = parseRound(label);
  if (round < roundsInStage(stage)) return `${stage}-${round + 1}`;
  return `${stage + 1}-1`;
}

export function nextStreak(streak, result) {
  if (result === 'win') return streak > 0 ? streak + 1 : 1;
  if (result === 'loss') return streak < 0 ? streak - 1 : -1;
  return streak;
}

/**
 * Best guess at next round's state, assuming the player followed `rec`.
 * The player corrects anything that differs (HP, PvP gold, augments, orbs).
 *
 * result: 'win' | 'loss' | null
 */
export function advance(state, rec, result = null, rules = DEFAULT_RULES) {
  const round = nextRound(state.round);
  const streak = nextStreak(state.streak ?? 0, result);
  const bought = rec.xpGold / rules.xpPurchaseCost * rules.xpPerPurchase;
  const { level, xp } = addXp(state.level, state.xp, bought + rules.passiveXpPerRound, rules);
  // Stage 1 gold comes from minion drops, not income.
  const income = parseRound(round).stage >= 2 ? projectedIncome(rec.goldAfter, streak, rules) : 0;
  return { ...state, round, level, xp, streak, gold: rec.goldAfter + income };
}
