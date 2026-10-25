import { supabase, uploadToSupabaseStorage } from '../lib/supabase';

// Helper to get active Replicate Key
export function getActiveReplicateKey() {
  const localKey = localStorage.getItem('aura_replicate_key');
  if (localKey && localKey.trim() !== '') return localKey.trim();
  return (
    import.meta.env.VITE_REPLICATE_API_KEY ||
    import.meta.env.replicate_api_key ||
    ''
  ).trim();
}

/**
 * 1. Analyze Room Spatial Geometry via Replicate (google/gemini-2.5-flash)
 */
export async function analyzeRoomSpatial(imageBase64, mimeType = 'image/jpeg', userId = null) {
  const apiKey = getActiveReplicateKey();

  // Try Supabase Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('analyze-room', {
      body: { imageBase64, mimeType, userId },
      headers: { 'x-replicate-key': apiKey }
    });

    if (!error && data && data.success) {
      return data;
    }
  } catch (edgeErr) {
    console.log('Edge function fallback to direct/local pipeline:', edgeErr.message);
  }

  // Fallback: local backend proxy or direct API
  const res = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-replicate-key': apiKey
    },
    body: JSON.stringify({ imageBase64, mimeType, userId })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Room analysis failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * 2. Analyze Reference Furniture Photo via Replicate (google/gemini-2.5-flash)
 */
export async function analyzeReferenceFurniture(imageBase64, mimeType = 'image/jpeg') {
  const apiKey = getActiveReplicateKey();

  // Try Supabase Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('analyze-reference', {
      body: { imageBase64, mimeType },
      headers: { 'x-replicate-key': apiKey }
    });

    if (!error && data && data.success) {
      return data;
    }
  } catch (edgeErr) {
    console.log('Edge function fallback to direct/local pipeline:', edgeErr.message);
  }

  // Fallback: local backend proxy or direct API
  const res = await fetch('/api/reference/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-replicate-key': apiKey
    },
    body: JSON.stringify({ imageBase64, mimeType })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Reference analysis failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * 3. Generate Staged Room Image via Replicate (google/nano-banana-pro)
 */
export async function generateStagedRoom(options) {
  const apiKey = getActiveReplicateKey();

  // Try Supabase Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('generate-staging', {
      body: options,
      headers: { 'x-replicate-key': apiKey }
    });

    if (!error && data && data.success && data.imageUrl) {
      // Persist to Supabase Storage if feasible
      try {
        const cdnUrl = await uploadToSupabaseStorage('staged-renders', data.imageUrl, `render_${Date.now()}.jpg`);
        if (cdnUrl && cdnUrl.startsWith('http')) {
          data.imageUrl = cdnUrl;
        }
      } catch (sErr) {
        console.warn('Storage sync note:', sErr);
      }
      return data;
    }
  } catch (edgeErr) {
    console.log('Edge function fallback to direct/local pipeline:', edgeErr.message);
  }

  // Fallback: local backend proxy or direct API
  const res = await fetch('/api/replicate/flux', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-replicate-key': apiKey
    },
    body: JSON.stringify(options)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Staging generation failed with status ${res.status}`);
  }

  const result = await res.json();

  // Upload to Supabase Storage staged-renders bucket
  if (result.imageUrl && result.imageUrl.startsWith('data:')) {
    uploadToSupabaseStorage('staged-renders', result.imageUrl, `staged_${Date.now()}.jpg`)
      .then(storedUrl => {
        if (storedUrl && storedUrl.startsWith('http')) {
          result.storageUrl = storedUrl;
        }
      })
      .catch(err => console.warn('Supabase storage non-blocking note:', err));
  }

  return result;
}
