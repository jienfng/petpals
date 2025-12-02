// services/petEventsService.js
import { supabase } from '../lib/supabase';

// Return events for a pet in [fromISO, toISO)
export const listPetEvents = async ({ petId, fromISO, toISO }) => {
  const { data, error } = await supabase
    .from('pet_events')
    .select('*')
    .eq('pet_id', petId)
    .gte('start_at', fromISO)
    .lt('start_at', toISO)
    .order('start_at', { ascending: true });

  return { data, error };
};

export const createPetEvent = async (payload) => {
  // payload should include: owner_id, pet_id, title, description, type, start_at, end_at, all_day, vet_contact_id, reminder_minutes, external_source
  const { data, error } = await supabase
    .from('pet_events')
    .insert(payload)
    .select()
    .single();

  return { data, error };
};

export const updatePetEvent = async (pet_event_id, updates) => {
  const { data, error } = await supabase
    .from('pet_events')
    .update(updates)
    .eq('pet_event_id', pet_event_id)
    .select()
    .single();

  return { data, error };
};

export const deletePetEvent = async (pet_event_id) => {
  const { error } = await supabase
    .from('pet_events')
    .delete()
    .eq('pet_event_id', pet_event_id);

  return { error };
};
