import { describe, it, expect } from 'vitest';
import {
  spinGrid,
  evaluateSpin,
  PAYLINES,
  PAYOUT_TABLE,
  REEL_COUNT,
  ROW_COUNT,
} from './slotEngine';
import { SLOT_SYMBOLS } from './slotSymbols';

/**
 * Build a 5×3 grid from a compact row-major literal.
 * Rows: top, middle, bottom.
 */
function grid(top: string[], middle: string[], bottom: string[]): string[][] {
  return [top, middle, bottom];
}

/** Deterministic RNG — sequential from seed. */
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe('spinGrid', () => {
  it('produces a grid with 3 rows and 5 columns', () => {
    const g = spinGrid();
    expect(g).toHaveLength(ROW_COUNT);
    for (const row of g) {
      expect(row).toHaveLength(REEL_COUNT);
    }
  });

  it('only contains valid symbols', () => {
    const g = spinGrid();
    for (const row of g) {
      for (const cell of row) {
        expect(SLOT_SYMBOLS).toContain(cell);
      }
    }
  });

  it('is deterministic with an injected RNG', () => {
    const a = spinGrid(seededRng(42));
    const b = spinGrid(seededRng(42));
    expect(a).toEqual(b);
  });
});

describe('evaluateSpin — middle payline', () => {
  const middle = PAYLINES.find(p => p.id === 0)!;

  it('pays 3-match lemons', () => {
    const g = grid(
      ['💎', '💎', '💎', '💎', '💎'],
      ['🍋', '🍋', '🍋', '💰', '💰'],
      ['💎', '💎', '💎', '💎', '💎']
    );
    const result = evaluateSpin(g, 1, [middle]);
    expect(result.winningLines).toHaveLength(1);
    expect(result.winningLines[0].symbol).toBe('🍋');
    expect(result.winningLines[0].count).toBe(3);
    expect(result.winningLines[0].payout).toBe(PAYOUT_TABLE['🍋'][3]);
    expect(result.totalWin).toBe(PAYOUT_TABLE['🍋'][3]);
  });

  it('pays a 5-match jackpot', () => {
    const g = grid(
      ['💎', '💎', '💎', '💎', '💎'],
      ['7️⃣', '7️⃣', '7️⃣', '7️⃣', '7️⃣'],
      ['💎', '💎', '💎', '💎', '💎']
    );
    const result = evaluateSpin(g, 1, [middle]);
    expect(result.winningLines[0].count).toBe(5);
    expect(result.totalWin).toBe(PAYOUT_TABLE['7️⃣'][5]);
  });

  it('counts a 4-streak when reel 5 breaks', () => {
    const g = grid(
      ['💎', '💎', '💎', '💎', '💎'],
      ['💰', '💰', '💰', '💰', '🍋'],
      ['💎', '💎', '💎', '💎', '💎']
    );
    const result = evaluateSpin(g, 1, [middle]);
    expect(result.winningLines[0].count).toBe(4);
    expect(result.totalWin).toBe(PAYOUT_TABLE['💰'][4]);
  });

  it('pays nothing for a 2-match', () => {
    const g = grid(
      ['💎', '💎', '💎', '💎', '💎'],
      ['💰', '💰', '🍋', '🪙', '❤️'],
      ['💎', '💎', '💎', '💎', '💎']
    );
    const result = evaluateSpin(g, 1, [middle]);
    expect(result.winningLines).toHaveLength(0);
    expect(result.totalWin).toBe(0);
  });

  it('enforces left-to-right: streak must start at reel 0', () => {
    const g = grid(
      ['💎', '💎', '💎', '💎', '💎'],
      ['❤️', '💰', '💰', '💰', '💰'], // 4 💰 but starts at reel 1
      ['💎', '💎', '💎', '💎', '💎']
    );
    const result = evaluateSpin(g, 1, [middle]);
    expect(result.winningLines).toHaveLength(0);
  });
});

describe('evaluateSpin — multiple paylines', () => {
  it('sums wins across multiple hit paylines', () => {
    const g = grid(
      ['🍋', '🍋', '🍋', '❤️', '❤️'], // top: 3× 🍋
      ['💰', '💰', '💰', '❤️', '❤️'], // middle: 3× 💰
      ['💎', '💎', '💎', '🪙', '🪙']  // bottom: 3× 💎
    );
    const result = evaluateSpin(g, 1, PAYLINES);
    const ids = result.winningLines.map(w => w.paylineId).sort();
    expect(ids).toContain(0); // middle
    expect(ids).toContain(1); // top
    expect(ids).toContain(2); // bottom
    const expected =
      PAYOUT_TABLE['🍋'][3] +
      PAYOUT_TABLE['💰'][3] +
      PAYOUT_TABLE['💎'][3];
    // Other paylines may or may not hit depending on shape; totalWin >= expected
    expect(result.totalWin).toBeGreaterThanOrEqual(expected);
  });

  it('scales payouts linearly with betPerLine', () => {
    const g = grid(
      ['💎', '💎', '💎', '💎', '💎'],
      ['🎩', '🎩', '🎩', '💣', '💣'],
      ['💎', '💎', '💎', '💎', '💎']
    );
    const middle = [PAYLINES[0]];
    const r1 = evaluateSpin(g, 1, middle);
    const r5 = evaluateSpin(g, 5, middle);
    expect(r5.totalWin).toBe(r1.totalWin * 5);
  });

  it('ignores paylines that are not active', () => {
    const g = grid(
      ['🍋', '🍋', '🍋', '🍋', '🍋'], // top: 5× 🍋 jackpot
      ['❤️', '💣', '💰', '🪙', '💎'],
      ['💎', '💎', '💎', '💎', '💎']
    );
    const onlyMiddle = [PAYLINES[0]];
    const result = evaluateSpin(g, 1, onlyMiddle);
    expect(result.totalWin).toBe(0);
    expect(result.winningLines).toHaveLength(0);
  });
});

describe('evaluateSpin — zigzag paylines', () => {
  it('evaluates V-shape payline correctly', () => {
    // V = rows [0,1,2,1,0]
    const g = grid(
      ['💠', '❤️', '❤️', '❤️', '💠'], // corners for V
      ['💎', '💠', '❤️', '💠', '💎'],
      ['💎', '💎', '💠', '💎', '💎']
    );
    const vLine = PAYLINES.find(p => p.name === 'V')!;
    const result = evaluateSpin(g, 1, [vLine]);
    // V path reads: 💠, 💠, 💠, 💠, 💠 → 5-match
    expect(result.winningLines).toHaveLength(1);
    expect(result.winningLines[0].symbol).toBe('💠');
    expect(result.winningLines[0].count).toBe(5);
    expect(result.totalWin).toBe(PAYOUT_TABLE['💠'][5]);
  });
});
