// lib/user.js
import { supabase } from './supabase';

export const getUserData = async (userId) => {
  if (!userId) return { data: null, error: new Error('Missing userId') };
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserData = async (userId, updates) => {
  if (!userId) return { data: null, error: new Error('Missing userId') };
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

export const ensureUserRow = async (authUser) => {
  const userId = authUser?.id;
  if (!userId) return { data: null, error: new Error('Missing auth user') };

  // Try to get
  const { data, error } = await getUserData(userId);
  if (data && !error) return { data, error: null };

  // If missing, insert a minimal row
  const fallbackUsername =
    authUser?.user_metadata?.username ||
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split('@')[0] ||
    'New User';

  const insert = {
    id: userId,
    username: fallbackUsername,
    bio: '',
    avatar_url: null,
  };

  const { data: created, error: insertErr } = await supabase
    .from('users')
    .insert(insert)
    .select()
    .single();

  return { data: created ?? null, error: insertErr ?? null };
};
