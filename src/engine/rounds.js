// Helpers for TFT round labels like '3-2' (stage 3, round 2).

export function parseRound(label) {
  if (typeof label === 'object' && label !== null) return { stage: label.stage, round: label.round };
  const match = /^(\d+)-(\d+)$/.exec(String(label).trim());
  if (!match) throw new Error(`Invalid round label: ${label}`);
  return { stage: Number(match[1]), round: Number(match[2]) };
}

// Orderable index for a round; stages have up to 7 rounds.
export function roundIndex(label) {
  const { stage, round } = parseRound(label);
  return stage * 10 + round;
}

export function compareRounds(a, b) {
  return roundIndex(a) - roundIndex(b);
}

export function isAtOrAfter(current, target) {
  return compareRounds(current, target) >= 0;
}
