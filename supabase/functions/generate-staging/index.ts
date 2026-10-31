import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-replicate-key",
};

function buildStagingPrompt({
  pinInfo,
  allPins = [],
  prompt,
  referenceDescription,
  activeOption,
  hasReferenceImage,
  targetAspectRatio = "3:2",
  fabricSpec = "",
  furnitureTypeSpec = "",
  hasFabricSwatchImage = false,
  isFluxModel = true,
}: any) {
  const pinName = pinInfo?.name || "furniture piece";
  const category = (pinInfo?.category || "sofa").toLowerCase();
  const x = Math.round(Number(pinInfo?.x || 50));
  const y = Math.round(Number(pinInfo?.y || 50));
  const boxW = Math.round(Number(pinInfo?.boxW || 45));
  const boxH = Math.round(Number(pinInfo?.boxH || 35));

  const positionDesc = `centered at approximately ${x}% horizontal, ${y}% vertical (bounding area roughly ${boxW}% width × ${boxH}% height of Image 1)`;

  const otherItems = Array.isArray(allPins) ? allPins.filter((p: any) => p.id !== pinInfo?.id) : [];
  const otherItemsNames = otherItems.map((p: any) => p.name).filter(Boolean);
  const preservedItemsText = otherItemsNames.length > 0
    ? `Strictly keep all existing non-target elements in Image 1 identical: ${otherItemsNames.join(", ")}.`
    : "Strictly preserve all other furniture, decor, and architectural elements in Image 1.";

  let customDirectives = "";
  if (furnitureTypeSpec) {
    customDirectives += `- FURNITURE SILHOUETTE / TYPE: Render the replacement piece specifically as a ${furnitureTypeSpec}.\n`;
  }
  if (fabricSpec) {
    customDirectives += `- UPHOLSTERY FABRIC & MATERIAL FINISH: Upholster the piece in ${fabricSpec}.\n`;
  }
  if (hasFabricSwatchImage) {
    customDirectives += `- CUSTOM FABRIC SWATCH: Apply the exact material texture, pattern weave, and color tone from the attached fabric swatch image onto the furniture upholstery.\n`;
  }
  const customFabricAndTypeDirective = customDirectives ? `\nCUSTOM FABRIC & FURNITURE TYPE SPECIFICATION:\n${customDirectives}` : "";

  if (hasReferenceImage || activeOption === "C") {
    const hasSpec = Boolean(referenceDescription && referenceDescription.trim().length > 0);
    const refSpec = hasSpec
      ? referenceDescription.trim()
      : (prompt && !prompt.includes("exact architectural") ? prompt : "the exact furniture shown in Image 2");

    const cushionDirective = hasSpec
      ? `- CUSHION COUNT & DIVISION: The replacement furniture in Image 1 must adopt the exact cushion division and seating silhouette of Image 2.\n`
      : "";

    const materialLine = (fabricSpec || hasFabricSwatchImage)
      ? `- MATERIAL CUSTOMIZATION: Keep the structural form of Image 2 while applying the custom upholstery: ${fabricSpec || "custom fabric swatch"}.`
      : `- MATERIAL & COLOR FIDELITY: Replicate the exact upholstery texture, material weave, color hue, armrest shape, and base legs shown in Image 2.`;

    return `Task: Surgical in-room furniture replacement.

PRIMARY INPUT:
- Image 1 is the user's authentic room photograph.
- Image 2 is the reference furniture photograph to insert into Image 1.

STRICT ROOM PRESERVATION MANDATE:
- Image 1 is the REAL ROOM ENVIRONMENT. You MUST preserve the exact room in Image 1: identical architectural layout, walls, paint finish, flooring, ceiling, light fixtures/chandeliers, windows, doors, and camera perspective.
- Do NOT alter any part of the room outside the designated furniture position.
- Do NOT hallucinate or add new architectural features, windows, rugs, or walls that do not exist in Image 1.
- ${preservedItemsText}
- All modifications must be STRICTLY and EXCLUSIVELY confined to the target ${category} bounding zone (${positionDesc}).

REPLACEMENT SPECIFICATION:
- In Image 1, remove ONLY the existing ${pinName} at ${positionDesc}.
- Insert the new furniture piece based on Image 2: ${refSpec}.
${cushionDirective}${materialLine}${customFabricAndTypeDirective}

LIGHTING & PERSPECTIVE INTEGRATION:
- Seamlessly integrate the new furniture into Image 1 using Image 1's existing ambient room lighting, color temperature, and realistic floor contact shadows.
- Strictly preserve Image 1's exact camera framing, orientation, and perspective.`;
  }

  // Text-based, catalog prompt, or Type & Fabric staging (Option B or D)
  const isPureReupholster = Boolean((fabricSpec || hasFabricSwatchImage) && (!furnitureTypeSpec || furnitureTypeSpec === "Original Silhouette"));
  
  if (isPureReupholster) {
    const swatchDesc = hasFabricSwatchImage
      ? "the exact material texture, pattern weave, and color of the attached fabric swatch image"
      : fabricSpec;

    return `Task: Surgical in-place furniture re-upholstery.

PRIMARY INPUT:
- Image 1 is the authentic room photograph containing the target ${pinName} at ${positionDesc}.

PRESERVATION OF EXISTING FURNITURE SHAPE & GEOMETRY:
- Keep the EXACT original 3D silhouette, geometry, cushion division, armrest contours, backrest, legs, and proportions of the ${pinName} in Image 1.
- Do NOT replace the piece with a different shape or model.
- Only RE-UPHOLSTER the surface material of this existing piece into: ${swatchDesc}.
- Preserve all structural stitching, natural fabric folds, and lighting bounce from the room.

STRICT ROOM PRESERVATION MANDATE:
- Image 1 is the REAL ROOM ENVIRONMENT. Preserve 100% of Image 1: identical architectural layout, walls, paint finish, flooring, ceiling, light fixtures/chandeliers, windows, doors, and camera perspective.
- Do NOT alter any part of the room outside the designated furniture position.
- Do NOT hallucinate or add new architectural features, windows, rugs, or walls that do not exist in Image 1.
- ${preservedItemsText}
- All modifications must be STRICTLY and EXCLUSIVELY confined to the surface of the target ${pinName} at ${positionDesc}.

LIGHTING & PERSPECTIVE INTEGRATION:
- Seamlessly blend the new fabric texture into Image 1 using Image 1's existing ambient room lighting, color temperature, and realistic floor contact shadows.
- Strictly preserve Image 1's exact camera framing, orientation, and perspective.`;
  }

  const furnitureDescription = prompt || (furnitureTypeSpec ? `${furnitureTypeSpec} upholstered in ${fabricSpec || "designer fabric"}` : pinName);

  return `Task: Surgical in-room furniture placement.

PRIMARY INPUT:
- Image 1 is the user's authentic room photograph.

STRICT ROOM PRESERVATION MANDATE:
- Image 1 is the REAL ROOM ENVIRONMENT. You MUST preserve the exact room in Image 1: identical architectural layout, walls, paint finish, flooring, ceiling, light fixtures/chandeliers, windows, doors, and camera perspective.
- Do NOT alter any part of the room outside the designated furniture position.
- Do NOT hallucinate or add new architectural features, windows, rugs, or walls that do not exist in Image 1.
- ${preservedItemsText}
- All modifications must be STRICTLY and EXCLUSIVELY confined to the target ${pinName} bounding zone (${positionDesc}).

TARGET ITEM REPLACEMENT:
- In Image 1, replace ONLY the ${pinName} at ${positionDesc}.
- Replace with: ${furnitureDescription}.${customFabricAndTypeDirective}

LIGHTING & PERSPECTIVE INTEGRATION:
- Seamlessly integrate the new furniture into Image 1 using Image 1's existing ambient room lighting, color temperature, and realistic floor contact shadows.
- Strictly preserve Image 1's exact camera framing, orientation, and perspective.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const {
      prompt,
      roomImage,
      referenceImage,
      catalogImageUrl,
      fabricSwatchImage,
      fabricSpec = "",
      furnitureTypeSpec = "",
      useFluxKlein = true,
      pinInfo,
      allPins = [],
      referenceDescription = "",
      activeOption = "B",
      aspectRatio,
      resolution,
      roomWidth,
      roomHeight,
    } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey =
      Deno.env.get("REPLICATE_API_KEY") ||
      Deno.env.get("REPLICATE_API_TOKEN") ||
      Deno.env.get("replicate_api_key") ||
      req.headers.get("x-replicate-key") ||
      "";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Replicate API token missing" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default to black-forest-labs/flux-2-klein-4b unless explicitly disabled
    const isFluxModel = useFluxKlein !== false;
    const modelIdentifier = isFluxModel ? "black-forest-labs/flux-2-klein-4b" : "google/nano-banana-pro";
    const images: string[] = [];

    if (roomImage) {
      const formattedRoom = roomImage.startsWith("data:") || roomImage.startsWith("http")
        ? roomImage
        : `data:image/jpeg;base64,${roomImage}`;
      images.push(formattedRoom);
    } else {
      images.push("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85");
    }

    const hasReference = Boolean(referenceImage || catalogImageUrl);
    if (referenceImage) {
      const formattedRef = referenceImage.startsWith("data:") || referenceImage.startsWith("http")
        ? referenceImage
        : `data:image/jpeg;base64,${referenceImage}`;
      images.push(formattedRef);
    } else if (catalogImageUrl) {
      images.push(catalogImageUrl);
    }

    if (fabricSwatchImage) {
      const formattedSwatch = fabricSwatchImage.startsWith("data:") || fabricSwatchImage.startsWith("http")
        ? fabricSwatchImage
        : `data:image/jpeg;base64,${fabricSwatchImage}`;
      images.push(formattedSwatch);
    }

    // Determine exact aspect_ratio strictly from the flat/room image ("1:1", "2:3", or "3:2")
    const allowedRatios = ["1:1", "2:3", "3:2"];
    let targetAspectRatio = "3:2";
    if (aspectRatio && allowedRatios.includes(aspectRatio)) {
      targetAspectRatio = aspectRatio;
    } else if (roomWidth && roomHeight) {
      const ratio = Number(roomWidth) / (Number(roomHeight) || 1);
      targetAspectRatio = ratio > 1.18 ? "3:2" : ratio < 0.85 ? "2:3" : "1:1";
    }

    // Use "1K" resolution by default for fast generation speed and free-plan efficiency
    const targetResolution = resolution === "2K" || resolution === "4K" ? resolution : "1K";

    const stagingPrompt = buildStagingPrompt({
      pinInfo,
      allPins,
      prompt,
      referenceDescription,
      activeOption,
      hasReferenceImage: hasReference,
      targetAspectRatio,
      fabricSpec,
      furnitureTypeSpec,
      hasFabricSwatchImage: Boolean(fabricSwatchImage),
      isFluxModel,
    });

    const inputPayload = isFluxModel
      ? {
          prompt: stagingPrompt,
          images: images,
          aspect_ratio: targetAspectRatio,
          output_megapixels: "1",
          output_format: "jpg",
          output_quality: 95,
          go_fast: true,
        }
      : {
          prompt: stagingPrompt,
          image_input: images,
          aspect_ratio: targetAspectRatio,
          resolution: targetResolution,
          output_format: "jpg",
          safety_filter_level: "block_only_high",
          allow_fallback_model: true,
        };

    let repResponse = await fetch(`https://api.replicate.com/v1/models/${modelIdentifier}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({ input: inputPayload }),
    });

    if (repResponse.status === 429) {
      const errData = await repResponse.json().catch(() => ({}));
      const waitSecs = errData.retry_after ? Number(errData.retry_after) + 1 : 8;
      await new Promise((r) => setTimeout(r, waitSecs * 1000));
      repResponse = await fetch(`https://api.replicate.com/v1/models/${modelIdentifier}/predictions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Prefer": "wait",
        },
        body: JSON.stringify({ input: inputPayload }),
      });
    }

    if (!repResponse.ok) {
      const errText = await repResponse.text();
      return new Response(JSON.stringify({ error: `Replicate API error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prediction = await repResponse.json();
    let pollAttempts = 0;
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      pollAttempts < 60
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      pollAttempts++;
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      }
    }

    if (prediction.status === "succeeded" && prediction.output) {
      const rawUrl = Array.isArray(prediction.output) ? prediction.output[0] : String(prediction.output);

      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: rawUrl,
          modelUsed: modelIdentifier,
          durationMs: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(prediction.error || "Image staging generation timed out");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
