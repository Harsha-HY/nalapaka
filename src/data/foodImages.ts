// Food image mapping - realistic images matching each menu item
// Uses free food image APIs for real food photos

const foodImageMap: Record<string, string> = {
  // South Indian - Morning
  'idli': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
  'vada': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
  'idli-vada': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
  'pongal': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
  'upma': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop',
  'kesari-bath': 'https://images.unsplash.com/photo-1666190020826-a4cc6dc017f1?w=400&h=300&fit=crop',

  // South Indian - All day  
  'plain-dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
  'masala-dosa': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
  'set-dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
  'rava-dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
  'onion-dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
  'mysore-masala-dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
  'bisi-bele-bath': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',

  // South Indian - Afternoon
  'full-meals': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
  'mini-meals': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
  'curd-rice': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop',
  'sambar-rice': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',

  // North Indian
  'paneer-butter-masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop',
  'palak-paneer': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop',
  'dal-fry': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
  'dal-tadka': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
  'mixed-veg': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
  'aloo-gobi': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop',
  'chana-masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
  'butter-roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'plain-naan': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'butter-naan': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'garlic-naan': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'jeera-rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop',

  // Chinese
  'veg-fried-rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
  'schezwan-fried-rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
  'veg-noodles': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop',
  'hakka-noodles': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop',
  'schezwan-noodles': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop',
  'manchurian-dry': 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&h=300&fit=crop',
  'manchurian-gravy': 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&h=300&fit=crop',
  'paneer-chilli': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop',
  'spring-roll': 'https://images.unsplash.com/photo-1606525437817-0bca55e0929a?w=400&h=300&fit=crop',
  'sweet-corn-soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',

  // Tandoor
  'paneer-tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
  'malai-paneer-tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
  'tandoori-roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'rumali-roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'kulcha': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'mushroom-tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
  'veg-seekh-kebab': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
  'hara-bhara-kebab': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',

  // Evening snacks
  'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
  'mirchi-bajji': 'https://images.unsplash.com/photo-1606525437817-0bca55e0929a?w=400&h=300&fit=crop',
  'onion-pakoda': 'https://images.unsplash.com/photo-1606525437817-0bca55e0929a?w=400&h=300&fit=crop',
  'bread-pakoda': 'https://images.unsplash.com/photo-1606525437817-0bca55e0929a?w=400&h=300&fit=crop',
  'masala-chai': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop',
  'filter-coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=300&fit=crop',

  // Night specials
  'roti-sabji': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'chapathi-kurma': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
  'paratha-curry': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
};

export function getFoodImage(itemId: string): string {
  return foodImageMap[itemId] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
}

// Smaller thumbnails for manager dashboard
export function getFoodThumbnail(itemId: string): string {
  const base = foodImageMap[itemId] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  return base.replace('w=400&h=300', 'w=80&h=60');
}
