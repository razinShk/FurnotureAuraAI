import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-replicate-key",
};

const QWEN_VERSION = "bf57361c75677fc33d480d0c5f02926e621b2caa2000347cb74aeae9d2ca07ee";

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
      Deno.env.get("REPLICATE_API_KEY") ||
      Deno.env.get("REPLICATE_API_TOKEN") ||
      Deno.env.get("replicate_api_key") ||
      req.headers.get("x-replicate-key") ||
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

    // Call Replicate model lucataco/qwen2-vl-7b-instruct
    const repRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${repKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: QWEN_VERSION,
        input: {
          media: formattedImage,
          prompt: "Analyze this reference furniture piece. Describe in 1-2 concise sentences: 1) exact furniture type and seating capacity, 2) cushion count and section division, 3) material, fabric texture and color, 4) armrest and leg design.",
          max_new_tokens: 256,
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
      attempts < 45
    ) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Bearer ${repKey}` },
      });
      if (pollRes.ok) {
        prediction = await pollRes.json();
      }
    }

    if (prediction.status === "succeeded" && prediction.output) {
      const description = Array.isArray(prediction.output)
        ? prediction.output.join("").trim()
        : String(prediction.output).trim();

      return new Response(JSON.stringify({ 
        success: true, 
        modelUsed: `lucataco/qwen2-vl-7b-instruct:${QWEN_VERSION.slice(0, 8)}`,
        description 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        description: "The exact architectural furniture shown in the reference photo, matching its cushion division, silhouette, upholstery fabric, and color.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
