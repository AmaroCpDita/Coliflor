// ============================================================
// Coliflor — Auth Context
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, Couple, AppStatus } from '../lib/types';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  couple: Couple | null;
  partner: Profile | null;
  status: AppStatus;
  isMockMode: boolean;
  enableMockMode: () => void;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const MOCK_PROFILE_AMARO: Profile = {
  id: 'mock-user-amaro',
  display_name: 'Amaro',
  couple_id: 'mock-couple-id',
  invite_code: null,
  avatar_emoji: '😊',
  created_at: '2026-05-20T00:00:00Z',
};

export const MOCK_PROFILE_JAVIERA: Profile = {
  id: 'mock-user-javiera',
  display_name: 'Javiera',
  couple_id: 'mock-couple-id',
  invite_code: null,
  avatar_emoji: '💜',
  created_at: '2026-05-20T00:00:00Z',
};

export const MOCK_COUPLE: Couple = {
  id: 'mock-couple-id',
  user1_id: 'mock-user-amaro',
  user2_id: 'mock-user-javiera',
  relationship_start: '2026-05-20',
  current_streak: 17,
  max_streak: 24,
  recoveries_used: 1,
  recoveries_reset_month: '2026-08-01',
  user1_note: 'Toda la vida agradeceré el momento en que llegaste a mi vida y cambiaste todo. Te amo con todo mi ser.',
  user2_note: 'Eres lo mejor que me ha pasado en la vida mi amor, te amo con todo mi corazón.',
  created_at: '2026-05-20T00:00:00Z',
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AppStatus>('loading');
  const [isMockMode, setIsMockMode] = useState(false);

  const enableMockMode = useCallback(() => {
    setIsMockMode(true);
    setUser({ id: 'mock-user-amaro', email: 'amaro@coliflor.app' } as User);
    setProfile(MOCK_PROFILE_AMARO);
    setPartner(MOCK_PROFILE_JAVIERA);
    setCouple(MOCK_COUPLE);
    setStatus('ready');
  }, []);

  const fetchProfile = useCallback(async (u: User): Promise<Profile> => {
    const displayName = u.user_metadata?.display_name || u.email?.split('@')[0] || 'Usuario';
    const fallback: Profile = {
      id: u.id,
      display_name: displayName,
      couple_id: null,
      invite_code: null,
      avatar_emoji: '😊',
      created_at: new Date().toISOString(),
    };

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (data) return data as Profile;

      const { data: created } = await supabase
        .from('profiles')
        .upsert({ id: u.id, display_name: displayName })
        .select()
        .maybeSingle();

      return (created as Profile) || fallback;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return fallback;
    }
  }, []);

  const fetchCouple = useCallback(async (coupleId: string) => {
    const { data } = await supabase
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .maybeSingle();
    return data as Couple | null;
  }, []);

  const fetchPartner = useCallback(async (coupleId: string, userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('couple_id', coupleId)
      .neq('id', userId)
      .maybeSingle();
    return data as Profile | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const prof = await fetchProfile(user);
    setProfile(prof);

    if (prof?.couple_id) {
      const [coupleData, partnerData] = await Promise.all([
        fetchCouple(prof.couple_id),
        fetchPartner(prof.couple_id, user.id),
      ]);
      setCouple(coupleData);
      setPartner(partnerData);
    } else {
      setCouple(null);
      setPartner(null);
    }
    setStatus('ready');
  }, [user, fetchProfile, fetchCouple, fetchPartner]);

  // Initial auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) setStatus('unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
        setCouple(null);
        setPartner(null);
        setStatus('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, [user, refreshProfile]);

  // Subscribe to couple realtime updates
  useEffect(() => {
    if (!couple) return;

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${couple.id}` },
        (payload) => {
          if (payload.new) {
            setCouple(payload.new as Couple);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    setIsMockMode(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, couple, partner, status, isMockMode, enableMockMode, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
