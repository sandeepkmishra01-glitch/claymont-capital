import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken, setUnauthorizedHandler } from '../lib/api';
import type { Member } from '../lib/types';

interface SessionValue {
  status: 'loading' | 'signed-out' | 'signed-in';
  member: Member | null;
  signIn: (displayName: string) => Promise<void>;
  rename: (displayName: string) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [member, setMember] = useState<Member | null>(null);
  const [status, setStatus] = useState<SessionValue['status']>(getToken() ? 'loading' : 'signed-out');

  const signOut = useCallback(() => {
    setToken(null);
    setMember(null);
    setStatus('signed-out');
    qc.clear();
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    if (!getToken()) return;
    api.get<{ member: Member }>('/session/me')
      .then(({ member }) => {
        setMember(member);
        setStatus('signed-in');
      })
      .catch(() => setStatus('signed-out'));
  }, [signOut]);

  const signIn = useCallback(async (displayName: string) => {
    const res = await api.post<{ token: string; member: Member }>('/session', { displayName });
    setToken(res.token);
    setMember(res.member);
    setStatus('signed-in');
  }, []);

  const rename = useCallback(async (displayName: string) => {
    const res = await api.patch<{ member: Member }>('/session/me', { displayName });
    setMember(res.member);
    qc.invalidateQueries({ queryKey: ['members'] });
  }, [qc]);

  return (
    <SessionContext.Provider value={{ status, member, signIn, rename, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

export function useMe(): Member {
  const { member } = useSession();
  if (!member) throw new Error('useMe called while signed out');
  return member;
}
