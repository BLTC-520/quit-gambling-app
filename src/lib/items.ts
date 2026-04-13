import { Item } from '../types';

// Ordered ascending by price. Each tier should feel progressively more
// lucrative — from small daily pleasures to life-changing milestones.
export const ITEMS: readonly Item[] = [
  // Tier 1 — everyday temptations
  { name: 'Bubble Tea', price: 5, icon: '🧋' },
  { name: 'KFC Meal', price: 10, icon: '🍗' },
  { name: 'Movie Ticket', price: 15, icon: '🎬' },
  { name: 'Uber Ride Home', price: 25, icon: '🚕' },
  { name: 'Steamboat Dinner', price: 60, icon: '🍲' },

  // Tier 2 — small experiences
  { name: 'Concert Ticket', price: 150, icon: '🎤' },
  { name: 'Spa Day', price: 220, icon: '💆' },
  { name: 'AirPods Pro', price: 280, icon: '🎧' },
  { name: 'Flight to Guangzhou', price: 400, icon: '✈️' },
  { name: 'Weekend in Penang', price: 650, icon: '🏖️' },
  { name: 'Flight to Tokyo', price: 900, icon: '🗼' },

  // Tier 3 — tech & bigger trips
  { name: 'iPhone 16 Pro', price: 1600, icon: '📱' },
  { name: 'Flight to Europe', price: 2200, icon: '🛫' },
  { name: 'MacBook Pro', price: 2800, icon: '💻' },
  { name: 'Luxury Cruise', price: 5000, icon: '🛳️' },

  // Tier 4 — luxury goods
  { name: 'Rolex Submariner', price: 15000, icon: '⌚' },
  { name: 'Dream Wedding', price: 35000, icon: '💍' },
  { name: 'Tesla Model 3', price: 55000, icon: '🚗' },
  { name: 'BMW M4', price: 110000, icon: '🏎️' },

  // Tier 5 — life-changing
  { name: 'HDB Down Payment', price: 150000, icon: '🏢' },
  { name: 'Child University Fund', price: 300000, icon: '🎓' },
  { name: 'Dream House', price: 900000, icon: '🏠' },
  { name: 'Retire Early', price: 1500000, icon: '🏝️' },
];

export interface TrackedItem extends Item {
  readonly count: number;
  readonly progress: number;
  readonly affordable: boolean;
}

const MAX_AFFORDABLE_VISIBLE = 5;
const MAX_GOALS_VISIBLE = 2;

/**
 * Returns a curated window of items that "switches" as totalLost grows:
 * - The most lucrative items the user can already afford (highest tier first)
 * - Plus the next 1–2 aspirational items they haven't unlocked yet
 *
 * Before any loss, shows a preview of the first few tiers as teasers.
 */
export function getAffordableItems(totalLost: number): TrackedItem[] {
  const tracked: TrackedItem[] = ITEMS.map((item) => {
    const count = Math.floor(totalLost / item.price);
    const progress = ((totalLost % item.price) / item.price) * 100;
    return { ...item, count, progress, affordable: count >= 1 };
  });

  const affordable = tracked.filter((i) => i.affordable);
  const locked = tracked.filter((i) => !i.affordable);

  if (affordable.length === 0) {
    // No losses yet — tease the first few tiers so the user sees what's at stake
    return locked.slice(0, 3);
  }

  // Show the top (most expensive) affordable items — these are the most
  // impactful "reality checks" and reflect the growing scale of loss
  const topAffordable = affordable.slice(-MAX_AFFORDABLE_VISIBLE).reverse();
  const nextGoals = locked.slice(0, MAX_GOALS_VISIBLE);

  return [...topAffordable, ...nextGoals];
}

/**
 * Returns the single most lucrative item already fully afforded.
 * Used to display a headline "biggest thing you could have bought" callout.
 */
export function getBiggestAffordable(totalLost: number): TrackedItem | null {
  const affordable: TrackedItem[] = ITEMS
    .map((item) => {
      const count = Math.floor(totalLost / item.price);
      const progress = ((totalLost % item.price) / item.price) * 100;
      return { ...item, count, progress, affordable: count >= 1 };
    })
    .filter((i) => i.affordable);

  if (affordable.length === 0) return null;
  return affordable[affordable.length - 1];
}
