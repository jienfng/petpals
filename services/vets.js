import { supabase } from '../lib/supabase';

export async function listVets() {
  const { data, error } = await supabase
    .from('vet_contacts')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
  return { data, error };
}

export async function upsertVet(contact) {
  if (contact?.id) {
    const { data, error } = await supabase
      .from('vet_contacts')
      .update({
        name: contact.name,
        doctor: contact.doctor ?? null,
        phone: contact.phone ?? null,
        address: contact.address ?? null,
        is_primary: !!contact.is_primary,
        notes: contact.notes ?? null,
      })
      .eq('id', contact.id)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase
    .from('vet_contacts')
    .insert({
      name: contact.name,
      doctor: contact.doctor ?? null,
      phone: contact.phone ?? null,
      address: contact.address ?? null,
      is_primary: !!contact.is_primary,
      notes: contact.notes ?? null,
    })
    .select()
    .single();
  return { data, error };
}
