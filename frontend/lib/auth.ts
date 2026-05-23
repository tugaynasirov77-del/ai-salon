'use client';

import { create } from 'zustand';
import { httpGet, httpPost, TOKEN_KEY } from './http';
import type { ISalon, NicheKey } from '@shared/types';

export interface IUser {
  id: string;
  email: string;
  salonId: string;
  createdAt?: string;
}

export interface IAuthState {
  user: IUser | null;
  salon: ISalon | null;
  loaded: boolean;
  setSession: (data: { user: IUser; salon?: ISalon | null }) => void;
  clear: () => void;
}

export const useAuthStore = create<IAuthState>((set) => ({
  user: null,
  salon: null,
  loaded: false,
  setSession: ({ user, salon }) => set({ user, salon: salon ?? null, loaded: true }),
  clear: () => set({ user: null, salon: null, loaded: true }),
}));

// ============================================================
// API auth-функции
// ============================================================

export interface RegisterPayload {
  email: string;
  password: string;
  salonName: string;
  ownerName: string;
  phone: string;
  niche: NicheKey;
  city?: string;
  address?: string;
}

export async function apiRegister(payload: RegisterPayload): Promise<{ token: string; user: IUser; salon: ISalon }> {
  const data = await httpPost<{ token: string; user: IUser; salon: ISalon }>('/api/auth/register', payload);
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: IUser }> {
  const data = await httpPost<{ token: string; user: IUser }>('/api/auth/login', { email, password });
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function apiMe(): Promise<{ user: IUser; salon: ISalon }> {
  return httpGet<{ user: IUser; salon: ISalon }>('/api/auth/me');
}

export function apiLogout() {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export async function apiChangePassword(oldPassword: string, newPassword: string): Promise<{ ok: boolean }> {
  return httpPost<{ ok: boolean }>('/api/auth/change-password', { oldPassword, newPassword });
}

// Удобно: есть ли токен (синхронно)
export function hasToken(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(TOKEN_KEY);
}
