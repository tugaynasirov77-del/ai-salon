// Axios-клиент с JWT-интерсептором.
// Используется всеми api-функциями в lib/api.ts и lib/auth.ts.

import axios from 'axios';

export const TOKEN_KEY = 'liva_token';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.ailiva.ru',
});

// Подкладываем Bearer-токен ко всем запросам (на клиенте)
http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 → токен протух, выкидываем на /login
http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register') && path !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// Удобные обёртки — все api-функции бросают Error со строковым сообщением
async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  try {
    const res = await p;
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || 'Ошибка запроса';
    throw new Error(msg);
  }
}

export const httpGet = <T>(url: string, params?: Record<string, any>) =>
  unwrap<T>(http.get(url, { params }));
export const httpPost = <T>(url: string, body?: any) => unwrap<T>(http.post(url, body));
export const httpPut = <T>(url: string, body?: any) => unwrap<T>(http.put(url, body));
export const httpDelete = <T>(url: string) => unwrap<T>(http.delete(url));
