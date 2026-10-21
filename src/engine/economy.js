// Gold, interest and XP math.

import { DEFAULT_RULES, MAX_LEVEL } from './constants.js';

export function interest(gold, rules = DEFAULT_RULES) {
  if (gold <= 0) return 0;
  return Math.min(Math.floor(gold / rules.interestStep), rules.maxInterest);
}

export function streakBonus(streak, rules = DEFAULT_RULES) {
  const length = Math.abs(streak);
  const tier = rules.streakBonus.find((t) => length >= t.min);
  return tier ? tier.gold : 0;
}

// Gold earned at the start of next round, ignoring PvP win gold and augments.
export function projectedIncome(gold, streak = 0, rules = DEFAULT_RULES) {
  return rules.baseIncome + interest(gold, rules) + streakBonus(streak, rules);
}

// Gold you can spend without dropping below the next-lower interest breakpoint.
// Spending to `targetFloor` (e.g. 50) keeps max interest.
export function spendableAbove(gold, targetFloor) {
  return Math.max(0, gold - targetFloor);
}

// Highest interest breakpoint at or below current gold (0, 10, ..., 50).
export function interestFloor(gold, rules = DEFAULT_RULES) {
  return interest(gold, rules) * rules.interestStep;
}

// Gold needed to buy XP from (level, xp) up to targetLevel.
export function goldToReachLevel(level, xp, targetLevel, rules = DEFAULT_RULES) {
  if (targetLevel <= level) return 0;
  if (targetLevel > MAX_LEVEL) throw new Error(`Level ${targetLevel} exceeds max ${MAX_LEVEL}`);
  let needed = -xp;
  for (let l = level; l < targetLevel; l++) needed += rules.xpToLevel[l];
  if (needed <= 0) return 0;
  return Math.ceil(needed / rules.xpPerPurchase) * rules.xpPurchaseCost;
}

// Applies `xpGained` to (level, xp) and returns the resulting state.
export function addXp(level, xp, xpGained, rules = DEFAULT_RULES) {
  let l = level;
  let x = xp + xpGained;
  while (l < MAX_LEVEL && x >= rules.xpToLevel[l]) {
    x -= rules.xpToLevel[l];
    l++;
  }
  if (l === MAX_LEVEL) x = 0;
  return { level: l, xp: x };
}
