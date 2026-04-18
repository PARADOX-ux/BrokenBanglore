import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }

    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth actions ────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase is not configured yet. Add your credentials to .env.local to enable Google Sign-In.');
      return { error: 'not_configured' };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  const signInWithEmail = async (email, password) => {
    if (!isSupabaseConfigured()) return { error: { message: 'not_configured' } };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUpWithEmail = async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured()) return { error: { message: 'not_configured' } };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || null,
    avatarUrl: user?.user_metadata?.avatar_url || null,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
