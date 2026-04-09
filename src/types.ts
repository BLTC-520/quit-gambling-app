
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  value: number;
}

export type BetType = 'player' | 'banker' | 'tie';

export interface GameState {
  balance: number;
  totalLost: number;
  currentBet: number;
  selectedBet: BetType | null;
  playerHand: Card[];
  bankerHand: Card[];
  isDealing: boolean;
  result: 'player' | 'banker' | 'tie' | 'dealer' | 'push' | null;
  history: ('P' | 'B' | 'T' | 'W' | 'L' | 'D')[];
}

export type BlackjackAction = 'hit' | 'stand' | 'double' | 'split';

export interface Item {
  name: string;
  price: number;
  icon: string;
}

export interface MysteryBoxResult {
  readonly amount: number;
  readonly opened: boolean;
  readonly timestamp: number;
}

// ─── Slot machine types ──────────────────────────────────────────
export interface SlotPayline {
  readonly id: number;
  readonly name: string;
  readonly rows: readonly number[]; // length = REEL_COUNT (5)
}

export interface SlotWinningLine {
  readonly paylineId: number;
  readonly symbol: string;
  readonly count: number; // 3, 4, or 5
  readonly payout: number; // chips won on this line
}

export interface SlotSpinResult {
  readonly grid: readonly (readonly string[])[];
  readonly totalWin: number;
  readonly winningLines: readonly SlotWinningLine[];
}
