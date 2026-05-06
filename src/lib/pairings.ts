import { MenuItem } from '@/hooks/useMenuItems';

/**
 * Smart suggestion engine.
 *
 * Stages of a meal we model:
 *   1. Empty cart       → suggest STARTERS / popular openers
 *   2. Has starters     → suggest MAINS that pair
 *   3. Has mains/breads → suggest complementary curries / sides
 *   4. Has full meal    → suggest BEVERAGES + DESSERTS to round it off
 *
 * Plus full CAFE coverage: juices, shakes, smoothies, coffees, cakes, pastries,
 * sandwiches, burgers, pizzas, fries, momos, waffles, ice cream.
 */

const PAIRING_RULES: { if: string[]; suggest: string[]; reason: string }[] = [
  // ───── Indian breads → gravies ─────
  { if: ['roti', 'naan', 'kulcha', 'paratha', 'chapathi', 'rumali', 'phulka'],
    suggest: ['paneer', 'dal', 'aloo', 'chana', 'mixed veg', 'kurma', 'palak', 'butter masala'],
    reason: 'Goes great with bread' },

  // ───── Gravies → breads/rice ─────
  { if: ['paneer butter', 'palak paneer', 'dal', 'chana', 'kurma', 'aloo gobi', 'mixed veg', 'butter masala'],
    suggest: ['roti', 'naan', 'jeera rice', 'rumali', 'kulcha', 'butter rice'],
    reason: 'Pairs with this curry' },

  // ───── South Indian ─────
  { if: ['dosa', 'idli', 'vada', 'pongal', 'upma', 'uttapam'],
    suggest: ['filter coffee', 'masala chai', 'sambar', 'kesari', 'coconut chutney'],
    reason: 'South Indian classic combo' },

  // ───── Chinese ─────
  { if: ['fried rice', 'noodles', 'hakka', 'schezwan rice'],
    suggest: ['manchurian', 'paneer chilli', 'spring roll', 'sweet corn soup', 'chilli mushroom'],
    reason: 'Pairs perfectly' },

  // ───── Tandoor ─────
  { if: ['tikka', 'kebab', 'tandoori'],
    suggest: ['naan', 'rumali', 'butter roti', 'mint chutney'],
    reason: 'Eat with bread' },

  // ───── Spicy → cooling ─────
  { if: ['schezwan', 'mirchi', 'chilli', 'spicy'],
    suggest: ['curd rice', 'sweet lassi', 'butter milk', 'cold coffee', 'mango shake'],
    reason: 'Cools the spice' },

  // ───── Snacks → chai ─────
  { if: ['samosa', 'pakoda', 'bajji', 'bread pakoda', 'puff'],
    suggest: ['masala chai', 'filter coffee', 'lemon tea'],
    reason: 'Snack + chai combo' },

  // ───── CAFE: Burger/pizza/fries → drinks ─────
  { if: ['burger', 'pizza', 'sandwich', 'wrap', 'roll'],
    suggest: ['fries', 'cold coffee', 'mojito', 'iced tea', 'milkshake', 'soft drink', 'lemonade'],
    reason: 'Cafe combo' },

  // ───── CAFE: Pasta → garlic bread ─────
  { if: ['pasta', 'penne', 'spaghetti', 'lasagna'],
    suggest: ['garlic bread', 'iced tea', 'cold coffee', 'cheesy bread'],
    reason: 'Pasta combo' },

  // ───── CAFE: Coffee → dessert ─────
  { if: ['coffee', 'cappuccino', 'latte', 'espresso', 'americano'],
    suggest: ['brownie', 'cake', 'cheesecake', 'cookie', 'muffin', 'pastry', 'tiramisu'],
    reason: 'Pairs with coffee' },

  // ───── CAFE: Waffle/pancake → ice cream ─────
  { if: ['waffle', 'pancake', 'crepe'],
    suggest: ['ice cream', 'milkshake', 'hot chocolate', 'maple', 'nutella'],
    reason: 'Sweet pairing' },

  // ───── CAFE: Momos → soup/dip ─────
  { if: ['momo', 'momos', 'dimsum'],
    suggest: ['hot & sour soup', 'manchow soup', 'schezwan chutney', 'iced tea'],
    reason: 'Goes with momos' },
];

// Category groupings — used for stage detection
const STARTERS = ['soup', 'tikka', 'kebab', 'manchurian', 'spring roll', 'paneer chilli', 'pakoda',
  'samosa', 'bajji', 'momo', 'fries', 'nuggets', 'wings', 'salad', 'bruschetta', 'garlic bread',
  'cheese balls', 'puff', 'starter'];

const MAINS = ['biryani', 'rice', 'pulao', 'meals', 'thali', 'roti', 'naan', 'paratha', 'chapathi',
  'dosa', 'idli', 'noodles', 'pasta', 'pizza', 'burger', 'sandwich', 'wrap', 'roll',
  'paneer', 'dal', 'curry', 'gravy', 'masala', 'kurma', 'palak', 'chana', 'aloo', 'pongal'];

const BEVERAGES = ['coffee', 'tea', 'chai', 'juice', 'shake', 'smoothie', 'lassi', 'mojito',
  'lemonade', 'iced tea', 'cold coffee', 'milkshake', 'soft drink', 'coke', 'pepsi',
  'sprite', 'fanta', 'water', 'butter milk', 'cooler', 'hot chocolate', 'frappe'];

const DESSERTS = ['ice cream', 'cake', 'brownie', 'cheesecake', 'cookie', 'muffin', 'pastry',
  'tiramisu', 'gulab jamun', 'rasmalai', 'kheer', 'kesari', 'halwa', 'jalebi', 'falooda',
  'pudding', 'waffle', 'pancake', 'sundae', 'sweet'];

interface CartLike { id: string; name: string }

export interface PairingReco {
  item: MenuItem;
  reason: string;
  combo?: string;
}

function nameMatches(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function pickFrom(
  pool: MenuItem[],
  keywords: string[],
  reason: string,
  seen: Set<string>,
  results: PairingReco[],
  max: number,
) {
  for (const item of pool) {
    if (seen.has(item.id)) continue;
    if (!nameMatches(item.name, keywords)) continue;
    seen.add(item.id);
    results.push({ item, reason });
    if (results.length >= max) return;
  }
}

/**
 * Build a list of paired suggestions based on the current cart / ordered items.
 * The algorithm reasons about what *stage of the meal* the customer is at and
 * suggests the next logical thing.
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

  // ─── STAGE 1: empty cart → start them off with popular starters & openers
  if (cartItems.length === 0) {
    pickFrom(available, STARTERS, 'Popular starter', seen, results, limit);
    if (results.length < limit) {
      pickFrom(available, ['coffee', 'juice', 'shake'], 'Try this', seen, results, limit);
    }
    return results.slice(0, limit);
  }

  // ─── Detect what the cart already contains
  const cartNames = cartItems.map((c) => c.name);
  const hasStarter = cartNames.some((n) => nameMatches(n, STARTERS));
  const hasMain = cartNames.some((n) => nameMatches(n, MAINS));
  const hasBeverage = cartNames.some((n) => nameMatches(n, BEVERAGES));
  const hasDessert = cartNames.some((n) => nameMatches(n, DESSERTS));

  // ─── STAGE 2: Apply explicit pairing rules first (highest signal)
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

  // ─── STAGE 3: Has starters but no mains → push mains
  if (hasStarter && !hasMain && results.length < limit) {
    pickFrom(available, MAINS, 'Add a main', seen, results, limit);
  }

  // ─── STAGE 4: Has a full meal (main present) but no beverage → push juice/shake/coffee
  if (hasMain && !hasBeverage && results.length < limit) {
    pickFrom(available, ['juice', 'shake', 'lassi', 'mojito', 'cold coffee', 'butter milk'],
      'Pair with a drink', seen, results, limit);
  }

  // ─── STAGE 5: Meal + drink but no dessert → suggest dessert
  if (hasMain && hasBeverage && !hasDessert && results.length < limit) {
    pickFrom(available, DESSERTS, 'End with something sweet', seen, results, limit);
  }

  // ─── Fallback: complementary items from same categories
  if (results.length < limit) {
    const cats = new Set(
      cartItems.map((c) => menu.find((m) => m.id === c.id)?.category).filter(Boolean),
    );
    available
      .filter((m) => cats.has(m.category))
      .forEach((item) => {
        if (results.length >= limit) return;
        if (seen.has(item.id)) return;
        seen.add(item.id);
        results.push({ item, reason: 'You might also like' });
      });
  }

  return results.slice(0, limit);
}
