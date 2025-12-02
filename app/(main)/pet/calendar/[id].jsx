// app/(main)/pet/calendar/[id].jsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import {
  createPetEvent,
  deletePetEvent,
  listPetEvents,
  updatePetEvent,
} from '../../../../services/petEventsService';

import {
  createEventReminderNotification,
  deleteEventNotifications,
} from '../../../../services/notificationsService';


import Icon from '../../../../assets/icons';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { theme } from '../../../../constants/theme';
import { useAuth } from '../../../../contexts/AuthContext';
import { hp, wp } from '../../../../helpers/common';






const READABLE = {
  text: '#111827',
  gray: '#6B7280',
  line: '#E5E7EB',
  light: '#F3F4F6',
  primary: '#22C55E',
};

const fmtDate = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonthPlus1 = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1);

export default function PetCalendar() {
  const { id: petId } = useLocalSearchParams(); // pet_id
  const router = useRouter();
  const { user } = useAuth();

  const [monthAnchor, setMonthAnchor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(fmtDate(new Date()));
  const [events, setEvents] = useState([]); // events for current month
  const [loading, setLoading] = useState(false);

  // modal state (create/edit)
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null); // event object or null
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    all_day: false,
    start_at: new Date(),
    end_at: new Date(Date.now() + 60 * 60 * 1000),
    reminder_minutes: null,
    vet_contact_id: null,
  });

  const setFormField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const loadMonth = async (anchor) => {
    setLoading(true);
    try {
      const fromISO = startOfMonth(anchor).toISOString();
      const toISO = endOfMonthPlus1(anchor).toISOString();
      const { data, error } = await listPetEvents({ petId, fromISO, toISO });
      if (error) throw error;
      setEvents(data || []);
    } catch (e) {
      console.log('listPetEvents error:', e?.message || e);
      Alert.alert('Error', 'Could not load events.');
    } finally {
      setLoading(false);
    }
  };

const formatNotif = (start, allDay) => {
  const d = new Date(start);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    title: allDay ? 'All-day pet event' : 'Upcoming pet event',
    body: allDay ? `${date}` : `${date} • ${time}`,
  };
};

  useEffect(() => {
    loadMonth(monthAnchor);
  }, [petId, monthAnchor]);

  const dayEvents = useMemo(
    () => events.filter((e) => fmtDate(new Date(e.start_at)) === selectedDay),
    [events, selectedDay]
  );

  const openCreate = () => {
    setEditing(null);
    const start = new Date(selectedDay + 'T09:00:00');
    const end = new Date(selectedDay + 'T10:00:00');
    setForm({
      title: '',
      description: '',
      type: '',
      all_day: false,
      start_at: start,
      end_at: end,
      reminder_minutes: null,
      vet_contact_id: null,
    });
    setModalVisible(true);
  };

  const openEdit = (evt) => {
    setEditing(evt);
    setForm({
      title: evt.title || '',
      description: evt.description || '',
      type: evt.type || '',
      all_day: !!evt.all_day,
      start_at: new Date(evt.start_at),
      end_at: new Date(evt.end_at ?? evt.start_at),
      reminder_minutes: evt.reminder_minutes ?? null,
      vet_contact_id: evt.vet_contact_id ?? null,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const saveEvent = async () => {
    try {
      const payload = {
        owner_id: user.id,
        pet_id: petId,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        type: form.type?.trim() || null,
        start_at: form.start_at.toISOString(),
        end_at: form.end_at?.toISOString() ?? form.start_at.toISOString(),
        all_day: !!form.all_day,
        vet_contact_id: form.vet_contact_id ?? null,
        reminder_minutes:
          form.reminder_minutes === '' || form.reminder_minutes == null
            ? null
            : Number(form.reminder_minutes),
        external_source: null,
      };

      if (!payload.title) {
        Alert.alert('Missing title', 'Please enter a title.');
        return;
      }

      let savedEventId;

if (editing) {
  const { data: updated, error } = await updatePetEvent(editing.pet_event_id, payload);
  if (error) throw error;
  savedEventId = updated.pet_event_id;
} else {
  const { data: created, error } = await createPetEvent(payload);
  if (error) throw error;
  savedEventId = created.pet_event_id;
}

// (Re)create the reminder notification for this event (receiver = current user)
try {
  await deleteEventNotifications(savedEventId);
  const { title, body } = formatNotif(payload.start_at, payload.all_day);
  await createEventReminderNotification({
    sender_id: user.id,
    receiver_id: user.id,
    pet_event_id: savedEventId,
    pet_id: petId,
    title,
    body,
    startISO: payload.start_at,
  });
} catch (e) {
  console.log('notification upsert error:', e?.message || e);
}

closeModal();
await loadMonth(monthAnchor);
Alert.alert('Saved', 'Event saved successfully.');

    } catch (e) {
      console.log('save event error:', e?.message || e);
      Alert.alert('Error', 'Could not save event.');
    }
  };

  const deleteEventConfirm = () => {
    if (!editing) return;
    Alert.alert('Delete event?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deletePetEvent(editing.pet_event_id);
          if (error) {
            Alert.alert('Error', 'Failed to delete.');
            return;
          }
          try { await deleteEventNotifications(editing.pet_event_id); } catch {}
          closeModal();
          await loadMonth(monthAnchor);
        },
      },
    ]);
  };

  // ---------------- UI ----------------
  const markedDates = useMemo(() => {
    // mark selected day and days with events (dot)
    const marks = { [selectedDay]: { selected: true, selectedColor: READABLE.primary } };
    for (const e of events) {
      const day = fmtDate(new Date(e.start_at));
      if (!marks[day]) marks[day] = { marked: true };
      else marks[day].marked = true;
    }
    return marks;
  }, [events, selectedDay]);

  return (
    <ScreenWrapper bg="white">
      <SafeAreaView style={{ flex: 1 }}>
        {/* top bar */}
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Icon name="chevron-left" size={hp(3)} color={READABLE.text} />
          </Pressable>
          <Text style={styles.topTitle}>Calendar</Text>
          <Pressable onPress={openCreate} hitSlop={10}>
            <Icon name="plus" size={hp(2.6)} color={READABLE.text} />
          </Pressable>
        </View>

        {/* calendar */}
        <Calendar
          current={monthAnchor}
          markedDates={markedDates}
          onDayPress={(d) => setSelectedDay(d.dateString)}
          onMonthChange={(m) => {
            const next = new Date(m.year, m.month - 1, 1);
            setMonthAnchor(next);
          }}
          theme={{
            todayTextColor: READABLE.primary,
            selectedDayBackgroundColor: READABLE.primary,
            arrowColor: READABLE.text,
            monthTextColor: READABLE.text,
            dayTextColor: READABLE.text,
            textDisabledColor: READABLE.gray,
          }}
          style={{ marginHorizontal: wp(4), borderRadius: 12 }}
        />

        {/* day agenda */}
        <ScrollView
          style={{ flex: 1, marginTop: hp(1) }}
          contentContainerStyle={{ paddingHorizontal: wp(4), paddingBottom: hp(2) }}
        >
          <Text style={styles.dayHeader}>
            {selectedDay}
          </Text>

          {dayEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No events</Text>
              <Text style={styles.emptySub}>Tap + to add one.</Text>
            </View>
          ) : (
            dayEvents.map((evt) => (
              <Pressable
                key={evt.pet_event_id}
                style={styles.eventCard}
                onPress={() => openEdit(evt)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  {!!evt.type && <Text style={styles.eventBadge}>{evt.type}</Text>}
                </View>
                <Text style={styles.eventTime}>
                  {evt.all_day
                    ? 'All day'
                    : `${new Date(evt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(evt.end_at ?? evt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </Text>
                {!!evt.description && (
                  <Text numberOfLines={2} style={styles.eventDesc}>{evt.description}</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>

        {/* modal: create/edit event */}
        <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
          <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.modalTopbar}>
              <Pressable onPress={closeModal} hitSlop={10}>
                <Icon name="x" size={hp(2.6)} color={READABLE.text} />
              </Pressable>
              <Text style={styles.topTitle}>{editing ? 'Edit Event' : 'New Event'}</Text>
              {editing ? (
                <Pressable onPress={deleteEventConfirm} hitSlop={10}>
                  <Icon name="trash-2" size={hp(2.4)} color="#EF4444" />
                </Pressable>
              ) : (
                <View style={{ width: hp(2.6) }} />
              )}
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: wp(4), paddingBottom: hp(2) }}>
              <Field
                label="Title"
                value={form.title}
                onChangeText={(t) => setFormField('title', t)}
                placeholder="e.g., Vet appointment"
              />
              <Field
                label="Type"
                value={form.type}
                onChangeText={(t) => setFormField('type', t)}
                placeholder="appointment / medication / grooming / note …"
              />
              <Field
                label="Description"
                value={form.description}
                onChangeText={(t) => setFormField('description', t)}
                multiline
                height={hp(10)}
                placeholder="Optional details"
              />

              {/* All day */}
              <Row>
                <Text style={styles.label}>All day</Text>
                <Switch
                  value={form.all_day}
                  onValueChange={(v) => setFormField('all_day', v)}
                />
              </Row>

              {/* Start */}
              <Text style={styles.label}>Start</Text>
              <DateInput
                value={form.start_at}
                onChange={(d) => setFormField('start_at', d)}
                mode={form.all_day ? 'date' : 'datetime'}
              />

              {/* End */}
              <Text style={[styles.label, { marginTop: 10 }]}>End</Text>
              <DateInput
                value={form.end_at}
                onChange={(d) => setFormField('end_at', d)}
                mode={form.all_day ? 'date' : 'datetime'}
              />

              <Field
                label="Reminder (minutes before)"
                value={form.reminder_minutes == null ? '' : String(form.reminder_minutes)}
                keyboardType="number-pad"
                onChangeText={(t) => setFormField('reminder_minutes', t.replace(/\D+/g, ''))}
                placeholder="e.g., 30"
              />

              {/* Save button */}
              <Pressable style={styles.primaryBtn} onPress={saveEvent}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false, height, keyboardType }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={READABLE.gray}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          multiline && { height: height ?? hp(10), textAlignVertical: 'top' },
        ]}
      />
    </View>
  );
}

function Row({ children }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>{children}</View>;
}

function DateInput({ value, onChange, mode }) {
  const [show, setShow] = useState(false);
  const onPick = (_, date) => {
    setShow(false);
    if (date) onChange(date);
  };
  return (
    <View>
      <Pressable style={styles.input} onPress={() => setShow(true)}>
        <Text style={{ color: READABLE.text }}>
          {mode === 'date'
            ? value.toDateString()
            : value.toLocaleString()}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode={mode === 'datetime' ? (Platform.OS === 'ios' ? 'datetime' : 'date') : 'date'}
          display="default"
          onChange={onPick}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(0.5),
  },
  topTitle: {
    fontSize: hp(2.4),
    color: READABLE.text,
    fontWeight: theme.fonts.bold,
  },

  dayHeader: {
    fontSize: hp(2.0),
    color: READABLE.text,
    fontWeight: theme.fonts.bold,
    marginBottom: 8,
  },

  emptyBox: { alignItems: 'center', paddingVertical: hp(4) },
  emptyTitle: { color: READABLE.text, fontWeight: theme.fonts.bold, fontSize: hp(2) },
  emptySub: { color: READABLE.gray, marginTop: 4 },

  eventCard: {
    backgroundColor: READABLE.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: READABLE.line,
    padding: 12,
    marginBottom: 10,
  },
  eventTitle: { color: READABLE.text, fontWeight: theme.fonts.bold, fontSize: hp(2) },
  eventBadge: {
    color: READABLE.text,
    borderWidth: 1,
    borderColor: READABLE.line,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: hp(1.6),
  },
  eventTime: { color: READABLE.text, marginTop: 4 },
  eventDesc: { color: READABLE.gray, marginTop: 4 },

  label: { color: READABLE.gray, marginBottom: 6, fontSize: hp(1.7) },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: READABLE.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: READABLE.text,
    fontSize: hp(2.0),
  },

  modalTopbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },

  primaryBtn: {
    marginTop: hp(1),
    backgroundColor: READABLE.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: theme.fonts.bold, fontSize: hp(2) },
});
