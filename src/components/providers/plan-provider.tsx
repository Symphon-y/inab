'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  icon: string;
  lastUsedAt: Date | string;
  isDefault: boolean;
}

interface PlanContextType {
  activePlanId: string | null;
  activePlan: Plan | null;
  plans: Plan[];
  setActivePlanId: (planId: string) => Promise<void>;
  refreshPlans: () => Promise<void>;
  loading: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [activePlanId, setActivePlanIdState] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      return [];
    }
  };

  useEffect(() => {
    const initializePlan = async () => {
      // Load from localStorage
      const stored = localStorage.getItem('selectedPlanId');

      // Fetch all plans
      const allPlans = await fetchPlans();

      if (stored && allPlans.find((p: Plan) => p.id === stored)) {
        setActivePlanIdState(stored);
        // Set cookie for server-side
        document.cookie = `planId=${stored}; path=/; max-age=31536000`;
      } else if (allPlans.length > 0) {
        // Auto-select first/default plan
        const defaultPlan = allPlans.find((p: Plan) => p.isDefault) || allPlans[0];
        setActivePlanIdState(defaultPlan.id);
        localStorage.setItem('selectedPlanId', defaultPlan.id);
        document.cookie = `planId=${defaultPlan.id}; path=/; max-age=31536000`;
      }

      setLoading(false);
    };

    initializePlan();
  }, []);

  const setActivePlanId = async (planId: string) => {
    // Update last used timestamp
    await fetch(`/api/plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastUsedAt: new Date().toISOString() }),
    });

    // Update local state
    localStorage.setItem('selectedPlanId', planId);
    setActivePlanIdState(planId);

    // Set cookie for server-side access
    document.cookie = `planId=${planId}; path=/; max-age=31536000`;

    // Refresh the page to load new plan data
    router.refresh();
  };

  const activePlan = plans.find(p => p.id === activePlanId) || null;

  return (
    <PlanContext.Provider value={{
      activePlanId,
      activePlan,
      plans,
      setActivePlanId,
      refreshPlans: fetchPlans,
      loading
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider');
  }
  return context;
}
