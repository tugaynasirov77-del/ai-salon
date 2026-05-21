'use client';

import { create } from 'zustand';
import type { ISalon, IClient, IAppointment, NicheKey } from '@shared/types';

interface OnboardingBusinessData {
  name?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  scheduleWeekdays?: { from: string; to: string };
  scheduleWeekend?: { from: string; to: string; closed?: boolean };
  priceList?: string;
  masters?: string[];
  telegramBotUrl?: string;
  telegramConnected?: boolean;
}

interface AppState {
  salon: ISalon | null;
  setSalon: (salon: ISalon | null) => void;

  clients: IClient[];
  setClients: (clients: IClient[]) => void;

  appointments: IAppointment[];
  setAppointments: (appointments: IAppointment[]) => void;

  onboarding: {
    step: number;
    niche: NicheKey | null;
    businessData: OnboardingBusinessData;
  };
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  setNiche: (niche: NicheKey) => void;
  setBusinessData: (data: Partial<OnboardingBusinessData>) => void;
  resetOnboarding: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  salon: null,
  setSalon: (salon) => set({ salon }),

  clients: [],
  setClients: (clients) => set({ clients }),

  appointments: [],
  setAppointments: (appointments) => set({ appointments }),

  onboarding: {
    step: 1,
    niche: null,
    businessData: {},
  },
  nextStep: () =>
    set((s) => ({ onboarding: { ...s.onboarding, step: Math.min(4, s.onboarding.step + 1) } })),
  prevStep: () =>
    set((s) => ({ onboarding: { ...s.onboarding, step: Math.max(1, s.onboarding.step - 1) } })),
  setStep: (step) => set((s) => ({ onboarding: { ...s.onboarding, step } })),
  setNiche: (niche) => set((s) => ({ onboarding: { ...s.onboarding, niche } })),
  setBusinessData: (data) =>
    set((s) => ({
      onboarding: { ...s.onboarding, businessData: { ...s.onboarding.businessData, ...data } },
    })),
  resetOnboarding: () =>
    set({ onboarding: { step: 1, niche: null, businessData: {} } }),
}));
