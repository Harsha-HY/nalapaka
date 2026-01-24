export interface MenuItem {
  id: string;
  name: string;
  nameKn: string;
  price: number;
  category: 'south-indian' | 'north-indian' | 'chinese' | 'tandoor';
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night' | 'all';
  image?: string;
}

export const menuItems: MenuItem[] = [
  // South Indian - Morning
  { id: 'idli', name: 'Idli (2 pcs)', nameKn: 'ಇಡ್ಲಿ (2 ಪೀಸ್)', price: 40, category: 'south-indian', timeSlot: 'morning' },
  { id: 'vada', name: 'Vada (2 pcs)', nameKn: 'ವಡೆ (2 ಪೀಸ್)', price: 50, category: 'south-indian', timeSlot: 'morning' },
  { id: 'idli-vada', name: 'Idli Vada Combo', nameKn: 'ಇಡ್ಲಿ ವಡೆ ಕಾಂಬೊ', price: 70, category: 'south-indian', timeSlot: 'morning' },
  { id: 'pongal', name: 'Ven Pongal', nameKn: 'ವೆಣ್ ಪೊಂಗಲ್', price: 60, category: 'south-indian', timeSlot: 'morning' },
  { id: 'upma', name: 'Upma', nameKn: 'ಉಪ್ಪಿಟ್ಟು', price: 45, category: 'south-indian', timeSlot: 'morning' },
  { id: 'kesari-bath', name: 'Kesari Bath', nameKn: 'ಕೇಸರಿ ಬಾತ್', price: 50, category: 'south-indian', timeSlot: 'morning' },
  
  // South Indian - All day
  { id: 'plain-dosa', name: 'Plain Dosa', nameKn: 'ಸಾದಾ ದೋಸೆ', price: 60, category: 'south-indian', timeSlot: 'all' },
  { id: 'masala-dosa', name: 'Masala Dosa', nameKn: 'ಮಸಾಲೆ ದೋಸೆ', price: 80, category: 'south-indian', timeSlot: 'all' },
  { id: 'set-dosa', name: 'Set Dosa (3 pcs)', nameKn: 'ಸೆಟ್ ದೋಸೆ (3 ಪೀಸ್)', price: 70, category: 'south-indian', timeSlot: 'all' },
  { id: 'rava-dosa', name: 'Rava Dosa', nameKn: 'ರವೆ ದೋಸೆ', price: 75, category: 'south-indian', timeSlot: 'all' },
  { id: 'onion-dosa', name: 'Onion Dosa', nameKn: 'ಈರುಳ್ಳಿ ದೋಸೆ', price: 70, category: 'south-indian', timeSlot: 'all' },
  { id: 'mysore-masala-dosa', name: 'Mysore Masala Dosa', nameKn: 'ಮೈಸೂರು ಮಸಾಲೆ ದೋಸೆ', price: 90, category: 'south-indian', timeSlot: 'all' },
  { id: 'bisi-bele-bath', name: 'Bisi Bele Bath', nameKn: 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್', price: 80, category: 'south-indian', timeSlot: 'all' },
  
  // South Indian - Afternoon
  { id: 'full-meals', name: 'Full Meals', nameKn: 'ಊಟ (ಪೂರ್ಣ)', price: 120, category: 'south-indian', timeSlot: 'afternoon' },
  { id: 'mini-meals', name: 'Mini Meals', nameKn: 'ಮಿನಿ ಊಟ', price: 90, category: 'south-indian', timeSlot: 'afternoon' },
  { id: 'curd-rice', name: 'Curd Rice', nameKn: 'ಮೊಸರು ಅನ್ನ', price: 60, category: 'south-indian', timeSlot: 'afternoon' },
  { id: 'sambar-rice', name: 'Sambar Rice', nameKn: 'ಸಾಂಬಾರ್ ಅನ್ನ', price: 70, category: 'south-indian', timeSlot: 'afternoon' },
  
  // North Indian
  { id: 'paneer-butter-masala', name: 'Paneer Butter Masala', nameKn: 'ಪನೀರ್ ಬಟರ್ ಮಸಾಲ', price: 180, category: 'north-indian', timeSlot: 'all' },
  { id: 'palak-paneer', name: 'Palak Paneer', nameKn: 'ಪಾಲಕ್ ಪನೀರ್', price: 170, category: 'north-indian', timeSlot: 'all' },
  { id: 'dal-fry', name: 'Dal Fry', nameKn: 'ದಾಲ್ ಫ್ರೈ', price: 120, category: 'north-indian', timeSlot: 'all' },
  { id: 'dal-tadka', name: 'Dal Tadka', nameKn: 'ದಾಲ್ ತಡ್ಕಾ', price: 130, category: 'north-indian', timeSlot: 'all' },
  { id: 'mixed-veg', name: 'Mixed Vegetable Curry', nameKn: 'ಮಿಕ್ಸ್ಡ್ ವೆಜಿಟೇಬಲ್', price: 140, category: 'north-indian', timeSlot: 'all' },
  { id: 'aloo-gobi', name: 'Aloo Gobi', nameKn: 'ಆಲೂ ಗೋಬಿ', price: 130, category: 'north-indian', timeSlot: 'all' },
  { id: 'chana-masala', name: 'Chana Masala', nameKn: 'ಚನಾ ಮಸಾಲ', price: 140, category: 'north-indian', timeSlot: 'all' },
  { id: 'butter-roti', name: 'Butter Roti', nameKn: 'ಬಟರ್ ರೋಟಿ', price: 30, category: 'north-indian', timeSlot: 'all' },
  { id: 'plain-naan', name: 'Plain Naan', nameKn: 'ಸಾದಾ ನಾನ್', price: 40, category: 'north-indian', timeSlot: 'all' },
  { id: 'butter-naan', name: 'Butter Naan', nameKn: 'ಬಟರ್ ನಾನ್', price: 50, category: 'north-indian', timeSlot: 'all' },
  { id: 'garlic-naan', name: 'Garlic Naan', nameKn: 'ಗಾರ್ಲಿಕ್ ನಾನ್', price: 60, category: 'north-indian', timeSlot: 'all' },
  { id: 'jeera-rice', name: 'Jeera Rice', nameKn: 'ಜೀರಾ ರೈಸ್', price: 100, category: 'north-indian', timeSlot: 'all' },
  
  // Chinese
  { id: 'veg-fried-rice', name: 'Veg Fried Rice', nameKn: 'ವೆಜ್ ಫ್ರೈಡ್ ರೈಸ್', price: 120, category: 'chinese', timeSlot: 'all' },
  { id: 'schezwan-fried-rice', name: 'Schezwan Fried Rice', nameKn: 'ಶೆಜ್ವಾನ್ ಫ್ರೈಡ್ ರೈಸ್', price: 140, category: 'chinese', timeSlot: 'all' },
  { id: 'veg-noodles', name: 'Veg Noodles', nameKn: 'ವೆಜ್ ನೂಡಲ್ಸ್', price: 110, category: 'chinese', timeSlot: 'all' },
  { id: 'hakka-noodles', name: 'Hakka Noodles', nameKn: 'ಹಕ್ಕಾ ನೂಡಲ್ಸ್', price: 120, category: 'chinese', timeSlot: 'all' },
  { id: 'schezwan-noodles', name: 'Schezwan Noodles', nameKn: 'ಶೆಜ್ವಾನ್ ನೂಡಲ್ಸ್', price: 130, category: 'chinese', timeSlot: 'all' },
  { id: 'manchurian-dry', name: 'Gobi Manchurian Dry', nameKn: 'ಗೋಬಿ ಮಂಚೂರಿಯನ್ ಡ್ರೈ', price: 140, category: 'chinese', timeSlot: 'all' },
  { id: 'manchurian-gravy', name: 'Gobi Manchurian Gravy', nameKn: 'ಗೋಬಿ ಮಂಚೂರಿಯನ್ ಗ್ರೇವಿ', price: 150, category: 'chinese', timeSlot: 'all' },
  { id: 'paneer-chilli', name: 'Chilli Paneer', nameKn: 'ಚಿಲ್ಲಿ ಪನೀರ್', price: 180, category: 'chinese', timeSlot: 'all' },
  { id: 'spring-roll', name: 'Veg Spring Roll', nameKn: 'ವೆಜ್ ಸ್ಪ್ರಿಂಗ್ ರೋಲ್', price: 100, category: 'chinese', timeSlot: 'all' },
  { id: 'sweet-corn-soup', name: 'Sweet Corn Soup', nameKn: 'ಸ್ವೀಟ್ ಕಾರ್ನ್ ಸೂಪ್', price: 80, category: 'chinese', timeSlot: 'all' },
  
  // Tandoor - Evening/Night
  { id: 'paneer-tikka', name: 'Paneer Tikka', nameKn: 'ಪನೀರ್ ಟಿಕ್ಕಾ', price: 200, category: 'tandoor', timeSlot: 'evening' },
  { id: 'malai-paneer-tikka', name: 'Malai Paneer Tikka', nameKn: 'ಮಲಾಯಿ ಪನೀರ್ ಟಿಕ್ಕಾ', price: 220, category: 'tandoor', timeSlot: 'evening' },
  { id: 'tandoori-roti', name: 'Tandoori Roti', nameKn: 'ತಂದೂರಿ ರೋಟಿ', price: 35, category: 'tandoor', timeSlot: 'evening' },
  { id: 'rumali-roti', name: 'Rumali Roti', nameKn: 'ರುಮಾಲಿ ರೋಟಿ', price: 40, category: 'tandoor', timeSlot: 'evening' },
  { id: 'kulcha', name: 'Stuffed Kulcha', nameKn: 'ಸ್ಟಫ್ಡ್ ಕುಲ್ಚಾ', price: 70, category: 'tandoor', timeSlot: 'evening' },
  { id: 'mushroom-tikka', name: 'Mushroom Tikka', nameKn: 'ಮಶ್ರೂಮ್ ಟಿಕ್ಕಾ', price: 180, category: 'tandoor', timeSlot: 'evening' },
  { id: 'veg-seekh-kebab', name: 'Veg Seekh Kebab', nameKn: 'ವೆಜ್ ಸೀಖ್ ಕಬಾಬ್', price: 160, category: 'tandoor', timeSlot: 'evening' },
  { id: 'hara-bhara-kebab', name: 'Hara Bhara Kebab', nameKn: 'ಹರಾ ಭರಾ ಕಬಾಬ್', price: 150, category: 'tandoor', timeSlot: 'evening' },
  
  // Evening snacks
  { id: 'samosa', name: 'Samosa (2 pcs)', nameKn: 'ಸಮೋಸ (2 ಪೀಸ್)', price: 40, category: 'south-indian', timeSlot: 'evening' },
  { id: 'mirchi-bajji', name: 'Mirchi Bajji (4 pcs)', nameKn: 'ಮಿರ್ಚಿ ಬಜ್ಜಿ (4 ಪೀಸ್)', price: 50, category: 'south-indian', timeSlot: 'evening' },
  { id: 'onion-pakoda', name: 'Onion Pakoda', nameKn: 'ಈರುಳ್ಳಿ ಪಕೋಡ', price: 60, category: 'south-indian', timeSlot: 'evening' },
  { id: 'bread-pakoda', name: 'Bread Pakoda', nameKn: 'ಬ್ರೆಡ್ ಪಕೋಡ', price: 50, category: 'south-indian', timeSlot: 'evening' },
  { id: 'masala-chai', name: 'Masala Chai', nameKn: 'ಮಸಾಲ ಚಹಾ', price: 25, category: 'south-indian', timeSlot: 'evening' },
  { id: 'filter-coffee', name: 'Filter Coffee', nameKn: 'ಫಿಲ್ಟರ್ ಕಾಫಿ', price: 30, category: 'south-indian', timeSlot: 'evening' },
  
  // Night specials
  { id: 'roti-sabji', name: 'Roti Sabji Combo', nameKn: 'ರೋಟಿ ಸಬ್ಜಿ ಕಾಂಬೊ', price: 100, category: 'north-indian', timeSlot: 'night' },
  { id: 'chapathi-kurma', name: 'Chapathi Kurma', nameKn: 'ಚಪಾತಿ ಕುರ್ಮಾ', price: 90, category: 'south-indian', timeSlot: 'night' },
  { id: 'paratha-curry', name: 'Paratha with Curry', nameKn: 'ಪರೋಟಾ ಕರಿ', price: 80, category: 'south-indian', timeSlot: 'night' },
];

export const getCategoryLabel = (category: MenuItem['category'], language: 'en' | 'kn'): string => {
  const labels: Record<MenuItem['category'], { en: string; kn: string }> = {
    'south-indian': { en: 'South Indian', kn: 'ದಕ್ಷಿಣ ಭಾರತೀಯ' },
    'north-indian': { en: 'North Indian', kn: 'ಉತ್ತರ ಭಾರತೀಯ' },
    'chinese': { en: 'Chinese', kn: 'ಚೈನೀಸ್' },
    'tandoor': { en: 'Tandoor', kn: 'ತಂದೂರ್' },
  };
  return labels[category][language];
};

export const getTimeSlotLabel = (timeSlot: MenuItem['timeSlot'], language: 'en' | 'kn'): string => {
  const labels: Record<MenuItem['timeSlot'], { en: string; kn: string }> = {
    'morning': { en: 'Morning (6 AM - 11 AM)', kn: 'ಬೆಳಿಗ್ಗೆ (6 - 11)' },
    'afternoon': { en: 'Afternoon (11 AM - 4 PM)', kn: 'ಮಧ್ಯಾಹ್ನ (11 - 4)' },
    'evening': { en: 'Evening (4 PM - 8 PM)', kn: 'ಸಂಜೆ (4 - 8)' },
    'night': { en: 'Night (8 PM - 11 PM)', kn: 'ರಾತ್ರಿ (8 - 11)' },
    'all': { en: 'All Day', kn: 'ದಿನವಿಡೀ' },
  };
  return labels[timeSlot][language];
};
