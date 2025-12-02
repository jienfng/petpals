// app/(main)/pet/create.jsx
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../../assets/icons';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { useAuth } from '../../../contexts/AuthContext';
import { hp, wp } from '../../../helpers/common';
import { uploadPetImage } from '../../../services/imageService';
import { createPet } from '../../../services/petsService';

const READABLE = {
  text: '#111827',
  gray: '#6B7280',
  line: '#E5E7EB',
  primary: '#22C55E',
};

export default function CreatePet() {
  const router = useRouter();
  const { user } = useAuth();

  // form states
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [notes, setNotes] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ---- Image pickers ----
  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      await handleUpload(res.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      await handleUpload(res.assets[0].uri);
    }
  };

  const handleUpload = async (uri) => {
    try {
      setUploading(true);
      const { publicUrl } = await uploadPetImage(user.id, uri);
      setAvatarUrl(publicUrl);
    } catch (e) {
      console.log('pet image upload error:', e?.message || e);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ---- Save pet ----
  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your pet’s name.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id,
        name: name.trim(),
        species: species.trim() || null,
        breed: breed.trim() || null,
        gender: gender.trim() || null,
        birthdate: birthdate ? birthdate.toISOString().split('T')[0] : null,
        weight: weight ? parseFloat(weight) : null,
        color: color.trim() || null,
        microchip: microchip.trim() || null,
        avatar_url: avatarUrl || null,
        notes: notes.trim() || null,
      };

      const { data, error } = await createPet(payload);
      if (error) throw error;

      Alert.alert('Success', 'Pet created successfully!', [
        { text: 'OK', onPress: () => router.replace({ pathname: '(main)/pet/[id]', params: { id: data.pet_id } }) },
      ]);
    } catch (e) {
      console.log('create pet error:', e?.message || e);
      Alert.alert('Error', 'Failed to create pet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: hp(8) }}>
        {/* top bar */}
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>New Pet</Text>
          <View style={{ width: hp(6) }} />
        </View>

        {/* image */}
        <View style={styles.imageWrap}>
          <Pressable onPress={pickFromLibrary} style={styles.imageBox}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="image" size={hp(3)} color={READABLE.gray} />
                <Text style={{ color: READABLE.gray, marginTop: 6 }}>
                  {uploading ? 'Uploading…' : 'Add photo'}
                </Text>
              </View>
            )}
          </Pressable>
          <View style={styles.imageActions}>
            <Pressable onPress={pickFromLibrary} style={styles.smallBtn}>
              <Icon name="image" size={hp(2.2)} color="#fff" />
            </Pressable>
            <Pressable onPress={pickFromCamera} style={styles.smallBtn}>
              <Icon name="camera" size={hp(2.2)} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* form */}
        <View style={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="E.g. Mochi" />

          <Text style={styles.label}>Species</Text>
          <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="Dog / Cat" />

          <Text style={styles.label}>Breed</Text>
          <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="Shiba Inu" />

          <Text style={styles.label}>Gender</Text>
          <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="Male / Female" />

          <Text style={styles.label}>Birthdate</Text>
          <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
            <Text style={{ color: birthdate ? READABLE.text : READABLE.gray }}>
              {birthdate ? birthdate.toDateString() : 'Select date'}
            </Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={birthdate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setBirthdate(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 5.2"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Color</Text>
          <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="e.g. White" />

          <Text style={styles.label}>Microchip ID</Text>
          <TextInput style={styles.input} value={microchip} onChangeText={setMicrochip} placeholder="Optional" />

          <Text style={styles.label}>Extra Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Special care, behavior, or preferences"
          />
        </View>

        {/* save button */}
        <View style={styles.saveBar}>
          <Pressable
            style={[styles.saveBtn, (saving || uploading) && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={saving || uploading}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Create Pet'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topbar: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: READABLE.line,
  },
  title: { fontSize: hp(2.4), fontWeight: '700', color: READABLE.text },
  cancelText: { color: READABLE.gray, fontSize: hp(2.0) },

  imageWrap: { marginTop: hp(2), paddingHorizontal: wp(6) },
  imageBox: {
    width: '100%',
    aspectRatio: 1.8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: READABLE.line,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  smallBtn: {
    backgroundColor: READABLE.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  form: { marginTop: hp(2), paddingHorizontal: wp(6) },
  label: { fontSize: hp(2.0), fontWeight: '600', color: READABLE.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: READABLE.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: hp(2.0),
    color: READABLE.text,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  textArea: { height: hp(14), textAlignVertical: 'top' },

  saveBar: { marginTop: hp(2), paddingHorizontal: wp(6), marginBottom: hp(4) },
  saveBtn: {
    backgroundColor: READABLE.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.8),
  },
  saveBtnText: { color: '#fff', fontSize: hp(2.1), fontWeight: '700' },
});
