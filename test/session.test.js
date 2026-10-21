import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, nextRound, nextStreak } from '../src/app/session.js';
import { recommend } from '../src/engine/advisor.js';

test('nextRound wraps stage 1 after 1-4 and later stages after x-7', () => {
  assert.equal(nextRound('1-1'), '1-2');
  assert.equal(nextRound('1-4'), '2-1');
  assert.equal(nextRound('3-6'), '3-7');
  assert.equal(nextRound('3-7'), '4-1');
});

test('nextStreak extends or flips streaks', () => {
  assert.equal(nextStreak(0, 'win'), 1);
  assert.equal(nextStreak(3, 'win'), 4);
  assert.equal(nextStreak(3, 'loss'), -1);
  assert.equal(nextStreak(-2, 'loss'), -3);
  assert.equal(nextStreak(-2, null), -2);
});

test('advance applies bought and passive XP, income and streak', () => {
  const state = { round: '4-1', level: 7, xp: 20, gold: 60, hp: 60, streak: 2, strategy: 'standard' };
  const rec = recommend(state);
  const next = advance(state, rec, 'win');
  assert.equal(next.round, '4-2');
  assert.equal(next.streak, 3);
  // Bought 8 XP above 50g, plus 2 passive.
  assert.equal(next.level, 7);
  assert.equal(next.xp, 30);
  // 52 left + 5 base + 5 interest + 1 for a 3-win streak.
  assert.equal(next.gold, 63);
});

test('advance adds no income during stage 1', () => {
  const state = { round: '1-3', level: 2, xp: 0, gold: 4, hp: 100, streak: 0 };
  const next = advance(state, recommend(state));
  assert.equal(next.round, '1-4');
  assert.equal(next.gold, 4);
});
