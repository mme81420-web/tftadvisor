import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHOP_ODDS, XP_TO_LEVEL, MAX_LEVEL, STANDARD_LEVEL_CURVE } from '../src/index.js';

test('shop odds sum to 100 at every level', () => {
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const total = SHOP_ODDS[level].reduce((a, b) => a + b, 0);
    assert.equal(total, 100, `level ${level}`);
  }
});

test('5-costs only appear from level 7', () => {
  for (let level = 1; level <= 6; level++) assert.equal(SHOP_ODDS[level][4], 0);
  assert.ok(SHOP_ODDS[7][4] > 0);
});

test('XP table covers every level-up', () => {
  for (let level = 1; level < MAX_LEVEL; level++) assert.ok(XP_TO_LEVEL[level] > 0);
  assert.equal(XP_TO_LEVEL[MAX_LEVEL], undefined);
});

test('standard curve levels are increasing', () => {
  for (let i = 1; i < STANDARD_LEVEL_CURVE.length; i++) {
    assert.ok(STANDARD_LEVEL_CURVE[i].level > STANDARD_LEVEL_CURVE[i - 1].level);
  }
});
