import { API_BASE_URL, API_ENDPOINTS, getPublicCardUrl } from '@/api/config';

export type UserProfile = {
  _id?: string;
  id?: string;
  qrId: string;
  fullName: string;
  phone: string;
  email: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  publicEmergencyConsent?: boolean;
  vehicle?: VehicleProfile;
  createdAt?: string;
};

export type VehicleProfile = {
  type: string;
  registrationNumber: string;
  makeModel: string;
  color: string;
};

export type EmergencyContact = {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  relation: string;
};

export type VictimInfo = {
  fullName: string;
  phone?: string;
  bloodGroup: string;
  allergies: string | string[];
  medicalConditions: string | string[];
  vehicle?: VehicleProfile;
  emergencyContacts: EmergencyContact[];
};

export type Hospital = {
  _id?: string;
  name?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
};

export type Ambulance = Hospital & {
  provider?: string;
  available?: boolean;
};

export type StickerOrder = {
  _id: string;
  qrId: string;
  placement: 'helmet' | 'windshield' | 'other';
  quantity: number;
  shippingAddress: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  trackingNumber: string;
  dispatchNote: string;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
};

export type AuthResponse = {
  user: UserProfile;
  token: string;
};

type RequestOptions = RequestInit & {
  token?: string;
  debugOtp?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, debugOtp, headers: requestHeaders, ...init } = options;
  const headers = new Headers(requestHeaders);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (debugOtp) headers.set('x-debug-otp', debugOtp);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error('Network error. Check your connection and API URL.');
  }

  if (response.status === 204) return undefined as T;

  const responseText = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = responseText ? JSON.parse(responseText) as Record<string, unknown> : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : `Request failed (${response.status})`);
  }
  return data as T;
}

const jsonBody = (value: unknown) => JSON.stringify(value);

export const api = {
  login(identifier: string, password: string) {
    return request<AuthResponse>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: jsonBody({ identifier, password }),
    });
  },

  register(user: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    bloodGroup: string;
    allergies: string;
    medicalConditions: string;
    publicEmergencyConsent: boolean;
    vehicle: VehicleProfile;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }) {
    return request<AuthResponse>(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: jsonBody(user),
    });
  },

  updateProfile(updates: Partial<UserProfile>, token: string) {
    return request<{ user: UserProfile }>(API_ENDPOINTS.auth.profile, {
      method: 'PATCH',
      token,
      body: jsonBody(updates),
    });
  },

  getContacts(token: string) {
    return request<{ contacts: EmergencyContact[] }>(API_ENDPOINTS.contacts.list, { token });
  },

  addContact(contact: Omit<EmergencyContact, '_id' | 'id'>, token: string) {
    return request<{ contact: EmergencyContact }>(API_ENDPOINTS.contacts.list, {
      method: 'POST',
      token,
      body: jsonBody(contact),
    });
  },

  deleteContact(id: string, token: string) {
    return request<void>(API_ENDPOINTS.contacts.byId(id), {
      method: 'DELETE',
      token,
    });
  },

  getVictimInfo(qrId: string) {
    return request<VictimInfo>(API_ENDPOINTS.publicEmergencyData(qrId));
  },

  getHospitals() {
    return request<Hospital[] | { hospitals: Hospital[] }>(API_ENDPOINTS.hospitals.all);
  },

  getNearbyHospitals(latitude: number, longitude: number) {
    return request<Hospital[]>(API_ENDPOINTS.hospitals.nearby(latitude, longitude));
  },

  getNearbyAmbulances(latitude: number, longitude: number) {
    return request<Ambulance[]>(API_ENDPOINTS.ambulances.nearby(latitude, longitude));
  },

  getMyStickerOrders(token: string) {
    return request<{ orders: StickerOrder[] }>(API_ENDPOINTS.orders.mine, { token });
  },

  createStickerOrder(order: {
    placement: StickerOrder['placement'];
    quantity: number;
    shippingAddress: StickerOrder['shippingAddress'];
  }, token: string) {
    return request<{ order: StickerOrder }>(API_ENDPOINTS.orders.create, {
      method: 'POST',
      token,
      body: jsonBody(order),
    });
  },

  createAlert(payload: {
    qrId: string;
    latitude?: number;
    longitude?: number;
    type: 'call' | 'sms_location' | 'state_helpline';
    emergencyNumber?: string;
    emergencyRegion?: string;
    callerMode?: 'owner' | 'bystander';
  }, token?: string) {
    return request<{ message?: string; nearestHospital?: Hospital | null }>(API_ENDPOINTS.alerts, {
      method: 'POST',
      token,
      body: jsonBody(payload),
    });
  },

  emergencyCardUrl(qrId: string) {
    return getPublicCardUrl(qrId);
  },
};