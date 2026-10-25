import { supabase, uploadToSupabaseStorage } from '../lib/supabase';

/**
 * 1. Analyze Room Spatial Geometry via Supabase Edge Function (Replicate Spatial Vision)
 */
export async function analyzeRoomSpatial(imageBase64, mimeType = 'image/jpeg', userId = null) {
  const { data, error } = await supabase.functions.invoke('analyze-room', {
    body: { imageBase64, mimeType, userId }
  });

  if (error) {
    console.error('Room spatial analysis error:', error);
    throw new Error(error.message || 'Room spatial analysis failed. Ensure Supabase Edge Functions are deployed.');
  }

  if (!data || !data.success) {
    throw new Error(data?.error || 'Room spatial analysis returned an invalid response.');
  }

  return data;
}

/**
 * 2. Analyze Reference Furniture Photo via Supabase Edge Function
 */
export async function analyzeReferenceFurniture(imageBase64, mimeType = 'image/jpeg') {
  const { data, error } = await supabase.functions.invoke('analyze-reference', {
    body: { imageBase64, mimeType }
  });

  if (error) {
    console.warn('Reference furniture analysis error:', error);
    return {
      success: true,
      description: 'The exact architectural furniture shown in the attached reference photo, matching its exact cushion division, silhouette, upholstery fabric, and color.'
    };
  }

  return data || {
    success: true,
    description: 'The exact architectural furniture shown in the attached reference photo, matching its exact cushion division, silhouette, upholstery fabric, and color.'
  };
}

/**
 * 3. Generate Staged Room Image via Supabase Edge Function (Replicate Neural Staging)
 */
export async function generateStagedRoom(options) {
  const { data, error } = await supabase.functions.invoke('generate-staging', {
    body: options
  });

  if (error) {
    console.error('Room staging generation error:', error);
    throw new Error(error.message || 'Room staging generation failed. Ensure Supabase Edge Functions are deployed.');
  }

  if (!data || !data.success || !data.imageUrl) {
    throw new Error(data?.error || 'Staging generation did not produce a valid image.');
  }

  // Persist rendered image to Supabase Storage staged-renders bucket if it is base64
  if (data.imageUrl.startsWith('data:')) {
    try {
      const cdnUrl = await uploadToSupabaseStorage('staged-renders', data.imageUrl, `render_${Date.now()}.jpg`);
      if (cdnUrl && cdnUrl.startsWith('http')) {
        data.imageUrl = cdnUrl;
      }
    } catch (sErr) {
      console.warn('Storage CDN persistence notice:', sErr);
    }
  }

  return data;
}
