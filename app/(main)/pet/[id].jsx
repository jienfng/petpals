// app/(main)/pet/[id].jsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import Icon from '../../../assets/icons';
import Avatar from '../../../components/Avatar';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { theme } from '../../../constants/theme';
import { hp, wp } from '../../../helpers/common';
import { getPet, updatePet } from '../../../services/petsService';

const READABLE = {
  text: '#111827',
  gray: '#6B7280',
  line: '#E5E7EB',
  light: '#F3F4F6',
  primary: '#22C55E',
};

export default function PetDetail() {
  const { id } = useLocalSearchParams(); // pet_id
  const router = useRouter();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [available, setAvailable] = useState(true); // local-only for now

  const [local, setLocal] = useState({
    name: '',
    species: '',
    breed: '',
    gender: '',
    birthdate: '',
    weight: '',
    color: '',
    microchip: '',
    avatar_url: '',
    notes: '',
  });

  const onChange = (k, v) => setLocal((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await getPet(id);
      if (!mounted) return;
      if (error) {
        console.log('load pet error:', error.message || error);
        setPet(null);
      } else {
        setPet(data);
        setLocal({
          name: data.name || '',
          species: data.species || '',
          breed: data.breed || '',
          gender: data.gender || '',
          birthdate: data.birthdate || '',
          weight: data.weight?.toString?.() || '',
          color: data.color || '',
          microchip: data.microchip || '',
          avatar_url: data.avatar_url || '',
          notes: 'notes' in data ? (data.notes || '') : '',
        });
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name: local.name.trim(),
        species: local.species.trim() || null,
        breed: local.breed.trim() || null,
        gender: local.gender.trim() || null,
        birthdate: local.birthdate?.trim() || null,
        weight: local.weight !== '' ? Number(local.weight) : null,
        color: local.color.trim() || null,
        microchip: local.microchip.trim() || null,
        avatar_url: local.avatar_url?.trim() || null,
      };
      if (pet && 'notes' in pet) {
        payload.notes = local.notes?.trim() || null;
      }

      const { data, error } = await updatePet(id, payload);
      if (error) throw error;

      setPet(data);
      setIsEditing(false);
      Alert.alert('Saved', 'Pet details were successfully updated.');
    } catch (e) {
      console.log('update pet error:', e?.message || e);
      Alert.alert('Update failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper bg="white">
        <View style={styles.centerFill}>
          <ActivityIndicator />
        </View>
      </ScreenWrapper>
    );
  }

  if (!pet) {
    return (
      <ScreenWrapper bg="white">
        <View style={styles.centerFill}>
          <Text style={{ color: READABLE.text, fontSize: hp(2) }}>Pet not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="white">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* top bar (no save icon on the right anymore) */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Icon name="chevron-left" size={hp(3)} color={READABLE.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {local.name || pet.name || 'Pet'}
          </Text>
          <View style={{ width: hp(2.4) }} />
        </View>

        {/* banner + avatar + center edit/save bar + availability */}
        <View style={styles.headerWrap}>
          <Image
            source={{ uri: pet.banner_url || 'https://picsum.photos/900/300' }}
            style={styles.banner}
            resizeMode="cover"
          />

          <View style={styles.headerRow}>
            <Avatar
              uri={local.avatar_url || pet.avatar_url}
              size={hp(10)}
              rounded={theme.radius.lg}
              style={{ borderWidth: 2, marginTop: -hp(5) }}
            />

            {/* Middle: bar button that toggles Edit/Save */}
            <View style={styles.midControls}>
              <Pressable
                onPress={isEditing ? onSave : () => setIsEditing(true)}
                disabled={saving}
                style={[
                  styles.editBar,
                  isEditing && styles.saveBar,
                ]}
                hitSlop={8}
              >
                <Text style={[styles.editBarText, isEditing && styles.saveBarText]}>
                  {isEditing ? (saving ? 'Saving…' : 'Save') : 'Edit'}
                </Text>
              </Pressable>
            </View>

            {/* Right: Availability */}
            <View style={styles.availability}>
              <Text style={styles.availabilityText}>Availability</Text>
              <Switch value={available} onValueChange={setAvailable} />
            </View>
          </View>
        </View>

        {/* information card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Information</Text>

          <Field
            label="Name"
            value={local.name}
            onChangeText={(t) => onChange('name', t)}
            editable={isEditing}
          />

          <View style={styles.row2}>
            <Field
              style={{ flex: 1 }}
              label="Species"
              value={local.species}
              onChangeText={(t) => onChange('species', t)}
              editable={isEditing}
              placeholder="Dog / Cat"
            />
            <View style={{ width: wp(3) }} />
            <Field
              style={{ flex: 1 }}
              label="Breed"
              value={local.breed}
              onChangeText={(t) => onChange('breed', t)}
              editable={isEditing}
              placeholder="Shiba Inu"
            />
          </View>

          <View style={styles.row2}>
            <Field
              style={{ width: wp(28) }}
              label="Gender"
              value={local.gender}
              onChangeText={(t) => onChange('gender', t)}
              editable={isEditing}
              placeholder="male / female"
            />
            <View style={{ width: wp(3) }} />
            <Field
              style={{ width: wp(22) }}
              label="Weight (kg)"
              value={local.weight}
              onChangeText={(t) => onChange('weight', t)}
              editable={isEditing}
              keyboardType="decimal-pad"
              placeholder="4.0"
            />
            <View style={{ width: wp(3) }} />
            <Field
              style={{ flex: 1 }}
              label="Color"
              value={local.color}
              onChangeText={(t) => onChange('color', t)}
              editable={isEditing}
              placeholder="White"
            />
          </View>

          <View style={styles.row2}>
            <Field
              style={{ flex: 1 }}
              label="Microchip"
              value={local.microchip}
              onChangeText={(t) => onChange('microchip', t)}
              editable={isEditing}
              placeholder="Optional"
            />
            <View style={{ width: wp(3) }} />
            <Field
              style={{ flex: 1 }}
              label="Birthdate (YYYY-MM-DD)"
              value={local.birthdate}
              onChangeText={(t) => onChange('birthdate', t)}
              editable={isEditing}
              placeholder="2021-06-30"
            />
          </View>

          {'notes' in pet && (
            <Field
              label="Extra Notes"
              value={local.notes}
              onChangeText={(t) => onChange('notes', t)}
              editable={isEditing}
              multiline
              height={hp(10)}
              placeholder="Special care, behavior, preferences…"
            />
          )}
        </View>

        {/* actions row */}
        <View style={styles.actions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '(main)/pet/calendar/[id]', params: { id } })}
          >
            <Icon name="calendar" size={hp(2.2)} color={READABLE.text} />
            <Text style={styles.actionText}>Calendar</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '(main)/pet/vet-info/[id]', params: { id } })}
          >
            <Icon name="activity" size={hp(2.2)} color={READABLE.text} />
            <Text style={styles.actionText}>Vet Information</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function Field({
  label,
  value,
  onChangeText,
  editable,
  style,
  multiline = false,
  height,
  placeholder,
  keyboardType,
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={READABLE.gray}
        style={[
          styles.input,
          multiline && { height: height ?? hp(10), textAlignVertical: 'top' },
          !editable && { backgroundColor: '#fff' },
        ]}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: hp(2) },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(1),
  },
  title: { fontSize: hp(2.4), color: READABLE.text, fontWeight: theme.fonts.bold },

  headerWrap: {},
  banner: { width: '100%', height: hp(18), backgroundColor: READABLE.light },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    marginTop: hp(1),
  },

  // middle bar button container
  midControls: {
    flex: 1,
    alignItems: 'center',
  },
  // smaller bar, still a pill
editBar: {
  minWidth: 98,                // was 120
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 6,          // was 10
  paddingHorizontal: 12,       // was 16
  borderRadius: 10,            // was 12
  borderWidth: 1,
  borderColor: READABLE.text,
  backgroundColor: '#fff',
},
editBarText: {                 // slightly smaller text
  color: READABLE.text,
  fontWeight: '700',
  fontSize: hp(1.8),           // was hp(2.0)
},

  saveBar: {
    backgroundColor: READABLE.primary,
    borderColor: READABLE.primary,
  },
  saveBarText: { color: '#fff' },

  availability: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availabilityText: { color: READABLE.text, fontSize: hp(1.8) },

  card: {
    marginTop: hp(1.4),
    marginHorizontal: wp(4),
    borderWidth: 1,
    borderColor: READABLE.line,
    borderRadius: 14,
    backgroundColor: READABLE.light,
    padding: 12,
  },
  sectionTitle: { fontSize: hp(2), fontWeight: theme.fonts.bold, color: READABLE.text, marginBottom: 6 },

  field: { marginBottom: 12 },
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

  row2: { flexDirection: 'row', alignItems: 'flex-start' },

  actions: { flexDirection: 'row', gap: 10, marginTop: hp(1), paddingHorizontal: wp(4) },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: READABLE.line,
    backgroundColor: READABLE.light,
    flex: 1,
  },
  actionText: { color: READABLE.text, fontSize: hp(1.8), fontWeight: theme.fonts.bold },
});
