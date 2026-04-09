
import { Item } from '../types';

export const ITEMS: Item[] = [
  { name: 'KFC Meal', price: 10, icon: '🍗' },
  { name: 'Abalone Dinner', price: 50, icon: '🐚' },
  { name: 'Luxury Buffet', price: 150, icon: '🍣' },
  { name: 'MacBook Pro', price: 2000, icon: '💻' },
  { name: 'Rolex Watch', price: 15000, icon: '⌚' },
  { name: 'Luxury Car', price: 80000, icon: '🚗' },
  { name: 'Dream House', price: 500000, icon: '🏠' },
];

export function getAffordableItems(totalLost: number) {
  return ITEMS.map(item => {
    const count = Math.floor(totalLost / item.price);
    const progress = (totalLost % item.price) / item.price * 100;
    return { ...item, count, progress };
  });
}
