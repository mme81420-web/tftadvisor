// Core Teamfight Tactics game constants.
//
// Values track the live game as of the 2025-2026 sets. Riot tunes shop odds
// and pool sizes most patches, so everything patch-dependent lives here and
// can be overridden by passing a custom `rules` object to the engine.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

// Percent chance that each shop slot rolls a unit of cost 1..5, by player level.
export const SHOP_ODDS = Object.freeze({
  1: [100, 0, 0, 0, 0],
  2: [100, 0, 0, 0, 0],
  3: [75, 25, 0, 0, 0],
  4: [55, 30, 15, 0, 0],
  5: [45, 33, 20, 2, 0],
  6: [30, 40, 25, 5, 0],
  7: [19, 30, 40, 10, 1],
  8: [18, 25, 32, 22, 3],
  9: [10, 20, 25, 35, 10],
  10: [5, 10, 20, 40, 25],
});

// XP needed to go from level N to level N+1.
export const XP_TO_LEVEL = Object.freeze({
  1: 2,
  2: 2,
  3: 6,
  4: 10,
  5: 20,
  6: 36,
  7: 48,
  8: 76,
  9: 84,
});

// Copies of each individual champion in the shared pool, by cost.
export const POOL_COPIES = Object.freeze({ 1: 30, 2: 25, 3: 18, 4: 10, 5: 9 });

// Distinct champions at each cost tier.
export const CHAMPIONS_PER_COST = Object.freeze({ 1: 13, 2: 13, 3: 13, 4: 12, 5: 8 });

export const SHOP_SLOTS = 5;
export const REROLL_COST = 2;
export const XP_PURCHASE_COST = 4;
export const XP_PER_PURCHASE = 4;
export const PASSIVE_XP_PER_ROUND = 2;

export const BASE_INCOME = 5;
export const INTEREST_STEP = 10; // 1 gold per 10 banked
export const MAX_INTEREST = 5;
export const MAX_INTEREST_GOLD = INTEREST_STEP * MAX_INTEREST; // 50

// Bonus gold for a win or loss streak of the given length (length >= key).
export const STREAK_BONUS = Object.freeze([
  { min: 5, gold: 3 },
  { min: 4, gold: 2 },
  { min: 2, gold: 1 },
]);

export const STARTING_HP = 100;

// The "standard" leveling curve most players follow, keyed by the round at
// which you reach that level. Rounds are written as stage-round, e.g. '4-2'.
export const STANDARD_LEVEL_CURVE = Object.freeze([
  { round: '2-1', level: 4 },
  { round: '2-5', level: 5 },
  { round: '3-2', level: 6 },
  { round: '3-5', level: 7 },
  { round: '4-2', level: 8 },
  { round: '5-1', level: 9 },
]);

// Level at which a reroll comp slow-rolls for its carry, by carry cost.
// Rolling at the level where that cost's shop odds peak, relative to pressure
// from higher-cost units, is the usual rule of thumb.
export const REROLL_LEVEL_BY_COST = Object.freeze({ 1: 5, 2: 6, 3: 7 });

// Default rules bundle consumed by the engine.
export const DEFAULT_RULES = Object.freeze({
  shopOdds: SHOP_ODDS,
  xpToLevel: XP_TO_LEVEL,
  poolCopies: POOL_COPIES,
  championsPerCost: CHAMPIONS_PER_COST,
  shopSlots: SHOP_SLOTS,
  rerollCost: REROLL_COST,
  xpPurchaseCost: XP_PURCHASE_COST,
  xpPerPurchase: XP_PER_PURCHASE,
  passiveXpPerRound: PASSIVE_XP_PER_ROUND,
  baseIncome: BASE_INCOME,
  interestStep: INTEREST_STEP,
  maxInterest: MAX_INTEREST,
  streakBonus: STREAK_BONUS,
  levelCurve: STANDARD_LEVEL_CURVE,
  rerollLevelByCost: REROLL_LEVEL_BY_COST,
});
