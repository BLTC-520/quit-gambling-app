/**
 * Shared slot machine symbol set.
 *
 * Used by both the rate-decision SlotMachine (WorkStation) and the
 * chip-betting BettingSlotMachine to keep visuals consistent.
 */

export const SLOT_SYMBOLS = [
  '🍋',
  '🪙',
  '❤️',
  '💎',
  '💣',
  '💠',
  '🎩',
  '💰',
  '7️⃣',
] as const;

export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

/**
 * Relative weights for weighted random symbol selection.
 * Higher weight = more common. 🍋 is most common, 7️⃣ is rarest.
 */
export const SYMBOL_WEIGHTS: Readonly<Record<SlotSymbol, number>> = {
  '🍋': 28,
  '🪙': 22,
  '❤️': 16,
  '💎': 12,
  '💣': 8,
  '💠': 6,
  '🎩': 4,
  '💰': 3,
  '7️⃣': 1,
};

const TOTAL_WEIGHT = SLOT_SYMBOLS.reduce(
  (sum, sym) => sum + SYMBOL_WEIGHTS[sym],
  0
);

/**
 * Pick a symbol using the configured weights.
 * Accepts an injected RNG for deterministic testing.
 */
export function pickWeightedSymbol(rng: () => number = Math.random): SlotSymbol {
  let roll = rng() * TOTAL_WEIGHT;
  for (const sym of SLOT_SYMBOLS) {
    roll -= SYMBOL_WEIGHTS[sym];
    if (roll <= 0) return sym;
  }
  return SLOT_SYMBOLS[0];
}
