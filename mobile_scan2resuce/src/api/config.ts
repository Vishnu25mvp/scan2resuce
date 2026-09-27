const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlashes(
  process.env.EXPO_PUBLIC_API_URL || 'https://genome-patent-impact-pro.trycloudflare.com/api',
);

export const PUBLIC_CARD_BASE_URL = trimTrailingSlashes(
  process.env.EXPO_PUBLIC_PUBLIC_CARD_BASE_URL || 'https://symbol-prepare-drugs-receive.trycloudflare.com',
);

const encode = (value: string) => encodeURIComponent(value);

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/me',
  },
  contacts: {
    list: '/contacts',
    byId: (id: string) => `/contacts/${encode(id)}`,
  },
  publicEmergencyData: (qrId: string) => `/public/emergency/${encode(qrId)}`,
  hospitals: {
    all: '/hospitals/all',
    nearby: (latitude: number, longitude: number) => (
      `/hospitals/nearby?latitude=${latitude}&longitude=${longitude}`
    ),
  },
  ambulances: {
    nearby: (latitude: number, longitude: number) => (
      `/ambulances/nearby?latitude=${latitude}&longitude=${longitude}`
    ),
  },
  orders: {
    mine: '/orders/mine',
    create: '/orders',
  },
  alerts: '/alerts',
} as const;

export const getPublicCardUrl = (qrId: string) => (
  PUBLIC_CARD_BASE_URL
    ? `${PUBLIC_CARD_BASE_URL}/emergency/${encode(qrId)}`
    : null
);
