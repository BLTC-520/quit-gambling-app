
import { Card } from '../types';

export function calculateBlackjackScore(hand: Card[]): number {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.rank === 'A') {
      aces += 1;
      score += 11;
    } else if (['J', 'Q', 'K', '10'].includes(card.rank)) {
      score += 10;
    } else {
      score += parseInt(card.rank);
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
}

export function isBust(score: number): boolean {
  return score > 21;
}

export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateBlackjackScore(hand) === 21;
}
