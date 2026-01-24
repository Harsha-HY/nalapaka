import { useState, useEffect } from 'react';

const TABLE_NUMBER_KEY = 'nalapaka_table_number';

export function useTableNumber() {
  const [tableNumber, setTableNumber] = useState<string>('');
  const [isTableSet, setIsTableSet] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(TABLE_NUMBER_KEY);
    if (stored) {
      setTableNumber(stored);
      setIsTableSet(true);
    }
  }, []);

  const saveTableNumber = (number: string) => {
    sessionStorage.setItem(TABLE_NUMBER_KEY, number);
    setTableNumber(number);
    setIsTableSet(true);
  };

  const clearTableNumber = () => {
    sessionStorage.removeItem(TABLE_NUMBER_KEY);
    setTableNumber('');
    setIsTableSet(false);
  };

  return {
    tableNumber,
    isTableSet,
    saveTableNumber,
    clearTableNumber,
  };
}
