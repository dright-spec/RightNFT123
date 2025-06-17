import { useState, useEffect, useCallback } from "react";

export interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  hasCompletedMarketplace: boolean;
  hasCompletedCreateRight: boolean;
  hasSeenWelcome: boolean;
}

const ONBOARDING_STORAGE_KEY = "dright-onboarding-state";

const defaultState: OnboardingState = {
  isActive: false,
  currentStep: 0,
  hasCompletedMarketplace: false,
  hasCompletedCreateRight: false,
  hasSeenWelcome: false,
};

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => {
    if (typeof window === "undefined") return defaultState;
    
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const startMarketplaceOnboarding = useCallback(() => {
    if (!state.hasCompletedMarketplace) {
      setState(prev => ({
        ...prev,
        isActive: true,
        currentStep: 0,
      }));
    }
  }, [state.hasCompletedMarketplace]);

  const startCreateRightOnboarding = useCallback(() => {
    if (!state.hasCompletedCreateRight) {
      setState(prev => ({
        ...prev,
        isActive: true,
        currentStep: 0,
      }));
    }
  }, [state.hasCompletedCreateRight]);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentStep: 0,
    }));
  }, []);

  const completeMarketplaceOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentStep: 0,
      hasCompletedMarketplace: true,
      hasSeenWelcome: true,
    }));
  }, []);

  const completeCreateRightOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentStep: 0,
      hasCompletedCreateRight: true,
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);

  const shouldShowWelcome = useCallback(() => {
    return !state.hasSeenWelcome && !state.hasCompletedMarketplace;
  }, [state.hasSeenWelcome, state.hasCompletedMarketplace]);

  const markWelcomeSeen = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasSeenWelcome: true,
    }));
  }, []);

  return {
    state,
    startMarketplaceOnboarding,
    startCreateRightOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeMarketplaceOnboarding,
    completeCreateRightOnboarding,
    resetOnboarding,
    shouldShowWelcome,
    markWelcomeSeen,
  };
}