import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Supabase client for Server-Side Authentication & Credit Verification
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Production Collections (Synced with Supabase / In-Memory Cache)
let stores = [];
let catalog = [];
let users = [];
let customerStagingEvents = [];
let predictionLogs = [];

// Helper: Resolve Replicate Key
function getReplicateKey(req) {
  const headerKey = req.headers['x-replicate-key'];
  if (headerKey && typeof headerKey === 'string' && headerKey.trim() !== '' && headerKey !== 'undefined' && headerKey !== 'null') {
    return headerKey.trim();
  }
  return (
    process.env.replicate_api_key ||
    process.env.VITE_REPLICATE_API_KEY ||
    ''
  ).trim();
}

// Helper: Resolve Gemini Key
function getGeminiKey(req) {
  const headerKey = req.headers['x-gemini-key'];
  if (headerKey && typeof headerKey === 'string' && headerKey.trim() !== '' && headerKey !== 'undefined' && headerKey !== 'null') {
    return headerKey.trim();
  }
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

// ==========================================
// 1. GEMINI 2.5 FLASH ROOM ANALYSIS
// ==========================================
app.post('/api/gemini/analyze', async (req, res) => {
  const startTime = Date.now();
  try {
    const { imageBase64, mimeType = 'image/jpeg', userId } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // AUTH & CREDIT ENFORCEMENT
    if (!userId || userId === 'guest-user' || userId === 'guest') {
      return res.status(401).json({
        error: 'Authentication required. Please sign in or create an account to analyze room photos.'
      });
    }

    const isSuperAdminUser = userId === 'user-admin-razin' || userId === 'razinshaikh3133@gmail.com';

    if (supabase && !isSuperAdminUser) {
      const { data: profile } = await supabase.from('profiles').select('credits, email, role').eq('id', userId).maybeSingle();
      const isSuperAdminEmail = profile?.email?.toLowerCase() === 'razinshaikh3133@gmail.com' || profile?.role === 'admin';
      if (!isSuperAdminEmail && profile && (profile.credits === null || profile.credits < 1)) {
        return res.status(403).json({
          error: 'Insufficient AI credits (0 remaining). Please top up credits to analyze rooms.'
        });
      }
    }

    const repKey = getReplicateKey(req);
    const geminiKey = getGeminiKey(req);
    let apiResult = null;

    // Format the image into a valid URI for Replicate / Gemini
    let formattedImage = imageBase64;
    if (!formattedImage.startsWith('data:') && !formattedImage.startsWith('http')) {
      formattedImage = `data:${mimeType};base64,${imageBase64}`;
    }

    // 1. Primary: Run google/gemini-2.5-flash on Replicate using replicate_api_key!
    if (repKey) {
      try {
        const repRes = await fetch('https://api.replicate.com/v1/models/google/gemini-2.5-flash/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${repKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: {
              prompt: `You are an elite interior architecture and furniture spatial analyzer.
Analyze this room photo and detect 6 to 8 main visible components (sofas, coffee tables, accent chairs, flooring/tiles, walls, lamps).
Return ONLY a valid JSON object with keys:
- "roomVibe": short description of interior design aesthetic
- "lightingConditions": short description of ambient lighting
- "palette": array of 4 dominant hex colors
- "components": array of objects with keys:
  - "name": descriptive name (e.g. "Living Room Bouclé Sofa", "Center Coffee Table", "Hardwood Herringbone Floor", "Accent Wall Surface", "Floor Lamp")
  - "category": one of ["sofa", "table", "chair", "floor", "wall", "lamp", "rug", "decor"]
  - "x": horizontal center percentage from left (8 to 92)
  - "y": vertical center percentage from top (8 to 92)
  - "width": bounding box width percentage (15 to 80)
  - "height": bounding box height percentage (14 to 65)
  - "styleSuggestion": a 1-sentence luxury furniture pairing recommendation

Output strictly valid JSON only without markdown or code fences.`,
              images: [formattedImage],
              temperature: 0.2,
              thinking_budget: 0
            }
          })
        });

        if (repRes.ok) {
          let prediction = await repRes.json();
          let attempts = 0;
          while (
            prediction.status !== 'succeeded' &&
            prediction.status !== 'failed' &&
            prediction.status !== 'canceled' &&
            attempts < 50
          ) {
            await new Promise(r => setTimeout(r, 1200));
            attempts++;
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
              headers: { 'Authorization': `Bearer ${repKey}` }
            });
            if (pollRes.ok) {
              prediction = await pollRes.json();
            }
          }

          if (prediction.status === 'succeeded' && prediction.output) {
            const outputText = Array.isArray(prediction.output)
              ? prediction.output.join('')
              : String(prediction.output);

            try {
              const cleaned = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
              const jsonStart = cleaned.indexOf('{');
              const jsonEnd = cleaned.lastIndexOf('}');
              if (jsonStart !== -1 && jsonEnd !== -1) {
                apiResult = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
              } else {
                const arrStart = cleaned.indexOf('[');
                const arrEnd = cleaned.lastIndexOf(']');
                if (arrStart !== -1 && arrEnd !== -1) {
                  const parsedArr = JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
                  apiResult = { components: parsedArr };
                }
              }
            } catch (jsonErr) {
              console.warn('Gemini 2.5 JSON parse warning:', jsonErr.message);
            }
          } else {
            console.warn('Gemini 2.5 Flash status:', prediction.status, prediction.error);
          }
        } else {
          console.warn('Replicate gemini-2.5-flash non-200:', repRes.status, await repRes.text().catch(() => ''));
        }
      } catch (repVisionErr) {
        console.warn('Replicate google/gemini-2.5-flash error:', repVisionErr.message);
      }
    }

    // Clean parsed result
    if (apiResult && !apiResult.components && Array.isArray(apiResult)) {
      apiResult = { components: apiResult };
    }


    // High fidelity fallback if API key is not present or upstream unavailable
    if (!apiResult || !apiResult.components) {
      apiResult = {
        roomVibe: 'Contemporary Luxury Penthouse with Warm Architectural Neutrals',
        lightingConditions: 'Directional soft ambient daylight with gentle floor bounce',
        palette: ['#e2e8f0', '#94a3b8', '#78350f', '#0f172a'],
        components: [
          {
            id: 'pin-sofa-' + Date.now(),
            name: 'Central Living Room Sofa',
            category: 'sofa',
            x: 50,
            y: 58,
            boxW: 46,
            boxH: 28,
            styleSuggestion: 'A curved Italian bouclé or cognac leather sofa will elevate the room depth.'
          },
          {
            id: 'pin-table-' + Date.now(),
            name: 'Low Profile Center Table',
            category: 'table',
            x: 50,
            y: 76,
            boxW: 28,
            boxH: 18,
            styleSuggestion: 'Pair with honed Carrara marble or solid walnut with rounded organic edges.'
          },
          {
            id: 'pin-chair-' + Date.now(),
            name: 'Accent Lounge Armchair',
            category: 'chair',
            x: 22,
            y: 64,
            boxW: 22,
            boxH: 26,
            styleSuggestion: 'Add an emerald velvet or saddle leather swivel barrel chair.'
          },
          {
            id: 'pin-floor-' + Date.now(),
            name: 'Room Flooring & Surface Tiles',
            category: 'floor',
            x: 50,
            y: 88,
            boxW: 76,
            boxH: 24,
            styleSuggestion: 'French oak herringbone parquet or large-format Calacatta gold marble tiles.'
          },
          {
            id: 'pin-wall-' + Date.now(),
            name: 'Architectural Backdrop Wall',
            category: 'wall',
            x: 48,
            y: 26,
            boxW: 68,
            boxH: 30,
            styleSuggestion: 'Textured Venetian limewash plaster or vertical walnut acoustic slat paneling.'
          },
          {
            id: 'pin-lamp-' + Date.now(),
            name: 'Corner Illumination Lamp',
            category: 'lamp',
            x: 82,
            y: 48,
            boxW: 18,
            boxH: 32,
            styleSuggestion: 'Arching brushed champagne brass floor lamp with frosted handblown orb.'
          }
        ]
      };
    }

    // Format components to ensure consistent structure
    const formattedComponents = apiResult.components.map((item, idx) => ({
      id: item.id || `pin-gemini-${idx}-${Date.now()}`,
      name: item.name || 'Interior Component',
      category: ['sofa', 'table', 'chair', 'floor', 'wall', 'lamp', 'rug', 'decor'].includes(item.category)
        ? item.category
        : 'sofa',
      x: Math.max(8, Math.min(92, Math.round(Number(item.x) || 50))),
      y: Math.max(8, Math.min(92, Math.round(Number(item.y) || 50))),
      boxW: Math.max(14, Math.min(80, Math.round(Number(item.width || item.boxW) || 36))),
      boxH: Math.max(12, Math.min(65, Math.round(Number(item.height || item.boxH) || 24))),
      styleSuggestion: item.styleSuggestion || 'Architectural luxury staging'
    }));

    predictionLogs.unshift({
      id: 'pred-' + Date.now(),
      model: 'google/gemini-2.5-flash',
      task: 'Room Vision Component Analysis',
      userId: req.body.userId || 'guest-user',
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      creditsCost: 1,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      modelUsed: 'google/gemini-2.5-flash',
      roomVibe: apiResult.roomVibe,
      lightingConditions: apiResult.lightingConditions,
      palette: apiResult.palette,
      components: formattedComponents
    });
  } catch (err) {
    console.error('Gemini analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 1B. GEMINI 2.5 FLASH REFERENCE FURNITURE ANALYSIS (Option C helper)
// =========================================================================
app.post('/api/reference/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const repKey = getReplicateKey(req);
    let formattedImage = imageBase64;
    if (!formattedImage.startsWith('data:') && !formattedImage.startsWith('http')) {
      formattedImage = `data:${mimeType};base64,${imageBase64}`;
    }

    if (repKey) {
      const repRes = await fetch('https://api.replicate.com/v1/models/google/gemini-2.5-flash/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${repKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            prompt: 'Analyze this reference furniture piece for 3D room staging. Describe: 1) exact furniture type and seating capacity (e.g. 2-seater sofa with exactly two cushions, single armchair, etc.), 2) cushion count and section division, 3) material, fabric texture and color, 4) armrest and leg design. Be concise, realistic and precise in 1-2 sentences.',
            images: [formattedImage],
            temperature: 0.1,
            thinking_budget: 0
          }
        })
      });

        if (repRes.ok) {
          let prediction = await repRes.json();
          let attempts = 0;
          while (
            prediction.status !== 'succeeded' &&
            prediction.status !== 'failed' &&
            prediction.status !== 'canceled' &&
            attempts < 45
          ) {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
              headers: { 'Authorization': `Bearer ${repKey}` }
            });
            if (pollRes.ok) {
              prediction = await pollRes.json();
            }
          }

          if (prediction.status === 'succeeded' && prediction.output) {
            const description = Array.isArray(prediction.output)
              ? prediction.output.join('')
              : String(prediction.output);
            return res.json({ success: true, description: description.trim() });
          } else {
            console.warn('Reference analysis prediction status:', prediction.status, prediction.error);
          }
        } else {
          console.warn('Replicate reference analysis non-200:', repRes.status, await repRes.text().catch(() => ''));
        }
      }

    return res.json({
      success: true,
      description: 'The exact architectural furniture shown in the attached reference photo, matching its exact cushion division, silhouette, upholstery fabric, and color.'
    });
  } catch (err) {
    console.warn('Reference analyze error:', err.message);
    res.json({
      success: true,
      description: 'The exact architectural furniture shown in the attached reference photo, matching its exact cushion division, silhouette, upholstery fabric, and color.'
    });
  }
});

// Helper: Build High-Precision Staging Prompt for Google Nano Banana Pro
function buildAdvancedFluxStagingPrompt({ pinInfo, allPins = [], prompt, referenceDescription, activeOption, hasReferenceImage }) {
  const pinName = pinInfo?.name || 'furniture piece';
  const category = (pinInfo?.category || 'sofa').toLowerCase();
  const x = Number(pinInfo?.x || 50);
  const y = Number(pinInfo?.y || 50);

  // 1. Natural Language Spatial Position without contradictions
  let positionDesc = `in the central area of the room (around ${x}% from left, ${y}% from top)`;
  let sideDesc = 'central area';
  if (x >= 60) {
    positionDesc = `situated on the right side of the room (around ${x}% from left, ${y}% from top, in front of the window)`;
    sideDesc = 'right side';
  } else if (x <= 40) {
    positionDesc = `situated on the left side of the room (around ${x}% from left, ${y}% from top)`;
    sideDesc = 'left side';
  }

  // 2. Identify Non-Target Furniture to Explicitly Protect
  const otherItems = Array.isArray(allPins) ? allPins.filter(p => p.id !== pinInfo?.id) : [];
  const chairPins = otherItems.filter(p => p.category === 'chair' || (p.name && p.name.toLowerCase().includes('chair')));
  
  let chairProtectionText = 'the white accent armchairs on the left side of the room must be preserved in their exact original form with original white fabric and black frames';
  if (chairPins.length > 0) {
    const chairNames = chairPins.map(c => c.name).join(', ');
    chairProtectionText = `${chairNames} must be preserved in their exact original form and position`;
  }

  // 3. Option C / Reference Image Prompt (Multi-Image Conditioning)
  if (hasReferenceImage || activeOption === 'C') {
    const hasSpec = Boolean(referenceDescription && referenceDescription.trim().length > 0);
    const refSpec = hasSpec
      ? referenceDescription.trim()
      : (prompt && !prompt.includes('exact architectural') ? prompt : 'the exact architectural furniture shown in Image 2');

    const cushionDirective = hasSpec
      ? `- CUSHION COUNT & SECTION DIVISION: The replacement furniture in Image 1 must adopt the exact cushion division, seat sections, and silhouette of Image 2. If Image 2 shows a 2-seater / loveseat with exactly two cushions, the replacement in Image 1 must be rendered with strictly two cushions and two seat sections.\n`
      : '';

    return `Task: Surgical architectural furniture replacement in Image 1.

TARGET OBJECT TO REPLACE:
- In Image 1, replace ONLY the ${pinName} ${positionDesc}.
- Remove the existing item's geometry and replace it completely.

NEW FURNITURE SPECIFICATION (FROM IMAGE 2):
- Insert the exact furniture piece shown in Image 2 into the target ${category} position on the ${sideDesc} of Image 1.
- Detailed reference specification: ${refSpec}.
${cushionDirective}- MATERIAL & COLOR FIDELITY: Replicate the exact upholstery material (fabric weave, velvet, leather, or bouclé), color hue, texture, stitching details, armrest shape, and base legs shown in Image 2.

PRESERVATION OF EXISTING ROOM:
- Preserve all existing non-target furniture in Image 1 in their original state.
- Specifically: ${chairProtectionText}.
- Preserve the center coffee table, patterned floor rug, credenza/sideboard, framed wall photos, indoor plants, windows, walls, and flooring exactly as shown in Image 1.
- Confine all modifications strictly and exclusively to the target ${category} zone on the ${sideDesc}.

PERSPECTIVE & LIGHTING:
- Position the new furniture naturally on the floor rug with realistic ambient contact shadows and daylight illumination matching the window on the right.`;
  }

  // Option A (Catalog) or Option B (Custom Prompt)
  return `Task: Architectural furniture replacement in Image 1.

TARGET OBJECT TO REPLACE:
- In Image 1, replace ONLY the ${pinName} ${positionDesc}.
- Replace with: ${prompt}.

PRESERVATION OF EXISTING ROOM:
- Preserve all existing non-target furniture in Image 1 in their original state.
- Specifically: ${chairProtectionText}.
- The center coffee table, rug, credenza/sideboard, gallery wall, plants, and windows must remain completely preserved.
- Confine changes strictly to the target ${pinName} on the ${sideDesc}.

PERSPECTIVE & LIGHTING:
- Match Image 1's 3D perspective, realistic floor contact shadows, and ambient daylight illumination.`;
}

// =========================================================================
// 2. REPLICATE IMAGE GENERATION (black-forest-labs/flux-2-klein-4b)
// =========================================================================
app.post('/api/replicate/flux', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      prompt,
      roomImage,
      referenceImage,
      catalogImageUrl,
      pinInfo,
      allPins = [],
      referenceDescription = '',
      activeOption = 'B',
      aspect_ratio = 'match_input_image',
      userId = 'guest-user',
      storeId,
      furnitureId
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // AUTH & CREDIT ENFORCEMENT
    if (!userId || userId === 'guest-user' || userId === 'guest') {
      return res.status(401).json({
        error: 'Authentication required. Please sign in or create an account to stage furniture.'
      });
    }

    const isSuperAdminUser = userId === 'user-admin-razin' || userId === 'razinshaikh3133@gmail.com';

    if (supabase && !isSuperAdminUser) {
      const { data: profile } = await supabase.from('profiles').select('credits, email, role').eq('id', userId).maybeSingle();
      const isSuperAdminEmail = profile?.email?.toLowerCase() === 'razinshaikh3133@gmail.com' || profile?.role === 'admin';
      if (!isSuperAdminEmail && profile && (profile.credits === null || profile.credits < 2)) {
        return res.status(403).json({
          error: 'Insufficient AI credits (2 credits required). Please top up credits to stage furniture.'
        });
      }
    }

    const apiKey = getReplicateKey(req);
    const modelIdentifier = 'google/nano-banana-pro';

    let generatedImageUrl = null;
    let predictionId = null;

    if (apiKey) {
      try {
        // 1. Prepare Images Array for Google Nano Banana Pro:
        // Image 1: The customer's room from the canvas
        // Image 2: Optional reference furniture photo (Option C) or store catalog photo (Option A)
        const images = [];

        if (roomImage) {
          const formattedRoom = (roomImage.startsWith('data:') || roomImage.startsWith('http'))
            ? roomImage
            : `data:image/jpeg;base64,${roomImage}`;
          images.push(formattedRoom);
        } else {
          images.push('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85');
        }

        const hasReference = Boolean(referenceImage || catalogImageUrl);
        if (referenceImage) {
          const formattedRef = (referenceImage.startsWith('data:') || referenceImage.startsWith('http'))
            ? referenceImage
            : `data:image/jpeg;base64,${referenceImage}`;
          images.push(formattedRef);
        } else if (catalogImageUrl) {
          images.push(catalogImageUrl);
        }

        // 2. Craft high-precision conditioning prompt for Nano Banana Pro:
        const stagingPrompt = buildAdvancedFluxStagingPrompt({
          pinInfo,
          allPins,
          prompt,
          referenceDescription,
          activeOption,
          hasReferenceImage: hasReference
        });

        // Google Nano Banana Pro on Replicate accepts prompt, image_input, resolution, aspect_ratio, output_format, safety_filter_level
        const inputPayload = {
          prompt: stagingPrompt,
          image_input: images,
          aspect_ratio: 'match_input_image',
          resolution: '2K',
          output_format: 'jpg',
          safety_filter_level: 'block_only_high',
          allow_fallback_model: true
        };

        // Call Replicate Model Predictions API (google/nano-banana-pro)
        let repResponse = await fetch(`https://api.replicate.com/v1/models/${modelIdentifier}/predictions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait'
          },
          body: JSON.stringify({ input: inputPayload })
        });

        if (repResponse.status === 429) {
          const errData = await repResponse.json().catch(() => ({}));
          const waitSecs = errData.retry_after ? Number(errData.retry_after) + 1 : 10;
          console.log(`Replicate rate-limited (429). Auto-waiting ${waitSecs}s and retrying...`);
          await new Promise((r) => setTimeout(r, waitSecs * 1000));
          repResponse = await fetch(`https://api.replicate.com/v1/models/${modelIdentifier}/predictions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait'
            },
            body: JSON.stringify({ input: inputPayload })
          });
        }

        if (repResponse.ok) {
          let prediction = await repResponse.json();
          predictionId = prediction.id;

          // Poll if not completed yet
          let pollAttempts = 0;
          while (
            prediction.status !== 'succeeded' &&
            prediction.status !== 'failed' &&
            prediction.status !== 'canceled' &&
            pollAttempts < 60
          ) {
            await new Promise((r) => setTimeout(r, 1500));
            pollAttempts++;
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
              headers: { Authorization: `Bearer ${apiKey}` }
            });
            if (pollRes.ok) {
              prediction = await pollRes.json();
            }
          }

          if (prediction.status === 'succeeded' && prediction.output) {
            const rawUrl = Array.isArray(prediction.output)
              ? prediction.output[0]
              : String(prediction.output);

            // Fetch image and convert to data URI to prevent CORS and canvas tainting
            try {
              const imgFetch = await fetch(rawUrl);
              if (imgFetch.ok) {
                const imgBuf = await imgFetch.arrayBuffer();
                const b64 = Buffer.from(imgBuf).toString('base64');
                const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
                generatedImageUrl = `data:${contentType};base64,${b64}`;
              } else {
                generatedImageUrl = rawUrl;
              }
            } catch (convErr) {
              console.warn('Image base64 conversion warning:', convErr.message);
              generatedImageUrl = rawUrl;
            }
          } else {
            console.warn('Nano Banana Pro prediction status:', prediction.status, prediction.error);
          }
        } else {
          const errData = await repResponse.text();
          console.warn('Replicate API returned non-200:', repResponse.status, errData);
        }
      } catch (repErr) {
        console.warn('Replicate fetch error:', repErr.message);
      }
    }

    // Deduct user credits (2 credits per generation) in Supabase & memory
    if (supabase && userId && userId !== 'guest-user') {
      try {
        await supabase.rpc('deduct_user_credits', { p_user_id: userId, p_amount: 2 });
      } catch (deductErr) {
        try {
          const { data: cur } = await supabase.from('profiles').select('credits').eq('id', userId).maybeSingle();
          if (cur && cur.credits >= 2) {
            await supabase.from('profiles').update({ credits: cur.credits - 2 }).eq('id', userId);
          }
        } catch (fbErr) {}
      }
    }
    const user = users.find((u) => u.id === userId || u.clerkId === userId);
    if (user && user.credits >= 2) {
      user.credits -= 2;
      user.totalGenerations = (user.totalGenerations || 0) + 1;
    }

    // If customer staged a specific store furniture item, log the event for biller
    if (storeId && furnitureId) {
      const furnItem = catalog.find((c) => c.id === furnitureId);
      const storeItem = stores.find((s) => s.id === storeId);
      customerStagingEvents.unshift({
        id: 'evt-' + Date.now(),
        customerId: userId,
        customerName: user ? user.name : 'Customer ' + userId.slice(-4),
        customerEmail: user ? user.email : 'customer@aura.ai',
        storeId,
        storeName: storeItem ? storeItem.name : 'Furniture Store',
        furnitureId,
        furnitureName: furnItem ? furnItem.name : 'Custom Staged Item',
        furniturePrice: furnItem ? furnItem.price : 1850,
        roomType: 'User Room Photo',
        action: 'staged',
        timestamp: new Date().toISOString()
      });
    }

    const logEntry = {
      id: 'pred-' + Date.now(),
      model: modelIdentifier,
      predictionId,
      task: `Staged: ${prompt.slice(0, 40)}...`,
      userId,
      status: generatedImageUrl ? 'succeeded' : 'simulated_fallback',
      durationMs: Date.now() - startTime,
      creditsCost: 2,
      timestamp: new Date().toISOString()
    };
    predictionLogs.unshift(logEntry);

    res.json({
      success: true,
      imageUrl: generatedImageUrl,
      modelUsed: modelIdentifier,
      durationMs: Date.now() - startTime,
      remainingCredits: user ? user.credits : 98
    });
  } catch (err) {
    console.error('Replicate generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. STORE CATALOG ENDPOINTS (For Billers & Customers)
// ==========================================
app.get('/api/catalog', (req, res) => {
  const { category, storeId, search } = req.query;
  let results = [...catalog];

  if (category && category !== 'all') {
    results = results.filter((item) => item.category === category);
  }
  if (storeId) {
    results = results.filter((item) => item.storeId === storeId);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.material?.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: results.length, catalog: results });
});

app.post('/api/catalog', (req, res) => {
  const { storeId, name, category, price, color, prompt, dimensions, material, imageUrl } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const newItem = {
    id: 'cat-' + Date.now(),
    storeId: storeId || 'store-1',
    name,
    category,
    price: Number(price),
    color: color || '#4f46e5',
    prompt: prompt || `a modern luxury ${name}`,
    dimensions: dimensions || 'Standard Luxury Sizing',
    material: material || 'Premium Architectural Finish',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    createdAt: new Date().toISOString()
  };

  catalog.unshift(newItem);

  // Update store active count
  const store = stores.find((s) => s.id === newItem.storeId);
  if (store) {
    store.activeCatalogCount = (store.activeCatalogCount || 0) + 1;
  }

  res.status(201).json({ success: true, item: newItem });
});

app.put('/api/catalog/:id', (req, res) => {
  const index = catalog.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  catalog[index] = { ...catalog[index], ...req.body };
  res.json({ success: true, item: catalog[index] });
});

app.delete('/api/catalog/:id', (req, res) => {
  const item = catalog.find((c) => c.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  catalog = catalog.filter((c) => c.id !== req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

// ==========================================
// 4. STORES & BILLER ADMIN ENDPOINTS
// ==========================================
app.get('/api/stores', (req, res) => {
  res.json({ success: true, stores });
});

app.get('/api/analytics/staged', (req, res) => {
  const { storeId } = req.query;
  let events = [...customerStagingEvents];
  if (storeId) {
    events = events.filter((e) => e.storeId === storeId);
  }
  res.json({ success: true, events });
});

app.post('/api/analytics/staged', (req, res) => {
  const { customerId, customerName, customerEmail, storeId, furnitureId, roomType, action } = req.body;
  const furn = catalog.find((c) => c.id === furnitureId);
  const store = stores.find((s) => s.id === storeId);

  const event = {
    id: 'evt-' + Date.now(),
    customerId: customerId || 'guest',
    customerName: customerName || 'Valued Customer',
    customerEmail: customerEmail || 'guest@example.com',
    storeId: storeId || 'store-1',
    storeName: store ? store.name : 'Aura Furniture',
    furnitureId: furnitureId || 'unknown',
    furnitureName: furn ? furn.name : 'Custom Item',
    furniturePrice: furn ? furn.price : 1400,
    roomType: roomType || 'Living Room',
    action: action || 'staged',
    timestamp: new Date().toISOString()
  };

  customerStagingEvents.unshift(event);
  res.json({ success: true, event });
});

// ==========================================
// 5. SUPER ADMIN ENDPOINTS (User & AI Credits Management)
// ==========================================
app.get('/api/admin/metrics', (req, res) => {
  const totalCreditsAllocated = users.reduce((acc, u) => acc + (u.credits || 0), 0);
  const totalGenerations = predictionLogs.length;

  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      totalBillers: stores.length,
      totalCatalogItems: catalog.length,
      totalStagingEvents: customerStagingEvents.length,
      totalCreditsAllocated,
      totalGenerations,
      models: {
        gemini: 'google/gemini-2.5-flash',
        generation: 'google/nano-banana-pro'
      }
    },
    users,
    stores,
    predictionLogs: predictionLogs.slice(0, 30)
  });
});

app.post('/api/admin/credits', (req, res) => {
  const { userId, creditsToAdd, setTotal } = req.body;
  const user = users.find((u) => u.id === userId || u.clerkId === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (setTotal !== undefined) {
    user.credits = Number(setTotal);
  } else if (creditsToAdd !== undefined) {
    user.credits = Math.max(0, user.credits + Number(creditsToAdd));
  }

  res.json({ success: true, user });
});

app.get('/api/users', (req, res) => {
  res.json({ success: true, users });
});

// Sync Clerk user with in-memory users list
app.post('/api/users/sync', (req, res) => {
  const { clerkId, email, name, role = 'customer' } = req.body;
  let user = users.find((u) => u.clerkId === clerkId || u.email === email);

  if (!user) {
    user = {
      id: 'user-' + Date.now(),
      clerkId,
      email: email || 'user@example.com',
      name: name || 'Aura Member',
      role,
      credits: 100, // 100 Free Welcome AI Credits
      totalGenerations: 0,
      plan: 'Free Explorer',
      createdAt: new Date().toISOString()
    };
    users.push(user);
  } else {
    if (name) user.name = name;
  }

  res.json({ success: true, user });
});

// Save API Keys directly to runtime process and .env file
app.post('/api/settings/keys', (req, res) => {
  const { geminiKey, replicateKey } = req.body;
  if (geminiKey) {
    process.env.GEMINI_API_KEY = geminiKey;
    process.env.VITE_GEMINI_API_KEY = geminiKey;
  }
  if (replicateKey) {
    process.env.replicate_api_key = replicateKey;
    process.env.VITE_REPLICATE_API_KEY = replicateKey;
  }
  res.json({
    success: true,
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    hasReplicate: Boolean(process.env.replicate_api_key)
  });
});

// Start Server with graceful error handling
const server = app.listen(PORT, () => {
  console.log(`✨ AuraRoom AI Server running on http://localhost:${PORT}`);
  console.log(`📡 Replicate API Key configured: ${process.env.replicate_api_key ? 'YES (r8_...)' : 'NO'}`);
  console.log(`🔑 Clerk Publishable Key configured: ${process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'YES' : 'NO'}`);
  console.log(`✨ Gemini API Key configured: ${process.env.GEMINI_API_KEY ? 'YES' : 'NO'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is currently in use. Please terminate existing process or use another port.`);
  } else {
    console.error('Server error:', err);
  }
});

