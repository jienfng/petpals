// app/(main)/pet/vet-info/[id].jsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Icon from '../../../../assets/icons';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import { theme } from '../../../../constants/theme';
import { hp, wp } from '../../../../helpers/common';
import { supabase } from '../../../../lib/supabase';

const READABLE = {
  text: '#111827',
  gray: '#6B7280',
  line: '#E5E7EB',
  light: '#F3F4F6',
  primary: '#22C55E',
};

async function getVetInfo(petId) {
  // Adjust table/columns if yours differ
  return await supabase
    .from('pet_vet')
    .select('*')
    .eq('pet_id', petId)
    .single();
}

async function upsertVetInfo(petId, payload) {
  // Upsert by pet_id
  const { data, error } = await supabase
    .from('pet_vet')
    .upsert({ pet_id: petId, ...payload }, { onConflict: 'pet_id' })
    .select()
    .single();
  return { data, error };
}

export default function VetInfo() {
  const { id } = useLocalSearchParams(); // pet_id
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [local, setLocal] = useState({
    clinic_name: '',
    vet_name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const onChange = (k, v) => setLocal((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await getVetInfo(id);
      if (!mounted) return;
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = No rows found; treat as empty form
        console.log('getVetInfo error:', error.message || error);
      }
      if (data) {
        setLocal({
          clinic_name: data.clinic_name || '',
          vet_name: data.vet_name || '',
          phone: data.phone || '',
          address: data.address || '',
          notes: data.notes || '',
        });
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  const canSave = isEditing && !saving;

  const onSave = async () => {
    if (!isEditing) return;
    setSaving(true);
    try {
      const payload = {
        clinic_name: local.clinic_name.trim() || null,
        vet_name: local.vet_name.trim() || null,
        phone: local.phone.trim() || null,
        address: local.address.trim() || null,
        notes: local.notes.trim() || null,
      };
      const { data, error } = await upsertVetInfo(id, payload);
      if (error) throw error;

      setIsEditing(false);
      Alert.alert('Saved', 'Vet information was successfully updated.');
    } catch (e) {
      console.log('save vet error:', e?.message || e);
      Alert.alert('Update failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper bg="white">
        <View style={styles.centerFill}><ActivityIndicator /></View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="white">
      <ScrollView contentContainerStyle={styles.container}>
        {/* top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Icon name="chevron-left" size={hp(3)} color={READABLE.text} />
          </Pressable>

          <Text style={styles.title}>Vet Information</Text>

          {canSave ? (
            <Pressable onPress={onSave} hitSlop={10}>
              <Icon name="save" size={hp(2.4)} color={READABLE.text} />
            </Pressable>
          ) : (
            <View style={{ width: hp(2.4) }} />
          )}
        </View>

        {/* edit pill */}
        <View style={styles.editRow}>
          <Pressable
            onPress={() => setIsEditing((v) => !v)}
            style={[styles.editPill, isEditing && { backgroundColor: READABLE.text }]}
            hitSlop={10}
          >
            <Text style={[styles.editPillText, isEditing && { color: '#fff' }]}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        </View>

        {/* card */}
        <View style={styles.card}>
          <Field
            label="Clinic Name"
            value={local.clinic_name}
            onChangeText={(t) => onChange('clinic_name', t)}
            editable={isEditing}
          />
          <Field
            label="Vet Name"
            value={local.vet_name}
            onChangeText={(t) => onChange('vet_name', t)}
            editable={isEditing}
          />
          <Field
            label="Phone"
            value={local.phone}
            onChangeText={(t) => onChange('phone', t)}
            editable={isEditing}
            keyboardType="phone-pad"
          />
          <Field
            label="Address"
            value={local.address}
            onChangeText={(t) => onChange('address', t)}
            editable={isEditing}
            multiline
            height={hp(10)}
          />
          <Field
            label="Notes"
            value={local.notes}
            onChangeText={(t) => onChange('notes', t)}
            editable={isEditing}
            multiline
            height={hp(10)}
          />
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

  editRow: { paddingHorizontal: wp(4), marginTop: hp(0.5) },
  editPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: READABLE.text,
    backgroundColor: '#fff',
  },
  editPillText: { color: READABLE.text, fontWeight: '700' },

  card: {
    marginTop: hp(1.4),
    marginHorizontal: wp(4),
    borderWidth: 1,
    borderColor: READABLE.line,
    borderRadius: 14,
    backgroundColor: READABLE.light,
    padding: 12,
  },

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
});
