import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { attemptAutoLogin } from '@/lib/secureAuth';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Vérifier s'il y a déjà une session active
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!isMounted) return;

        // 2. Si pas de session, tenter l'auto-login
        if (!initialSession) {
          console.log('🔄 Pas de session active, tentative auto-login...');
          const autoLoginSuccess = await attemptAutoLogin();

          if (autoLoginSuccess) {
            // Re-récupérer la session après auto-login
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (!isMounted) return;

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user?.id) {
              const profileData = await fetchProfile(newSession.user.id);
              if (isMounted) {
                setProfile(profileData);
              }
            }
            setLoading(false);
            return;
          } else {
            console.log('⚠️ Auto-login échoué ou désactivé');
          }
        }

        // 3. Session existante ou auto-login échoué
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Fetch profile if user exists
        if (initialSession?.user?.id) {
          const profileData = await fetchProfile(initialSession.user.id);
          if (isMounted) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Fetch profile on sign in, clear on sign out
      if (event === 'SIGNED_IN' && newSession?.user?.id) {
        const profileData = await fetchProfile(newSession.user.id);
        if (isMounted) {
          setProfile(profileData);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      // Supprimer les credentials sauvegardés
      const { clearCredentials } = await import('@/lib/secureAuth');
      await clearCredentials();

      // Déconnexion Supabase
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      console.log('✅ Déconnexion complète');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    signOut,
    refreshProfile,
  }), [user, session, profile, loading, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
