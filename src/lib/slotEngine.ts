/**
 * Pure slot game engine: grid generation, payline definitions, and
 * spin evaluation. No React, no side effects — safe to unit test.
 *
 * Layout: 5 reels × 3 rows. grid[row][col], where row 0 = top, row 2 = bottom.
 *
 * Payline evaluation follows the common casino rule: matches must start
 * from the LEFT reel (index 0) and run consecutively. A streak of 3+
 * pays according to the per-symbol payout table.
 *
 * Target RTP (return to player): ~92%. This means over many spins, a
 * player who bets $100 total can expect to receive ~$92 back on average.
 * The 8% house edge accumulates as "total lost" in the app's reality-check
 * tracker, which is the whole point of this simulation.
 */

import {
  SLOT_SYMBOLS,
  type SlotSymbol,
  pickWeightedSymbol,
} from './slotSymbols';
import type {
  SlotPayline,
  SlotWinningLine,
  SlotSpinResult,
} from '../types';

export const REEL_COUNT = 5;
export const ROW_COUNT = 3;
export const TARGET_RTP_PERCENT = 92;

/**
 * Ten standard paylines for a 5x3 slot.
 * Each `rows` entry indexes which row to inspect on that reel.
 *
 * Row legend: 0 = top, 1 = middle, 2 = bottom.
 */
export const PAYLINES: readonly SlotPayline[] = [
  { id: 0, name: 'Middle', rows: [1, 1, 1, 1, 1] },
  { id: 1, name: 'Top', rows: [0, 0, 0, 0, 0] },
  { id: 2, name: 'Bottom', rows: [2, 2, 2, 2, 2] },
  { id: 3, name: 'V', rows: [0, 1, 2, 1, 0] },
  { id: 4, name: 'Inverted V', rows: [2, 1, 0, 1, 2] },
  { id: 5, name: 'Diagonal down', rows: [0, 0, 1, 2, 2] },
  { id: 6, name: 'Diagonal up', rows: [2, 2, 1, 0, 0] },
  { id: 7, name: 'Zigzag A', rows: [1, 0, 1, 2, 1] },
  { id: 8, name: 'Zigzag B', rows: [1, 2, 1, 0, 1] },
  { id: 9, name: 'Top arch', rows: [0, 1, 1, 1, 0] },
] as const;

/**
 * Payout multipliers per symbol by consecutive-match count.
 * Final payout = multiplier × betPerLine.
 *
 * Table is tuned against the symbol weights in slotSymbols.ts to
 * approximate a ~92% RTP across all 10 paylines active.
 */
export const PAYOUT_TABLE: Readonly<
  Record<SlotSymbol, Readonly<{ 3: number; 4: number; 5: number }>>
> = {
  '🍋': { 3: 1, 4: 3, 5: 10 },
  '🪙': { 3: 1, 4: 4, 5: 15 },
  '❤️': { 3: 2, 4: 5, 5: 20 },
  '💎': { 3: 3, 4: 8, 5: 30 },
  '💣': { 3: 4, 4: 12, 5: 50 },
  '💠': { 3: 5, 4: 15, 5: 75 },
  '🎩': { 3: 8, 4: 25, 5: 100 },
  '💰': { 3: 15, 4: 50, 5: 200 },
  '7️⃣': { 3: 25, 4: 100, 5: 500 },
};

/**
 * Generate a fresh 5×3 grid using weighted random symbols.
 * @param rng Injectable RNG for deterministic tests.
 */
export function spinGrid(rng: () => number = Math.random): string[][] {
  const grid: string[][] = [];
  for (let row = 0; row < ROW_COUNT; row++) {
    const rowArr: string[] = [];
    for (let col = 0; col < REEL_COUNT; col++) {
      rowArr.push(pickWeightedSymbol(rng));
    }
    grid.push(rowArr);
  }
  return grid;
}

/**
 * Count how many reels (starting from reel 0) contain the same symbol
 * along the given payline path.
 */
function countLeftStreak(
  grid: readonly (readonly string[])[],
  payline: SlotPayline
): { symbol: string; count: number } {
  const firstRow = payline.rows[0];
  const first = grid[firstRow]?.[0] ?? '';
  let count = 1;
  for (let reel = 1; reel < REEL_COUNT; reel++) {
    const row = payline.rows[reel];
    const sym = grid[row]?.[reel];
    if (sym === first) {
      count++;
    } else {
      break;
    }
  }
  return { symbol: first, count };
}

function lookupPayout(symbol: string, count: number): number {
  if (count < 3 || count > 5) return 0;
  const row = PAYOUT_TABLE[symbol as SlotSymbol];
  if (!row) return 0;
  return row[count as 3 | 4 | 5];
}

/**
 * Evaluate a spin: check every active payline for a left-aligned streak
 * of 3+ matching symbols and sum the payouts.
 */
export function evaluateSpin(
  grid: readonly (readonly string[])[],
  betPerLine: number,
  activePaylines: readonly SlotPayline[] = PAYLINES
): SlotSpinResult {
  const winningLines: SlotWinningLine[] = [];
  let totalWin = 0;

  for (const payline of activePaylines) {
    const { symbol, count } = countLeftStreak(grid, payline);
    const multiplier = lookupPayout(symbol, count);
    if (multiplier > 0) {
      const payout = multiplier * betPerLine;
      winningLines.push({
        paylineId: payline.id,
        symbol,
        count,
        payout,
      });
      totalWin += payout;
    }
  }

  return {
    grid: grid.map(row => [...row]),
    totalWin,
    winningLines,
  };
}

/**
 * Convenience: spin a fresh grid and evaluate it in one call.
 */
export function spinAndEvaluate(
  betPerLine: number,
  activePaylines: readonly SlotPayline[] = PAYLINES,
  rng: () => number = Math.random
): SlotSpinResult {
  const grid = spinGrid(rng);
  return evaluateSpin(grid, betPerLine, activePaylines);
}

// Re-export symbol set so consumers don't need two imports.
export { SLOT_SYMBOLS, pickWeightedSymbol };
