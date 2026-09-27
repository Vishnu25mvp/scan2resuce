import { createContext, useContext, useEffect, useState } from 'react';

import { api, type AuthResponse, type UserProfile } from '@/api/client';
import { clearSession, readSession, writeSession } from '@/auth/session-storage';

export type AuthSession = {
  token: string;
  user: UserProfile;
};

type SessionContextValue = {
  session: AuthSession | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (user: Parameters<typeof api.register>[0]) => Promise<void>;
  updateUser: (user: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function normalizeResponse(response: AuthResponse): AuthSession {
  const user = response.user;
  return {
    token: response.token,
    user: {
      ...user,
      qrId: user.qrId || user.id || user._id || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      email: user.email || '',
      bloodGroup: user.bloodGroup || '',
      allergies: user.allergies || '',
      medicalConditions: user.medicalConditions || '',
    },
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readSession()
      .then((stored) => {
        if (!active || !stored) return;
        try {
          const parsed = JSON.parse(stored) as AuthSession;
          if (parsed.token && parsed.user?.qrId) setSession(parsed);
        } catch {
          return clearSession();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveResponse(response: AuthResponse) {
    const nextSession = normalizeResponse(response);
    await writeSession(JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function signIn(identifier: string, password: string) {
    await saveResponse(await api.login(identifier, password));
  }

  async function signUp(user: Parameters<typeof api.register>[0]) {
    await saveResponse(await api.register(user));
  }

  async function updateUser(user: UserProfile) {
    if (!session) return;
    const nextSession = { ...session, user: { ...session.user, ...user } };
    await writeSession(JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function signOut() {
    await clearSession();
    setSession(null);
  }

  return (
    <SessionContext.Provider value={{ session, loading, signIn, signUp, updateUser, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}