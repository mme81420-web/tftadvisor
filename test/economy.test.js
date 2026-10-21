import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interest, streakBonus, projectedIncome, goldToReachLevel, addXp, interestFloor } from '../src/index.js';

test('interest is 1 per 10 gold, capped at 5', () => {
  assert.equal(interest(0), 0);
  assert.equal(interest(9), 0);
  assert.equal(interest(10), 1);
  assert.equal(interest(39), 3);
  assert.equal(interest(50), 5);
  assert.equal(interest(87), 5);
  assert.equal(interest(-3), 0);
});

test('interest floor is the breakpoint at or below gold', () => {
  assert.equal(interestFloor(37), 30);
  assert.equal(interestFloor(72), 50);
});

test('streak bonus applies to wins and losses', () => {
  assert.equal(streakBonus(0), 0);
  assert.equal(streakBonus(1), 0);
  assert.equal(streakBonus(2), 1);
  assert.equal(streakBonus(-3), 1);
  assert.equal(streakBonus(4), 2);
  assert.equal(streakBonus(-6), 3);
});

test('projected income = base + interest + streak', () => {
  assert.equal(projectedIncome(50, 5), 5 + 5 + 3);
  assert.equal(projectedIncome(23, -2), 5 + 2 + 1);
});

test('gold to reach a level accounts for current XP', () => {
  assert.equal(goldToReachLevel(7, 0, 8), 48); // 48 XP = 12 buys
  assert.equal(goldToReachLevel(7, 46, 8), 4); // needs 2 XP, still one buy
  assert.equal(goldToReachLevel(5, 0, 7), 56); // 20 + 36
  assert.equal(goldToReachLevel(8, 0, 8), 0);
  assert.throws(() => goldToReachLevel(9, 0, 11));
});

test('addXp rolls over across multiple levels', () => {
  assert.deepEqual(addXp(3, 0, 6), { level: 4, xp: 0 });
  assert.deepEqual(addXp(4, 8, 24), { level: 6, xp: 2 });
  assert.deepEqual(addXp(9, 80, 20), { level: 10, xp: 0 });
});
