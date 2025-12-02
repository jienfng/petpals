// contexts/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { AUTO_LOGIN } from '../config/appSettings';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  hydrated: false,
  setAuthUser: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!AUTO_LOGIN) {
          // Force fresh login every launch: clear any persisted session
          await supabase.auth.signOut().catch(() => {});
          if (mounted) setUser(null);
        } else {
          // AUTO_LOGIN = true → restore once if available
          const { data } = await supabase.auth.getSession();
          if (mounted) setUser(data?.session?.user ?? null);
        }

        // IMPORTANT: Always listen so in-app login updates `user`
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
          if (!mounted) return;
          setUser(session?.user ?? null);
        });

        (AuthProvider)._sub = sub; // stash to unsubscribe on unmount
      } finally {
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
      const sub = (AuthProvider)._sub;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const setAuthUser = (u) => setUser(u);

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, hydrated, setAuthUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
