import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Normalize URL (handles if user provided bare project ref 'urbfdlljbzfsgtvyhuko' or full url)
export const supabaseUrl = rawUrl.startsWith('http')
  ? rawUrl
  : rawUrl
  ? `https://${rawUrl}.supabase.co`
  : 'https://urbfdlljbzfsgtvyhuko.supabase.co';

export const supabaseAnonKey = rawAnonKey || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Uploads a base64 or blob image to Supabase Storage
 * @param {'room-uploads' | 'staged-renders' | 'catalog-images' | 'reference-images'} bucket
 * @param {string | Blob} fileOrBase64
 * @param {string} fileName
 * @param {string} mimeType
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export async function uploadToSupabaseStorage(bucket, fileOrBase64, fileName = '', mimeType = 'image/jpeg') {
  try {
    const timestamp = Date.now();
    const cleanName = fileName ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_') : `upload_${timestamp}.jpg`;
    const filePath = `${timestamp}_${cleanName}`;

    let bodyData;
    if (typeof fileOrBase64 === 'string') {
      // Clean base64 string
      const base64Data = fileOrBase64.includes(',') ? fileOrBase64.split(',')[1] : fileOrBase64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      bodyData = new Blob([byteArray], { type: mimeType });
    } else {
      bodyData = fileOrBase64;
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, bodyData, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.warn(`Supabase Storage upload warning (${bucket}):`, uploadError.message);
      // Fallback to original if upload encounters policy or network issue
      return typeof fileOrBase64 === 'string' ? fileOrBase64 : URL.createObjectURL(bodyData);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.warn('Storage helper error:', err);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  }
}
