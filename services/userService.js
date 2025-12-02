// services/userService.js
import { supabase } from '../lib/supabase';

function ok(data)   { return { success: true, data,  msg: null  }; }
function err(msg,e){ return { success: false, data: null, msg: msg || e?.message || 'Error' }; }

/** Get a single user's public row by id */
export async function getUserData(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return err('Failed to fetch user', error);
    return ok(data);
  } catch (e) {
    return err('Unexpected error while fetching user', e);
  }
}

/** Update a user's profile (only send fields you want to change) */
export async function updateUserData(userId, updates) {
  try {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) return err('Failed to update user', error);
    return ok(data);
  } catch (e) {
    return err('Unexpected error while updating user', e);
  }
}

/** Convenience: upsert if the row might not exist yet */
export async function upsertUserData(row) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) return err('Failed to upsert user', error);
    return ok(data);
  } catch (e) {
    return err('Unexpected error while upserting user', e);
  }
}

/** Optional: find by username (for mentions/search) */
export async function findUserByUsername(username) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username);

    if (error) return err('Failed to search user', error);
    return ok(data || []);
  } catch (e) {
    return err('Unexpected error while searching user', e);
  }
}
