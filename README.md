# TFT Advisor

A personal-use live decision advisor for Teamfight Tactics, meant to run as an overlay and give real-time play advice (level, roll, or save).

## Live tracker

A local web page for a second screen. Type your round, level, XP, gold, HP and
streak, and it shows whether to level, roll or save this round. Press **W**, **L**
or **N** (won, lost, skip) to move to the next round; it prefills next round's
level, XP, gold and streak assuming you followed the advice, so usually you only
fix gold and HP.

```
npm start   # http://localhost:5173 (set PORT to change)
```

It never reads or touches the game client. Note that Riot's TFT policy doesn't
allow in-game advice based on your current game state, so this is for personal
use at your own risk.

## Engine core

Game
constants plus a rule-based engine that recommends whether to level, roll, or
save each round. No dependencies; needs Node 20+.

```js
import { recommend } from './src/index.js';

recommend({ round: '4-2', level: 7, xp: 20, gold: 60, hp: 60 });
// { action: 'level_and_roll', levelTo: 8, xpGold: 28, rollGold: 22, rolls: 11,
//   goldAfter: 10, mode: 'healthy', incomeNextRound: 6, reasons: [...] }
```

### Layout

- `src/engine/constants.js`: shop odds, XP table, pool sizes, gold/interest/streak rules, leveling curve. Patch-dependent values all live here; pass a custom `rules` object to override.
- `src/engine/economy.js`: interest, streak gold, income, gold-to-level, XP rollover.
- `src/engine/odds.js`: per-slot and per-shop hit chance for a specific champion, expected gold to hit N copies.
- `src/engine/rounds.js`: parse and compare round labels like `3-2`.
- `src/engine/advisor.js`: `recommend(state)`.

### Decision rules

- **Strategies**: `standard` (8 on 4-2 and roll down), `fast8` (8 on 4-1 and roll down), `reroll` (cap at level 5/6/7 for 1/2/3-cost carries, slow roll above 50g; set `carryDone: true` to go back to the standard curve).
- **Curve**: level to the curve's level for the round if you can afford it, otherwise save.
- **Excess**: gold above 50 goes into XP (stage 3+, below level 9) or rerolls once there's nothing to level toward.
- **HP pressure** (stage 3+): 40 HP or less rolls to ~10g; 20 HP or less rolls everything.

### Tests

```
npm test
```
