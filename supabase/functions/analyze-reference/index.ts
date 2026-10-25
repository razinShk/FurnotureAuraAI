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

    // Call Replicate model google/gemini-2.5-flash for reference analysis
    const repRes = await fetch("https://api.replicate.com/v1/models/google/gemini-2.5-flash/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${repKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: "Analyze this reference furniture piece for 3D room staging. Describe: 1) exact furniture type and seating capacity (e.g. 2-seater sofa with exactly two cushions, single armchair, etc.), 2) cushion count and section division, 3) material, fabric texture and color, 4) armrest and leg design. Be concise, realistic and precise in 1-2 sentences.",
          images: [formattedImage],
          temperature: 0.1,
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

      return new Response(JSON.stringify({ success: true, description }), {
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
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
