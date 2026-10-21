import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slotHitChance, shopHitChance, expectedGoldToHit, bestLevelForCost } from '../src/index.js';

test('cannot see units the level does not roll', () => {
  assert.equal(slotHitChance({ level: 4, cost: 4 }), 0);
  assert.equal(expectedGoldToHit({ level: 4, cost: 4, copiesNeeded: 1 }), Infinity);
});

test('slot chance matches odds / pool share on a fresh pool', () => {
  // Level 8, 4-cost: 22% * (10 / 120)
  assert.ok(Math.abs(slotHitChance({ level: 8, cost: 4 }) - 0.22 / 12) < 1e-9);
});

test('copies taken from the pool lower your odds', () => {
  const fresh = shopHitChance({ level: 8, cost: 4 });
  const contested = shopHitChance({ level: 8, cost: 4, copiesOut: 6 });
  assert.ok(contested < fresh);
  assert.equal(slotHitChance({ level: 8, cost: 4, copiesOut: 10 }), 0);
});

test('other units out of the pool raise your odds slightly', () => {
  const base = slotHitChance({ level: 7, cost: 3 });
  const thinned = slotHitChance({ level: 7, cost: 3, otherOut: 40 });
  assert.ok(thinned > base);
});

test('hitting a 4-cost is cheaper at 8 than at 7', () => {
  const at7 = expectedGoldToHit({ level: 7, cost: 4, copiesNeeded: 3 });
  const at8 = expectedGoldToHit({ level: 8, cost: 4, copiesNeeded: 3 });
  assert.ok(at8 < at7);
});

test('best level for each cost tier', () => {
  assert.equal(bestLevelForCost(1), 1);
  assert.equal(bestLevelForCost(3), 7);
  assert.equal(bestLevelForCost(5), 10);
});
