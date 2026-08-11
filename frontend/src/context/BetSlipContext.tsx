import React, { createContext, useContext, useState } from 'react';

export interface SelectionItem {
  marketOptionId: string;
  marketId: string;
  matchId: string;
  matchName: string;
  marketName: string;
  label: string;
  odds: number;
}

interface BetSlipContextType {
  items: SelectionItem[];
  stake: number;
  isOpen: boolean;
  addSelection: (item: SelectionItem) => void;
  removeSelection: (optionId: string) => void;
  clearSlip: () => void;
  setStake: (stake: number) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  isOptionSelected: (optionId: string) => boolean;
  totalOdds: number;
  potentialPayout: number;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export const BetSlipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [stake, setStake] = useState<number>(100);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const addSelection = (item: SelectionItem) => {
    setItems((prev) => {
      // Remove any existing selection from the same market
      const filtered = prev.filter((i) => i.marketId !== item.marketId);
      // If clicking the exact same option, just toggle it off
      const isSameOption = prev.some((i) => i.marketOptionId === item.marketOptionId);
      if (isSameOption) return filtered;
      return [...filtered, item];
    });
    setIsOpen(true);
  };

  const removeSelection = (optionId: string) => {
    setItems((prev) => prev.filter((i) => i.marketOptionId !== optionId));
  };

  const clearSlip = () => {
    setItems([]);
  };

  const isOptionSelected = (optionId: string) => {
    return items.some((i) => i.marketOptionId === optionId);
  };

  const totalOdds = Math.round(items.reduce((acc, item) => acc * item.odds, 1) * 100) / 100;
  const potentialPayout = Math.round(stake * totalOdds);

  return (
    <BetSlipContext.Provider
      value={{
        items,
        stake,
        isOpen,
        addSelection,
        removeSelection,
        clearSlip,
        setStake,
        toggleOpen: () => setIsOpen((prev) => !prev),
        setOpen: setIsOpen,
        isOptionSelected,
        totalOdds: items.length > 0 ? totalOdds : 0,
        potentialPayout: items.length > 0 ? potentialPayout : 0,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
};

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) throw new Error('useBetSlip must be used within BetSlipProvider');
  return context;
};
