import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-replicate-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const repKey =
      req.headers.get("x-replicate-key") ||
      Deno.env.get("REPLICATE_API_TOKEN") ||
      Deno.env.get("replicate_api_key") ||
      "";

    if (!repKey) {
      return new Response(JSON.stringify({ error: "Replicate API token missing" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let formattedImage = imageBase64;
    if (!formattedImage.startsWith("data:") && !formattedImage.startsWith("http")) {
      formattedImage = `data:${mimeType};base64,${imageBase64}`;
    }

    // Call Replicate model google/gemini-2.5-flash
    const repRes = await fetch("https://api.replicate.com/v1/models/google/gemini-2.5-flash/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${repKey}`,
        "Content-Type": "application/json",
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
          thinking_budget: 0,
        },
      }),
    });

    if (!repRes.ok) {
      const errText = await repRes.text();
      return new Response(JSON.stringify({ error: `Replicate API error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prediction = await repRes.json();
    let attempts = 0;
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      attempts < 50
    ) {
      await new Promise((r) => setTimeout(r, 1200));
      attempts++;
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Bearer ${repKey}` },
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      }
    }

    if (prediction.status === "succeeded" && prediction.output) {
      const outputText = Array.isArray(prediction.output)
        ? prediction.output.join("")
        : String(prediction.output);

      const cleaned = outputText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      let apiResult = null;

      if (jsonStart !== -1 && jsonEnd !== -1) {
        apiResult = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      } else {
        const arrStart = cleaned.indexOf("[");
        const arrEnd = cleaned.lastIndexOf("]");
        if (arrStart !== -1 && arrEnd !== -1) {
          apiResult = { components: JSON.parse(cleaned.slice(arrStart, arrEnd + 1)) };
        }
      }

      return new Response(JSON.stringify({ success: true, ...apiResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(prediction.error || "Vision analysis timed out");
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
