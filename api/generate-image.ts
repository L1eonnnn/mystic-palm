import fetch from "node-fetch";

export default async function handler(req: any, res: any) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, model, aspectRatio, style, lighting, camera, shotType } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "咒语Prompt不能为空哦。" });
    }

    // Construct enhanced prompt
    let fullPrompt = prompt;
    const details = [];
    if (style && style !== 'none') details.push(`${style}`);
    if (lighting && lighting !== 'none') details.push(`${lighting} lighting`);
    if (camera && camera !== 'none') details.push(`captured with ${camera}`);
    if (shotType && shotType !== 'none') details.push(`${shotType} shot`);
    
    if (details.length > 0) {
      fullPrompt = `${prompt}, ${details.join(', ')}`;
    }

    const zenmuxKey = process.env.ZENMUX_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const apiKey = zenmuxKey || openrouterKey;
    let imageBaseUrl = "https://zenmux.ai/api/v1/images/generations";

    if (openrouterKey && !zenmuxKey) {
      imageBaseUrl = "https://openrouter.ai/api/v1/images/generations";
    }
    
    // If user specified an OpenRouter model and apiKey exists, attempt native OpenRouter call
    if (apiKey && model && model !== 'fallback') {
      try {
        console.log(`[Serverless Image] Generating via OpenRouter/ZenMux model: ${model}`);
        const response = await fetch(imageBaseUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            model: model,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const imageUrl = data.data?.[0]?.url || data.images?.[0];
          if (imageUrl) {
            return res.json({ success: true, url: imageUrl, source: model });
          }
        } else {
          const errorText = await response.text();
          console.warn(`[Serverless Image] OpenRouter returned status ${response.status}:`, errorText);
        }
      } catch (orError) {
        console.warn("[Serverless Image] Failed during OpenRouter fetching, using celestial fallback:", orError);
      }
    }

    // High fidelity, free direct rendering fallback via Pollinations AI.
    // Extremely fast and gorgeous, guarantees success even without an API Key or during network failures.
    const styleMap: Record<string, string> = {
      "ideogram": "detailed graphic vector illustration, beautiful typography matching high contrast",
      "recraft": "aesthetic vector art design illustration, clean 2D, minimal graphical masterwork",
      "flux": "hyperrealistic 8K photorealistic concept digital masterpiece, high-fidelity fine art",
      "midjourney": "whimsical volumetric lighting cinematics, breathtaking color grading and details, dreamlike rendering",
      "stable-diffusion": "classical oil canvas master painting, dynamic light interplay and epic composition"
    };

    let mappedStyle = "breathtaking celestial fantasy concept painting, cosmic stardust, fine-art masterpiece";
    const modelLower = (model || "").toLowerCase();
    for (const [key, val] of Object.entries(styleMap)) {
      if (modelLower.includes(key)) {
        mappedStyle = val;
        break;
      }
    }

    const randomSeed = Math.floor(Math.random() * 1000000);
    // Combine with aspect constraints
    let width = 1024;
    let height = 1024;
    if (aspectRatio === "16:9") {
      width = 1024;
      height = 576;
    } else if (aspectRatio === "9:16") {
      width = 576;
      height = 1024;
    } else if (aspectRatio === "4:3") {
      width = 1024;
      height = 768;
    } else if (aspectRatio === "2:3") {
      width = 768;
      height = 1152;
    }

    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt + ", " + mappedStyle)}?width=${width}&height=${height}&seed=${randomSeed}&enhance=true&nologo=true`;

    return res.json({
      success: true,
      url: pollinationUrl,
      source: "Celestial Flow Pipeline"
    });

  } catch (error: any) {
    console.error("General Handler Error in Image Generator API:", error);
    res.status(500).json({ error: error.message || "命运刻蚀出错，无法唤醒画布" });
  }
}
