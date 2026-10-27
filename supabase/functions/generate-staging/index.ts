import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-replicate-key",
};

function buildStagingPrompt({ pinInfo, allPins = [], prompt, referenceDescription, activeOption, hasReferenceImage, targetAspectRatio = "3:2" }: any) {
  const pinName = pinInfo?.name || "furniture piece";
  const category = (pinInfo?.category || "sofa").toLowerCase();
  const x = Number(pinInfo?.x || 50);
  const y = Number(pinInfo?.y || 50);

  let positionDesc = `in the central area of the room (around ${x}% from left, ${y}% from top)`;
  let sideDesc = "central area";
  if (x >= 60) {
    positionDesc = `situated on the right side of the room (around ${x}% from left, ${y}% from top, in front of the window)`;
    sideDesc = "right side";
  } else if (x <= 40) {
    positionDesc = `situated on the left side of the room (around ${x}% from left, ${y}% from top)`;
    sideDesc = "left side";
  }

  const otherItems = Array.isArray(allPins) ? allPins.filter((p: any) => p.id !== pinInfo?.id) : [];
  const chairPins = otherItems.filter((p: any) => p.category === "chair" || (p.name && p.name.toLowerCase().includes("chair")));

  let chairProtectionText = "the non-target chairs in the room must be preserved in their exact original form";
  if (chairPins.length > 0) {
    const chairNames = chairPins.map((c: any) => c.name).join(", ");
    chairProtectionText = `${chairNames} must be preserved in their exact original form and position`;
  }

  if (hasReferenceImage || activeOption === "C") {
    const hasSpec = Boolean(referenceDescription && referenceDescription.trim().length > 0);
    const refSpec = hasSpec
      ? referenceDescription.trim()
      : (prompt && !prompt.includes("exact architectural") ? prompt : "the exact architectural furniture shown in Image 2");

    const cushionDirective = hasSpec
      ? `- CUSHION COUNT & SECTION DIVISION: The replacement furniture in Image 1 must adopt the exact cushion division, seat sections, and silhouette of Image 2. If Image 2 shows a 2-seater / loveseat with exactly two cushions, the replacement in Image 1 must be rendered with strictly two cushions and two seat sections.\n`
      : "";

    return `Task: Surgical architectural furniture replacement in Image 1.

TARGET OBJECT TO REPLACE:
- In Image 1, replace ONLY the ${pinName} ${positionDesc}.
- Remove the existing item's geometry and replace it completely.

NEW FURNITURE SPECIFICATION (FROM IMAGE 2):
- Insert the exact furniture piece shown in Image 2 into the target ${category} position on the ${sideDesc} of Image 1.
- Detailed reference specification: ${refSpec}.
${cushionDirective}- MATERIAL & COLOR FIDELITY: Replicate the exact upholstery material (fabric weave, velvet, leather, or bouclé), color hue, texture, stitching details, armrest shape, and base legs shown in Image 2.

PRESERVATION OF EXISTING ROOM & FLAT ASPECT RATIO:
- Strictly preserve Image 1's (the flat/room photo's) exact camera framing, orientation, and ${targetAspectRatio} aspect ratio. Do NOT adopt the aspect ratio, cropping, or resolution of Image 2 (the furniture reference photo).
- Preserve all existing non-target furniture in Image 1 in their original state.
- Specifically: ${chairProtectionText}.
- Preserve the center coffee table, patterned floor rug, credenza/sideboard, framed wall photos, indoor plants, windows, walls, and flooring exactly as shown in Image 1.
- Confine all modifications strictly and exclusively to the target ${category} zone on the ${sideDesc}.

PERSPECTIVE & LIGHTING:
- Position the new furniture naturally on the floor rug with realistic ambient contact shadows and daylight illumination matching the window on the right.`;
  }

  return `Task: Architectural furniture replacement in Image 1.

TARGET OBJECT TO REPLACE:
- In Image 1, replace ONLY the ${pinName} ${positionDesc}.
- Replace with: ${prompt}.

PRESERVATION OF EXISTING ROOM & FLAT ASPECT RATIO:
- Strictly preserve Image 1's (the flat/room photo's) exact camera framing, orientation, and ${targetAspectRatio} aspect ratio.
- Preserve all existing non-target furniture in Image 1 in their original state.
- Specifically: ${chairProtectionText}.
- The center coffee table, rug, credenza/sideboard, gallery wall, plants, and windows must remain completely preserved.
- Confine changes strictly to the target ${pinName} on the ${sideDesc}.

PERSPECTIVE & LIGHTING:
- Match Image 1's 3D perspective, realistic floor contact shadows, and ambient daylight illumination.`;
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

    const modelIdentifier = "google/nano-banana-pro";
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

    // Determine exact Nano Banana Pro aspect_ratio strictly from the flat/room image ("1:1", "2:3", or "3:2")
    // Never use "match_input_image" when multiple images are passed, as Image 2 (furniture ref) can override Image 1 (flat)
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
    });

    const inputPayload = {
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
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
