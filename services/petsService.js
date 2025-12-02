// services/petsService.js
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

// List only the current user's pets (RLS-safe), order by name
export const listPetsByOwner = async (ownerId) => {
  return await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', ownerId)
    .order('name', { ascending: true }); // safe if you don't have created_at
};

// (kept) get one pet by PK
export const getPet = async (petId) => {
  return await supabase.from('pets').select('*').eq('pet_id', petId).single();
};

// (kept) create a pet
export const createPet = async (payload) => {
  const record = { pet_id: uuidv4(), ...payload };
  const { data, error } = await supabase.from('pets').insert(record).select().single();
  return { data, error };
};
