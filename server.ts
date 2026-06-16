import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

// Memory store for verification codes: email -> { code, expires }
const verificationCodes = new Map<string, { code: string; expires: number }>();

// Set up JSON body parser with increased payload limits for base64 images
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Dynamic init of OpenRouter / ZenMux Client
function getOpenRouterClient(): OpenAI {
  const zenmuxKey = process.env.ZENMUX_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  // Prioritize ZenMux API key as requested by the user, fallback to OpenRouter.
  let apiKey = zenmuxKey || openrouterKey;
  let baseURL = "https://zenmux.ai/api/v1";

  if (openrouterKey && !zenmuxKey) {
    apiKey = openrouterKey;
    baseURL = "https://openrouter.ai/api/v1";
  }

  if (!apiKey) {
    throw new Error("宇宙深处传来回音：请先在 AI Studio Build 的 Settings > Secrets 面板中配置您的 ZENMUX_API_KEY 或 OPENROUTER_API_KEY 密钥。");
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL
  });
}

function getOpenRouterModelId(modelId: string): string {
  // Strip OpenRouter-specific free suffix ":free" for ZenMux compatibility
  const cleanedModelId = modelId.endsWith(':free') ? modelId.replace(/:free$/, '') : modelId;

  const mapping: Record<string, string> = {
    "gemini-3.5-flash": "google/gemini-2.5-flash",
    "gemini-3.1-flash-lite": "google/gemini-2.5-flash",
    "google/gemini-3-pro-image": "google/gemini-2.5-pro", // Fallback for the custom option
    "gpt-4o": "openai/gpt-4o",
    "gpt-4o-mini": "openai/gpt-4o-mini"
  };
  return mapping[cleanedModelId] || cleanedModelId;
}

async function callOpenRouterWithRetry(
  openrouter: OpenAI,
  model: string,
  messages: any[],
  maxTokens: number = 4096
): Promise<any> {
  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
    });
    return response;
  } catch (error: any) {
    const errorMessage = error.message || "";
    const is402 = error.status === 402 ||
                 errorMessage.includes("402") ||
                 errorMessage.toLowerCase().includes("credits") ||
                 errorMessage.toLowerCase().includes("afford") ||
                 errorMessage.toLowerCase().includes("max_tokens");

    if (is402) {
      console.warn(`[OpenRouter Dynamic Scaling] Credit limit or token count error captured on server: "${errorMessage}"`);
      // Parse "can only afford X"
      const match = errorMessage.match(/can only afford (\d+)/i);
      let affordableTokens = 0;
      if (match && match[1]) {
        affordableTokens = parseInt(match[1], 10);
      }

      if (affordableTokens > 150) {
        // Reserve slightly fewer tokens than the exact threshold to guarantee authorization clearance
        const saferLimit = Math.max(100, affordableTokens - 35);
        console.log(`[Self-Healing] Retrying within current balance capability on server - setting max_tokens to ${saferLimit}`);
        try {
          return await openrouter.chat.completions.create({
            model,
            messages,
            max_tokens: saferLimit,
          });
        } catch (retryErr: any) {
          console.error(`[Self-Healing] Server-side retry with safer limit failed:`, retryErr);
          throw retryErr;
        }
      } else {
        const fallbackLimit = maxTokens > 1500 ? 1000 : 500;
        if (fallbackLimit < maxTokens) {
          console.log(`[Self-Healing] Retrying on server with general conservative token limit of ${fallbackLimit}`);
          try {
            return await openrouter.chat.completions.create({
              model,
              messages,
              max_tokens: fallbackLimit,
            });
          } catch (retryErr: any) {
            console.error(`[Self-Healing] Server-side generic fallback retry failed:`, retryErr);
            throw retryErr;
          }
        }
      }
    }
    throw error;
  }
}

// API Route to generate and send verification code
app.post("/api/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "电子邮箱地址不能为空..." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Generate a secure 4-digit token
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Valid for 10 minutes (600,000 ms)
    verificationCodes.set(trimmedEmail, {
      code,
      expires: Date.now() + 10 * 60 * 1000,
    });

    const hasSmtpConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    let provider = "demo";

    if (hasSmtpConfig) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "465"),
          secure: process.env.SMTP_PORT === "465", // true for 465, false for 587/other
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const fromName = process.env.SMTP_FROM_NAME || "MysticPalm 占星殿";
        const mailOptions = {
          from: `"${fromName}" <${process.env.SMTP_USER}>`,
          to: trimmedEmail,
          subject: `✨ 命格觉醒！您的天人共振星轨密匙 [${code}] 已到达`,
          html: `
            <div style="background-color: #0b0818; color: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border-radius: 24px; border: 1px solid rgba(234, 179, 8, 0.3); max-w-md; margin: 20px auto; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); border-bottom: 4px solid #eab308;">
              <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.4); line-height: 60px; font-size: 32px; margin-bottom: 20px;">🔮</div>
              <h1 style="color: #eab308; margin: 0 0 5px 0; font-size: 26px; font-weight: bold; letter-spacing: 1.5px;">MysticPalm 占星殿</h1>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 0; letter-spacing: 4px; text-transform: uppercase; font-weight: 600;">Cosmic Destiny Portal</p>
              <hr style="border: 0; border-top: 1px solid rgba(234, 179, 8, 0.15); margin: 25px 0;" />
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; text-align: left; margin-bottom: 15px;">尊敬的天命行者：</p>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; text-align: left; text-indent: 2em; margin-bottom: 30px;">您收到此神圣信件，是因为您的星盘能量正在向您掌心汇聚，并正试图开启或登录您的「命运档案」。请填入以下由虚空网格投射而来的4位星轨密匙，以完成最后的精神共振：</p>
              
              <div style="background: rgba(234, 179, 8, 0.05); border: 2px solid #eab308; border-radius: 16px; padding: 24px; font-size: 40px; font-family: 'Georgia', 'Courier New', Courier, monospace; letter-spacing: 12px; color: #eab308; font-weight: bold; margin: 24px 0; box-shadow: 0 4px 15px rgba(234,179,8,0.15); text-indent: 12px;">
                ${code}
              </div>
              
              <p style="color: #f43f5e; font-size: 11px; margin-top: 24px; line-height: 1.5; font-style: italic;">* 此星轨密匙的半衰期为 10 分钟。请务必妥善保管，勿将其投映或泄露给其他维度的观测者。</p>
              <hr style="border: 0; border-top: 1px solid rgba(234, 179, 8, 0.1); margin: 30px 0 15px 0;" />
              <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">MysticPalm SECURED INTEGRITY SYSTEM &copy; ${new Date().getFullYear()}</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        provider = "smtp";
        console.log(`[SMTP] Successfully dispatched verification code email to ${trimmedEmail}`);
      } catch (smtpError) {
        console.error("[SMTP] SMTP email transport threw error. Falling back to celestial demo simulator mode.", smtpError);
        provider = "demo-fallback";
      }
    } else {
      console.log(`[Demo] No SMTP parameters found in env. Falling back to celestial demo simulator mode for ${trimmedEmail}`);
    }

    return res.json({
      success: true,
      provider,
      // If we are in demo or fallback mode, provide the code so our in-app cosmic simulation inbox on screen can capture & present it
      code: provider.startsWith("demo") ? code : undefined,
    });
  } catch (error: any) {
    console.error("Verification code delivery error:", error);
    res.status(500).json({ error: error.message || "无法绑定虚空，请检查路径重试" });
  }
});

// API Route to verify the code
app.post("/api/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "邮箱和验证助记码不能为空" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const savedRecord = verificationCodes.get(trimmedEmail);

    if (!savedRecord) {
      return res.status(400).json({ error: "没有找到对应邮箱的占卜请求，请重试获取密匙" });
    }

    if (Date.now() > savedRecord.expires) {
      verificationCodes.delete(trimmedEmail);
      return res.status(400).json({ error: "星轨密匙已被时间洪流吞噬（验证码已过期），请重新发信发送" });
    }

    if (savedRecord.code !== code.trim()) {
      return res.status(400).json({ error: "星轨密匙无法产生心之律动，请再次校准输入" });
    }

    // Success! Revoke code after dynamic matching
    verificationCodes.delete(trimmedEmail);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Codes evaluation endpoint error:", error);
    res.status(500).json({ error: error.message || "密钥校验失败，请连接高维网络后重试" });
  }
});

// REST route for palm analysis
app.post("/api/analyze-palm", async (req, res) => {
  try {
    const { base64Image, mimeType, focus, modelId, handType } = req.body;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: "参数不完整，缺少图像数据" });
    }

    // Determine the model to use
    const targetModel = modelId || "google/gemini-2.5-flash";

    const handContext = handType === 'right' 
      ? '这是用户的右手，在传统手相学中代表后天运势、当下状态、自身的努力奋斗与近期的转变。' 
      : '这是用户的左手，在传统手相学中代表先天命格、基因禀赋、与生俱来的天赋特质与内在潜能。';

    const prompt = `
      You are an elite, deeply mystical palm reader who is also a world-class cognitive psychologist and modern intuitive astrologer. 
      You blend the ancient symbolic art of palmistry with contemporary behavioral archetypes (such as Enneagram, Jungian shadows, attachment theory, and MBTI dualities) to create a deeply resonant, highly specific "Horoscope-Style Personality & Destiny Portrait" that feels unbelievably tailored to their unique palm lines.

      Write your entire reply in Simplified Chinese. Keep your tone elegant, deeply philosophical, mysterious yet warm, highly analytical, and full of psychological resonance.
      Avoid generic, templated placeholder phrases (e.g., avoid saying "you are unique", "your life is beautiful" in a generic way). Instead, use precise metaphorical terminology like "双重认知分叉" (cognitive divergence), "金星丘的情感热效应" (Venusian emotional thermal effect), or "主动防御型心智" (active-defense mindset). Make the reading feel incredibly rich, detailed, and intellectually satisfying.

      【关于左右手的重要内涵】
      ${handContext} 请在解读时将左右手的这一深刻内涵融入字里行间，呈现出千人千面的绝妙体验，避免硬套通用说辞。

      Your review MUST follow this exact structure of Markdown heading sections (H2):
      ## 整体能量与「星核掌型」
      (No generic greetings. Identify their palm form under a unique "Astrological Element & Temperament Archetype" (e.g. 灵风哲人型, 烈火先锋型, 深水共鸣型, 磐石筑梦型). Analyze the texture, active vs. passive muscle tone, and the "vibe" of their energy. Connect this directly to their core psychological engine: how they react to sudden stress, their innate communication style, and their primary drive in life.)
      
      ## 生命线解析：「意志律动与能量丰度」
      (Thoroughly identify the life line. Do not just talk about health or life expectancy. Analyze their "willpower rhythm" and physical battery: Are they "sprint-and-crash" types or slow-burn endurance masters? Check the arc wrapper: does it restrict the Venus mound (signifying emotional reserve, strict physical boundaries) or expand wide into the palm (warm, social, high energetic output)? Highlight any subtle branching, islands, or secondary lines as markers of significant psychological shifts, rebirths, or ancestral guidance.)
      
      ## 智慧线解析：「认知极性、思绪流向与直觉天赋」
      (Analyze the head line. Define their cognitive style: Divergent (branching, creative, prone to analysis-paralysis) or Convergent (deep, laser-focused, practical). Look at the slope towards the Mount of Moon: does it bend into intuitive, artistic dreamscape territory, or cut straight across like a rational blade? Pinpoint their primary decision-making bottleneck (e.g., fear of missing out, chasing pure logic, overthinking emotional inputs) and their unique intuition style.)
      
      ## 感情线解析：「依恋原色、心墙密码与情感潮汐」
      (Analyze the heart line. Unveil their attachment style in relationships (Secure, Anxious, Avoidant, or Fearful-Avoidant) and how they build emotional "fences". Read the ending curves: does it lift towards the Jupiter mount (idealistic, high standards, quiet devotion) or run flat under Saturn (practical, self-protective, needing tangible security)? Discuss their unique emotional triggers, coping mechanisms for vulnerability, and the hidden aesthetic of their romantic soul.)
      
      ## 事业线及命运刻度（若可见）
      (Locate the fate line rising from the base. Define their archetype of achievement: a "Sovereign Creator" (active initiative) or a "Synchronicity Navigator" (flowing with timing and environment). Discuss how their inner growth phases directly translate to external career transitions, and analyze how they handle ambition versus spiritual peace.)
      
      ## 羁绊边界与亲密演变（若可见）
      (Analyze the horizontal marks on the pinky-edge. Do not give deterministic counts of marriages. Instead, discuss their capacity for deep companionship, their evolutionary growth curves in intimacy, their fear of losing individuality, and how they resolve the delicate tension between freedom and deep commitment.)
      
      ## 专属星尘启示与灵魂共振
      (Summarize with an extremely personalized, poetic, and intellectually transformative "astrology-style" guidance. Reframe potential challenges as sacred keys to growth. Deliver 3 specific, highly customized "Soul Catalysts" (灵魂催化剂) written in beautiful display structure that they can act on to align their physical life with their spiritual blueprint.)

      Please keep the explanations detailed, professional, and full of historical, psychological, and astrological depth. Never give medical / legal / hard-deterministic predictions; reframe everything into a guide for self-exploration and spiritual empowerment.

      ---
      **IMPORTANT: COMPUTER VISION EXTRACTION FOR PAINTS**
      Now, take off the fortune teller hat and wear your developer computer vision researcher hat. You need to map the identified lines onto a 100x100 grid where (0,0) is top-left and (100,100) is bottom-right.
      
      Please try to match the actual hand crease positions as precisely as possible. Pay attention to whether the client has selected a left hand or right hand, and trace coordinates that accurately map onto standard hand anatomy in that orientation.
      
      Coordinate Extraction guidelines:
      1. 生命线 (Life Line): Arcs down wrapping around the thumb's muscle mount (Venus Mound).
      2. 智慧线 (Head Line): Originates near or touching the life line between index finger and thumb, running horizontally across the palm center.
      3. 感情线 (Heart Line): High horizontal line below the fingers, running from the pinky mount to the index/middle finger gap.
      4. 事业线 (Fate Line): Runs vertically from the palm bottom up towards the middle finger base.
      5. 婚姻线 (Marriage Line): Short horizontal marks on the pinky-side edge.

      For the main visible lines, sample high-density points (about 5-10 points per line) to trace smooth splines. If any line is genuinely not present or obscured, do not invent points for it.

      At the very end of your response, you MUST append a JSON block containing the coordinate points. Color styles:
      - 生命线: #10b981
      - 感情线: #f43f5e
      - 智慧线: #0ea5e9
      - 事业线: #eab308
      - 婚姻线: #a855f7

      Format standard:
      \`\`\`json
      {
        "lines": [
          {
            "name": "生命线",
            "color": "#10b981",
            "points": [{"x": 30, "y": 48}, {"x": 35, "y": 55}, {"x": 42, "y": 64}, {"x": 44, "y": 74}, {"x": 38, "y": 83}]
          },
          {
            "name": "智慧线",
            "color": "#0ea5e9",
            "points": [{"x": 30, "y": 48}, {"x": 40, "y": 52}, {"x": 55, "y": 55}, {"x": 70, "y": 62}]
          },
          {
            "name": "感情线",
            "color": "#f43f5e",
            "points": [{"x": 75, "y": 42}, {"x": 60, "y": 38}, {"x": 45, "y": 36}, {"x": 30, "y": 32}]
          }
        ]
      }
      \`\`\`
    `;

    let resultText = "";

    const openrouter = getOpenRouterClient();
    const openrouterModel = getOpenRouterModelId(targetModel);
    
    const response = await callOpenRouterWithRetry(
      openrouter,
      openrouterModel,
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${prompt}\n\n${
                focus && focus !== "全部" 
                  ? `特别重点：用户目前非常渴求和关注【${focus}】。请在这个方向提供极为详尽、多维度的探讨，多花3倍以上的篇幅和细节为用户拨开尘雾。` 
                  : ""
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              }
            }
          ]
        }
      ],
      4096
    );
    resultText = response.choices[0]?.message?.content || "";

    res.json({ output: resultText });
  } catch (error: any) {
    console.error("Palm API Error:", error);
    res.status(500).json({ error: error.message || "宇宙网络出现神秘震荡，请稍后重试" });
  }
});

// REST route for image generation matching the serverless equivalent
app.post("/api/generate-image", async (req, res) => {
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
        console.log(`[Express Image] Generating via OpenRouter/ZenMux model: ${model}`);
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
          console.warn(`[Express Image] OpenRouter returned status ${response.status}:`, errorText);
        }
      } catch (orError) {
        console.warn("[Express Image] Failed during OpenRouter fetching, using celestial fallback:", orError);
      }
    }

    // High fidelity, free direct rendering fallback via Pollinations AI.
    // Extremely fast and gorgeous, guarantees success even without an API Key or during network failures.
    const styleMap: Record<string, string> = {
      "ideogram": "detailed graphic vector illustration, beautiful typography matching high contrast",
      "recraft": "flat design vector style, gorgeous clean illustrations, 2d style",
      "flux": "hyperrealistic 8K photorealistic concept digital masterpiece, high-fidelity fine art",
      "midjourney": "highly photorealistic celestial fantasy concept art, stardust, breathtaking volumetric lighting cinematics",
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
    console.error("General Handler Error in Express Image Generator API:", error);
    res.status(500).json({ error: error.message || "命运刻蚀出错，无法唤醒画布" });
  }
});

// Configure Vite middleware in development or static hosting in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in Development mode with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in Production mode with static file delivery...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start Vite middleware server:", err);
});
