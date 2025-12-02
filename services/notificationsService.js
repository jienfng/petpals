// services/notificationsService.js
import { supabase } from '../lib/supabase';

// List notifications for current user, excluding chat
export const listNotifications = async ({ limit = 30, cursor } = {}) => {
  let q = supabase
    .from('notifications')
    .select('*')
    .neq('type', 'chat')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) q = q.lt('created_at', cursor); // keyset pagination
  return await q;
};

// Mark one as read
export const markRead = async (notification_id) => {
  return await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('notification_id', notification_id)
    .select()
    .single();
};

// Mark all unread as read
export const markAllRead = async () => {
  return await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
};

// Create a generic (non-chat) notification
export const sendNotification = async ({
  sender_id,
  receiver_id,
  type = 'system',
  title,
  body,
  payload = null,
  entity_table = null,
  entity_id = null,
  pet_event_id = null,
  priority = 0,
}) => {
  return await supabase
    .from('notifications')
    .insert({
      sender_id,
      receiver_id,
      type,
      title,
      body,
      payload,
      entity_table,
      entity_id,
      pet_event_id,
      priority,
    })
    .select()
    .single();
};

// ---- Calendar-specific helpers ----

// Remove existing event reminder notifications (avoid duplicates)
export const deleteEventNotifications = async (pet_event_id) => {
  return await supabase
    .from('notifications')
    .delete()
    .eq('pet_event_id', pet_event_id)
    .eq('type', 'event_reminder');
};

// Insert an event reminder notification
export const createEventReminderNotification = async ({
  sender_id,
  receiver_id,
  pet_event_id,
  pet_id,
  title,
  body,
  startISO,
}) => {
  return await supabase
    .from('notifications')
    .insert({
      sender_id,
      receiver_id,
      type: 'event_reminder',
      title,
      body,
      pet_event_id,
      payload: { screen: 'calendar', pet_id, date: startISO },
    })
    .select()
    .single();
};
