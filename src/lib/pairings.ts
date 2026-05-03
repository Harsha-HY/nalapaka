import { MenuItem } from '@/hooks/useMenuItems';

/**
 * Heuristic pairing rules — captures classic Indian dining combos.
 * Each rule: if cart contains any keyword in `if`, suggest items whose name
 * matches any keyword in `suggest` (and aren't already in cart).
 */
const PAIRING_RULES: { if: string[]; suggest: string[]; reason: string }[] = [
  // Breads → gravies
  { if: ['roti', 'naan', 'kulcha', 'paratha', 'chapathi', 'rumali'],
    suggest: ['paneer', 'dal', 'aloo', 'chana', 'mixed veg', 'kurma', 'palak'],
    reason: 'Goes great with roti' },

  // Gravies → breads/rice
  { if: ['paneer butter', 'palak paneer', 'dal', 'chana', 'kurma', 'aloo gobi', 'mixed veg'],
    suggest: ['roti', 'naan', 'jeera rice', 'rumali', 'kulcha'],
    reason: 'Pairs with this curry' },

  // Dosa → chutney/sambar/coffee
  { if: ['dosa', 'idli', 'vada', 'pongal', 'upma'],
    suggest: ['filter coffee', 'masala chai', 'sambar', 'kesari'],
    reason: 'South Indian combo' },

  // Chinese rice → starter
  { if: ['fried rice', 'noodles', 'hakka'],
    suggest: ['manchurian', 'paneer chilli', 'spring roll', 'sweet corn soup'],
    reason: 'Pairs with this' },

  // Tandoor starters → bread
  { if: ['tikka', 'kebab'],
    suggest: ['naan', 'rumali', 'butter roti'],
    reason: 'Eat with bread' },

  // Spicy → cooling
  { if: ['schezwan', 'mirchi', 'chilli'],
    suggest: ['curd rice', 'sweet corn soup', 'masala chai'],
    reason: 'Cools the spice' },

  // Snacks → chai
  { if: ['samosa', 'pakoda', 'bajji', 'bread pakoda'],
    suggest: ['masala chai', 'filter coffee'],
    reason: 'Snack + chai' },
];

const STARTERS = ['soup', 'tikka', 'kebab', 'manchurian', 'spring roll', 'paneer chilli', 'pakoda', 'samosa', 'bajji'];

interface CartLike { id: string; name: string }

function nameMatches(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export interface PairingReco {
  item: MenuItem;
  reason: string;
  combo?: string; // e.g. "Roti + Paneer"
}

/**
 * Build a list of paired suggestions based on the current cart / ordered items.
 * If the cart is empty, suggest popular STARTERS first (good for fresh customers).
 */
export function computePairings(
  cartItems: CartLike[],
  menu: MenuItem[],
  limit = 6,
): PairingReco[] {
  const inCart = new Set(cartItems.map((i) => i.id));
  const available = menu.filter((m) => m.isAvailable && !inCart.has(m.id));
  const results: PairingReco[] = [];
  const seen = new Set<string>();

  // 1. Empty cart → starters first
  if (cartItems.length === 0) {
    available
      .filter((m) => nameMatches(m.name, STARTERS))
      .slice(0, limit)
      .forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          results.push({ item, reason: 'Popular starter' });
        }
      });
    if (results.length >= limit) return results.slice(0, limit);
  }

  // 2. Apply pairing rules from cart contents
  for (const cartItem of cartItems) {
    for (const rule of PAIRING_RULES) {
      if (!nameMatches(cartItem.name, rule.if)) continue;
      const matches = available.filter((m) => nameMatches(m.name, rule.suggest));
      for (const item of matches) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        results.push({
          item,
          reason: rule.reason,
          combo: `${cartItem.name} + ${item.name}`,
        });
        if (results.length >= limit) return results;
      }
    }
  }

  // 3. Fallback: same-category complements
  if (results.length < limit) {
    const cats = new Set(cartItems.map((c) => menu.find((m) => m.id === c.id)?.category).filter(Boolean));
    available
      .filter((m) => cats.has(m.category))
      .slice(0, limit - results.length)
      .forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          results.push({ item, reason: 'You might also like' });
        }
      });
  }

  return results.slice(0, limit);
}
