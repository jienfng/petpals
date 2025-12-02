// app/(main)/editProfile.jsx
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { getUserImageSrc, uploadUserAvatar } from '../../services/imageService';

const READABLE = {
  text: theme.colors?.text ?? '#111827',
  gray: theme.colors?.gray ?? '#6B7280',
  grayReadable: '#4B5563',
  light: theme.colors?.light ?? '#F3F4F6',
  primary: theme.colors?.primary ?? '#22C55E',
};

export default function EditProfile() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  // Editable fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState(null);        // users.image
  const [banner, setBanner] = useState(null);      // users.banner_url
  const [email, setEmail] = useState('');          // read-only

  // Load profile (uses id + city column)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Load profile error:', error);
        Alert.alert('Error', 'Could not load profile data.');
      } else if (data) {
        setProfile(data);
        setName(data.name || '');
        setBio(data.bio || '');
        setCity(data.city || '');
        setAddress(data.address || '');
        setPhoneNumber(data.phoneNumber || '');
        setImage(data.image || null);
        setBanner(data.banner_url || null);
        setEmail(data.email || '');
      }
      setLoading(false);
    })();
  }, [user?.id]);

  // ----- Avatar/Banner change flow (generalized) -----
  const [uploading, setUploading] = useState(false);

  const onChangeProfilePhoto = (field /* 'image' | 'banner_url' */) => {
    Alert.alert(
      field === 'image' ? 'Change profile photo' : 'Change banner image',
      undefined,
      [
        { text: 'Take Photo', onPress: () => pickFromCamera(field) },
        { text: 'Choose from Gallery', onPress: () => pickFromLibrary(field) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const pickFromLibrary = async (field) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      await handleUpload(field, res.assets[0].uri);
    }
  };

  const pickFromCamera = async (field) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      await handleUpload(field, res.assets[0].uri);
    }
  };

  const handleUpload = async (field, uri) => {
    if (!user?.id) return;
    try {
      setUploading(true);
      const { publicUrl } = await uploadUserAvatar(user.id, uri);
      if (field === 'image') setImage(publicUrl);
      if (field === 'banner_url') setBanner(publicUrl);
      // persist immediately so it sticks even if user navigates away
      await supabase.from('users').update({ [field]: publicUrl }).eq('id', user.id);
    } catch (e) {
      console.log('upload error:', e?.message || e);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Save changes to Supabase (uses city column)
  const saveChanges = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Name cannot be empty.');
      return;
    }

    setSaving(true);

    const updates = {
      name: name.trim(),
      bio: bio.trim(),
      city: city.trim(),                 // <-- city, not location
      address: address.trim(),
      phoneNumber: phoneNumber.trim(),
      image,
      banner_url: banner,
    };

    const { error } = await supabase.from('users').update(updates).eq('id', user.id);

    setSaving(false);

    if (error) {
      console.log('updateUserData error:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } else {
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: hp(20) }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.topTitle}>Edit Profile</Text>
        <View style={{ width: hp(5) }} />
      </View>

      {/* Banner (tap to change) */}
      <Pressable style={styles.bannerWrap} onPress={() => onChangeProfilePhoto('banner_url')}>
        <Image source={{ uri: banner || 'https://picsum.photos/800/300' }} style={styles.banner} />
        <Text style={styles.changeBanner}>{uploading ? 'Uploading…' : 'Change Banner'}</Text>
      </Pressable>

      {/* Avatar (tap to change) */}
      <View style={{ alignItems: 'center', marginTop: -hp(6) }}>
        <Pressable onPress={() => onChangeProfilePhoto('image')}>
          <Image
            source={getUserImageSrc(image).uri ? { uri: getUserImageSrc(image).uri } : require('../../assets/images/avatar.jpg')}
            style={styles.avatar}
          />
        </Pressable>
        <Text style={styles.changeAvatar}>{uploading ? 'Uploading…' : 'Change Avatar'}</Text>
      </View>

      {/* Form fields */}
      <View style={styles.form}>
        <Text style={styles.label}>Email (read-only)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#f5f5f5', color: '#888' }]}
          value={email}
          editable={false}
        />

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Enter your city" />

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter your address" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Write something about yourself"
          multiline
        />
      </View>

      {/* Save Button */}
      <View style={styles.saveBar}>
        <Pressable style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={saveChanges} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topTitle: { fontSize: hp(2.4), fontWeight: '700', color: READABLE.text },
  cancelText: { color: READABLE.grayReadable, fontSize: hp(2.0) },

  bannerWrap: { marginTop: hp(1.5), position: 'relative' },
  banner: { width: '100%', height: hp(18), backgroundColor: READABLE.light },
  changeBanner: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    color: READABLE.text,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: hp(1.8),
  },

  avatar: {
    width: hp(13),
    height: hp(13),
    borderRadius: hp(6.5),
    borderWidth: 2,
    borderColor: '#fff',
  },
  changeAvatar: { marginTop: 8, color: READABLE.grayReadable },

  form: { marginTop: hp(2.5), paddingHorizontal: wp(6) },
  label: { fontSize: hp(2.1), fontWeight: '600', color: READABLE.text, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: hp(2.0),
    color: READABLE.text,
    marginBottom: 14,
  },
  textArea: { height: hp(14), textAlignVertical: 'top' },

  saveBar: { marginTop: hp(3), paddingHorizontal: wp(6), marginBottom: hp(4) },
  saveButton: {
    backgroundColor: READABLE.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.8),
  },
  saveButtonText: { color: '#fff', fontSize: hp(2.2), fontWeight: '700' },
});
