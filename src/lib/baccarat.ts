
import { Card, CardRank, CardSuit } from '../types';

const SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = 0;
      if (rank === 'A') value = 1;
      else if (['10', 'J', 'Q', 'K'].includes(rank)) value = 0;
      else value = parseInt(rank);
      
      deck.push({ suit, rank, value });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateScore(hand: Card[]): number {
  const sum = hand.reduce((acc, card) => acc + card.value, 0);
  return sum % 10;
}

export function shouldPlayerDraw(playerScore: number): boolean {
  return playerScore <= 5;
}

export function shouldBankerDraw(bankerScore: number, playerThirdCardValue: number | null): boolean {
  if (playerThirdCardValue === null) {
    return bankerScore <= 5;
  }

  // Banker's third card rules
  if (bankerScore <= 2) return true;
  if (bankerScore === 3) return playerThirdCardValue !== 8;
  if (bankerScore === 4) return [2, 3, 4, 5, 6, 7].includes(playerThirdCardValue);
  if (bankerScore === 5) return [4, 5, 6, 7].includes(playerThirdCardValue);
  if (bankerScore === 6) return [6, 7].includes(playerThirdCardValue);
  
  return false;
}
