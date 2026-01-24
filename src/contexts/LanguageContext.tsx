import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'kn';

interface Translations {
  [key: string]: {
    en: string;
    kn: string;
  };
}

export const translations: Translations = {
  // Auth
  welcome: { en: 'Welcome to', kn: 'ಸ್ವಾಗತ' },
  login: { en: 'Login', kn: 'ಲಾಗಿನ್' },
  createAccount: { en: 'Create Account', kn: 'ಖಾತೆ ರಚಿಸಿ' },
  email: { en: 'Email', kn: 'ಇಮೇಲ್' },
  password: { en: 'Password', kn: 'ಪಾಸ್‌ವರ್ಡ್' },
  confirmPassword: { en: 'Confirm Password', kn: 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ' },
  passwordMismatch: { en: 'Passwords do not match', kn: 'ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ' },
  wrongPassword: { en: 'Wrong password for this email', kn: 'ಈ ಇಮೇಲ್‌ಗೆ ತಪ್ಪಾದ ಪಾಸ್‌ವರ್ಡ್' },
  forgotPassword: { en: 'Forgot password? Create a new account', kn: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ? ಹೊಸ ಖಾತೆ ರಚಿಸಿ' },
  logout: { en: 'Logout', kn: 'ಲಾಗ್ಔಟ್' },
  
  // Menu
  menu: { en: 'Menu', kn: 'ಮೆನು' },
  searchItems: { en: 'Search items...', kn: 'ಐಟಂಗಳನ್ನು ಹುಡುಕಿ...' },
  morning: { en: 'Morning', kn: 'ಬೆಳಿಗ್ಗೆ' },
  afternoon: { en: 'Afternoon', kn: 'ಮಧ್ಯಾಹ್ನ' },
  evening: { en: 'Evening', kn: 'ಸಂಜೆ' },
  night: { en: 'Night', kn: 'ರಾತ್ರಿ' },
  southIndian: { en: 'South Indian', kn: 'ದಕ್ಷಿಣ ಭಾರತೀಯ' },
  northIndian: { en: 'North Indian', kn: 'ಉತ್ತರ ಭಾರತೀಯ' },
  chinese: { en: 'Chinese', kn: 'ಚೈನೀಸ್' },
  tandoor: { en: 'Tandoor', kn: 'ತಂದೂರ್' },
  all: { en: 'All', kn: 'ಎಲ್ಲಾ' },
  
  // Cart
  cart: { en: 'Cart', kn: 'ಕಾರ್ಟ್' },
  addToCart: { en: 'Add', kn: 'ಸೇರಿಸಿ' },
  removeFromCart: { en: 'Remove', kn: 'ತೆಗೆದುಹಾಕಿ' },
  emptyCart: { en: 'Your cart is empty', kn: 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ' },
  total: { en: 'Total', kn: 'ಒಟ್ಟು' },
  items: { en: 'items', kn: 'ಐಟಂಗಳು' },
  
  // Order
  proceedOrder: { en: 'Proceed Order', kn: 'ಆರ್ಡರ್ ಮುಂದುವರಿಸಿ' },
  confirmOrder: { en: 'Confirm Order', kn: 'ಆರ್ಡರ್ ದೃಢೀಕರಿಸಿ' },
  customerName: { en: 'Customer Name', kn: 'ಗ್ರಾಹಕರ ಹೆಸರು' },
  phoneNumber: { en: 'Phone Number', kn: 'ಫೋನ್ ಸಂಖ್ಯೆ' },
  tableNumber: { en: 'Table Number', kn: 'ಟೇಬಲ್ ಸಂಖ್ಯೆ' },
  orderSummary: { en: 'Order Summary', kn: 'ಆರ್ಡರ್ ಸಾರಾಂಶ' },
  edit: { en: 'Edit', kn: 'ಸಂಪಾದಿಸಿ' },
  
  // Status
  orderStatus: { en: 'Order Status', kn: 'ಆರ್ಡರ್ ಸ್ಥಿತಿ' },
  waitingConfirmation: { en: 'Waiting for confirmation', kn: 'ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ' },
  orderConfirmed: { en: 'Your order has been confirmed', kn: 'ನಿಮ್ಮ ಆರ್ಡರ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ' },
  pending: { en: 'Pending', kn: 'ಬಾಕಿ' },
  confirmed: { en: 'Confirmed', kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ' },
  
  // Payment
  payment: { en: 'Payment', kn: 'ಪಾವತಿ' },
  paymentOptions: { en: 'Payment Options', kn: 'ಪಾವತಿ ಆಯ್ಕೆಗಳು' },
  cash: { en: 'Cash', kn: 'ನಗದು' },
  onlinePayment: { en: 'Online Payment', kn: 'ಆನ್‌ಲೈನ್ ಪಾವತಿ' },
  notPaid: { en: 'Not Paid', kn: 'ಪಾವತಿಸಿಲ್ಲ' },
  paid: { en: 'Paid', kn: 'ಪಾವತಿಸಲಾಗಿದೆ' },
  
  // Manager
  managerDashboard: { en: 'Manager Dashboard', kn: 'ಮ್ಯಾನೇಜರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  allOrders: { en: 'All Orders', kn: 'ಎಲ್ಲಾ ಆರ್ಡರ್‌ಗಳು' },
  printBill: { en: 'Print Bill', kn: 'ಬಿಲ್ ಮುದ್ರಿಸಿ' },
  noOrders: { en: 'No orders yet', kn: 'ಇನ್ನೂ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ' },
  
  // General
  enterTableNumber: { en: 'Enter your table number', kn: 'ನಿಮ್ಮ ಟೇಬಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' },
  save: { en: 'Save', kn: 'ಉಳಿಸಿ' },
  cancel: { en: 'Cancel', kn: 'ರದ್ದುಮಾಡಿ' },
  back: { en: 'Back', kn: 'ಹಿಂದೆ' },
  continue: { en: 'Continue', kn: 'ಮುಂದುವರಿಸಿ' },
  quantity: { en: 'Qty', kn: 'ಪ್ರಮಾಣ' },
  price: { en: 'Price', kn: 'ಬೆಲೆ' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
