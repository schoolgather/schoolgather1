import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

import { supabase, getSupabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

const loadAccount = async (authUser) => {
  const { data: profile, error } = await getSupabase()
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', authUser.id)
    .maybeSingle();
  if (error) throw error;
  return {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? '',
    full_name: profile?.full_name ?? authUser.user_metadata?.full_name ?? '',
    role: profile?.role ?? 'user',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const applySession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setAuthError(null);
      return;
    }
    try {
      setUser(await loadAccount(session.user));
      setAuthError(null);
    } catch (error) {
      console.error('Failed to load account:', error);
      setUser(null);
      setAuthError({ type: 'unknown', message: error.message || 'Failed to load your account' });
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        await applySession(data.session);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [applySession]);

  useEffect(() => {
    checkUserAuth();
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        await applySession(session);
      })();
    });
    return () => subscription.unsubscribe();
  }, [checkUserAuth, applySession]);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    if (supabase) await supabase.auth.signOut();
    if (shouldRedirect) window.location.href = '/';
  };

  const navigateToLogin = () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = '/login?returnTo=' + encodeURIComponent(returnTo);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
