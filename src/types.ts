
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
