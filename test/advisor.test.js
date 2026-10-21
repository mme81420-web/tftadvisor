import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { recommend, curveLevelAt, STANDARD_LEVEL_CURVE } from '../src/index.js';

describe('curveLevelAt', () => {
  test('returns the expected level for each round', () => {
    assert.equal(curveLevelAt('1-3', STANDARD_LEVEL_CURVE), 1);
    assert.equal(curveLevelAt('2-1', STANDARD_LEVEL_CURVE), 4);
    assert.equal(curveLevelAt('3-1', STANDARD_LEVEL_CURVE), 5);
    assert.equal(curveLevelAt('4-2', STANDARD_LEVEL_CURVE), 8);
    assert.equal(curveLevelAt('6-1', STANDARD_LEVEL_CURVE), 9);
  });
});

describe('standard strategy', () => {
  test('saves for interest when already on curve', () => {
    const r = recommend({ round: '3-3', level: 6, xp: 4, gold: 34, hp: 80 });
    assert.equal(r.action, 'save');
    assert.equal(r.goldAfter, 34);
    assert.equal(r.incomeNextRound, 5 + 3);
  });

  test('levels on curve when affordable', () => {
    const r = recommend({ round: '3-2', level: 5, xp: 10, gold: 40, hp: 70 });
    assert.equal(r.action, 'level');
    assert.equal(r.levelTo, 6);
    assert.equal(r.xpGold, 12); // needs 10 XP -> 3 buys
    assert.equal(r.goldAfter, 28);
  });

  test('saves when the curve level is not affordable', () => {
    const r = recommend({ round: '4-2', level: 7, xp: 0, gold: 30, hp: 70 });
    assert.equal(r.action, 'save');
    assert.equal(r.levelTo, 7);
    assert.match(r.reasons.join(' '), /need 48g/);
  });

  test('levels to 8 and rolls down on 4-2', () => {
    const r = recommend({ round: '4-2', level: 7, xp: 20, gold: 60, hp: 60 });
    assert.equal(r.action, 'level_and_roll');
    assert.equal(r.levelTo, 8);
    assert.equal(r.xpGold, 28);
    assert.equal(r.rollGold, 22);
    assert.equal(r.goldAfter, 10);
    assert.equal(r.rolls, 11);
  });

  test('does not roll down on 4-1 under standard', () => {
    const r = recommend({ round: '4-1', level: 7, xp: 0, gold: 50, hp: 70 });
    assert.equal(r.rollGold, 0);
  });

  test('puts gold above 50 into XP', () => {
    const r = recommend({ round: '3-6', level: 7, xp: 0, gold: 62, hp: 75 });
    assert.equal(r.action, 'level');
    assert.equal(r.xpGold, 12);
    assert.equal(r.goldAfter, 50);
  });

  test('rolls excess above 50 once capped at 9', () => {
    const r = recommend({ round: '5-3', level: 9, xp: 10, gold: 71, hp: 55 });
    assert.equal(r.action, 'roll');
    assert.equal(r.rollGold, 20);
    assert.equal(r.goldAfter, 51);
  });

  test('stage 2 HP is never treated as low', () => {
    const r = recommend({ round: '2-6', level: 5, xp: 0, gold: 30, hp: 35 });
    assert.equal(r.mode, 'healthy');
    assert.equal(r.rollGold, 0);
  });
});

describe('HP pressure', () => {
  test('low HP rolls down to ~10 to stabilize', () => {
    const r = recommend({ round: '3-5', level: 7, xp: 0, gold: 40, hp: 35 });
    assert.equal(r.mode, 'stabilize');
    assert.equal(r.action, 'roll');
    assert.equal(r.goldAfter, 10);
  });

  test('critical HP rolls everything', () => {
    const r = recommend({ round: '4-5', level: 8, xp: 0, gold: 33, hp: 14 });
    assert.equal(r.mode, 'all_in');
    assert.equal(r.rollGold, 32);
    assert.equal(r.goldAfter, 1);
  });

  test('critical HP still takes an affordable curve level first', () => {
    const r = recommend({ round: '4-2', level: 7, xp: 40, gold: 30, hp: 18 });
    assert.equal(r.action, 'level_and_roll');
    assert.equal(r.levelTo, 8);
    assert.equal(r.xpGold, 8);
    assert.equal(r.goldAfter, 0);
  });
});

describe('fast 8', () => {
  test('goes to 8 and rolls on 4-1', () => {
    const r = recommend({ round: '4-1', level: 7, xp: 0, gold: 70, hp: 60, strategy: 'fast8' });
    assert.equal(r.levelTo, 8);
    assert.equal(r.xpGold, 48);
    assert.equal(r.action, 'level_and_roll');
    assert.equal(r.goldAfter, 10);
  });
});

describe('reroll strategy', () => {
  test('stays at level 6 for 2-cost reroll instead of following curve to 7', () => {
    const r = recommend({ round: '3-5', level: 6, xp: 0, gold: 64, hp: 70, strategy: 'reroll', carryCost: 2 });
    assert.equal(r.levelTo, 6);
    assert.equal(r.action, 'roll');
    assert.equal(r.rollGold, 14);
    assert.equal(r.goldAfter, 50);
  });

  test('does not slow roll before the start round', () => {
    const r = recommend({ round: '2-5', level: 5, xp: 0, gold: 56, hp: 90, strategy: 'reroll', carryCost: 1 });
    assert.equal(r.rollGold, 0);
  });

  test('saves under 50 while slow rolling', () => {
    const r = recommend({ round: '3-3', level: 5, xp: 0, gold: 44, hp: 70, strategy: 'reroll', carryCost: 1 });
    assert.equal(r.action, 'save');
  });

  test('switches to the standard curve once carries are done', () => {
    const r = recommend({ round: '4-2', level: 6, xp: 0, gold: 90, hp: 60, strategy: 'reroll', carryCost: 2, carryDone: true });
    assert.equal(r.levelTo, 8);
  });

  test('requires a carry cost', () => {
    assert.throws(() => recommend({ round: '3-2', strategy: 'reroll' }), /carryCost/);
  });
});

test('rejects unknown strategies and missing round', () => {
  assert.throws(() => recommend({ round: '3-2', strategy: 'yolo' }), /Unknown strategy/);
  assert.throws(() => recommend({ gold: 10 }), /round/);
});
