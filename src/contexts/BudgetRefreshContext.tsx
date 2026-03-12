'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface BudgetRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const BudgetRefreshContext = createContext<BudgetRefreshContextType | undefined>(undefined);

export function BudgetRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <BudgetRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </BudgetRefreshContext.Provider>
  );
}

export function useBudgetRefresh() {
  const context = useContext(BudgetRefreshContext);
  if (context === undefined) {
    throw new Error('useBudgetRefresh must be used within BudgetRefreshProvider');
  }
  return context;
}
