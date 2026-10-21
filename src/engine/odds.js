// Shop probability math for hitting specific champions.

import { DEFAULT_RULES } from './constants.js';

// Chance a single shop slot shows one specific champion.
//
// `copiesOut` is how many copies of that champion are already taken from the
// pool (yours plus opponents'). `otherOut` is how many other champions of the
// same cost are taken, which shrinks the pool and slightly raises your odds.
export function slotHitChance({ level, cost, copiesOut = 0, otherOut = 0 }, rules = DEFAULT_RULES) {
  const costOdds = rules.shopOdds[level][cost - 1] / 100;
  if (costOdds === 0) return 0;
  const perChamp = rules.poolCopies[cost];
  const remaining = Math.max(0, perChamp - copiesOut);
  const tierTotal = perChamp * rules.championsPerCost[cost] - copiesOut - otherOut;
  if (remaining === 0 || tierTotal <= 0) return 0;
  return costOdds * (remaining / tierTotal);
}

// Chance a full shop shows at least one copy of the champion.
export function shopHitChance(params, rules = DEFAULT_RULES) {
  const p = slotHitChance(params, rules);
  return 1 - (1 - p) ** rules.shopSlots;
}

// Expected copies seen per shop.
export function expectedCopiesPerShop(params, rules = DEFAULT_RULES) {
  return slotHitChance(params, rules) * rules.shopSlots;
}

// Rough expected gold to find `copiesNeeded` more copies by rolling at this
// level. Treats each copy found as costing (shops to find one) * reroll cost
// plus the unit's own cost, and accounts for the pool shrinking as you buy.
export function expectedGoldToHit({ level, cost, copiesNeeded, copiesOut = 0, otherOut = 0 }, rules = DEFAULT_RULES) {
  let gold = 0;
  for (let i = 0; i < copiesNeeded; i++) {
    const perShop = expectedCopiesPerShop({ level, cost, copiesOut: copiesOut + i, otherOut }, rules);
    if (perShop === 0) return Infinity;
    gold += rules.rerollCost / perShop + cost;
  }
  return Math.round(gold);
}

// Level whose shop odds give the best per-slot chance for a cost tier.
export function bestLevelForCost(cost, rules = DEFAULT_RULES) {
  let best = 1;
  for (const level of Object.keys(rules.shopOdds).map(Number)) {
    if (rules.shopOdds[level][cost - 1] > rules.shopOdds[best][cost - 1]) best = level;
  }
  return best;
}
