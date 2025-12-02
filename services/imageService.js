// services/imageService.js
import { supabase } from '../lib/supabase';

// KEEPING your original helper
export const getUserImageSrc = (imagePath) => {
  if (imagePath) {
    return { uri: imagePath };
  } else {
    return require('../assets/images/avatar.jpg');
  }
};


export async function uploadUserAvatar(userId, localUri) {
  const res = await fetch(localUri);
  const blob = await res.blob();

  const key = `users/${userId}/avatar-${Date.now()}.jpg`;
  const bucket = supabase.storage.from('avatars');

  const { error } = await bucket.upload(key, blob, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) throw error;

  const { data } = bucket.getPublicUrl(key);
  if (!data?.publicUrl) throw new Error('No public URL returned');
  return { publicUrl: data.publicUrl };
}

export const uploadPetImage = async (userId, localUri) => {
  // you can change bucket name/folder to match your setup
  const bucket = 'public';
  const folder = `pets/${userId}`;
  const fileName = `${Date.now()}-pet.jpg`;
  const path = `${folder}/${fileName}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: publicData.publicUrl, path };
};