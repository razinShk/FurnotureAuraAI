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
          prompt: `Analyze this room photo and detect 6 to 8 main visible furniture pieces and components (sofas, tables, chairs, flooring, walls, lamps).
Return strictly valid JSON only:
{
  "roomVibe": "short description of style",
  "lightingConditions": "short description of lighting",
  "palette": ["#F5F5F5", "#333333", "#C19A6B", "#1B4D3E"],
  "components": [
    {
      "name": "descriptive name (e.g. Modern Leather Sofa)",
      "category": "sofa",
      "x": 50,
      "y": 55,
      "width": 45,
      "height": 35,
      "styleSuggestion": "brief styling recommendation"
    }
  ]
}`,
          max_new_tokens: 512,
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
      const outputText = Array.isArray(prediction.output)
        ? prediction.output.join("")
        : String(prediction.output);

      const cleaned = outputText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      let apiResult = null;

      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          apiResult = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
        } catch (_) {}
      }

      if (!apiResult) {
        const arrStart = cleaned.indexOf("[");
        const arrEnd = cleaned.lastIndexOf("]");
        if (arrStart !== -1 && arrEnd !== -1) {
          try {
            apiResult = { components: JSON.parse(cleaned.slice(arrStart, arrEnd + 1)) };
          } catch (_) {}
        }
      }

      if (apiResult && Array.isArray(apiResult.components)) {
        apiResult.components = apiResult.components.map((c: any, idx: number) => ({
          ...c,
          id: c.id ? String(c.id) : `pin-${idx + 1}-${Date.now().toString(36)}`,
          name: c.name || `Furniture Spot ${idx + 1}`,
          category: c.category || "sofa",
          x: Math.max(5, Math.min(95, Number(c.x || (25 + (idx * 12) % 60)))),
          y: Math.max(5, Math.min(95, Number(c.y || (30 + (idx * 10) % 55)))),
          boxW: Math.max(14, Math.min(80, Number(c.boxW || c.width || 34))),
          boxH: Math.max(12, Math.min(65, Number(c.boxH || c.height || 22)))
        }));
      }

      return new Response(JSON.stringify({ 
        success: true, 
        modelUsed: `lucataco/qwen2-vl-7b-instruct:${QWEN_VERSION.slice(0, 8)}`,
        ...(apiResult || {}) 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(prediction.error || "Vision analysis timed out");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
