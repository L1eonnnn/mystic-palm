import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with increased payload limits for base64 images
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy init of Gemini Client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("宇宙深处传来回音：请先在 AI Studio Build 的 Settings > Secrets 面板中配置您的 GEMINI_API_KEY 密钥。");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Lazy init of OpenAI Client
let openaiInstance: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("宇宙深处传来回音：请先在 AI Studio Build 的 Settings > Secrets 面板中配置您的 OPENAI_API_KEY 密钥。");
    }
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiInstance;
}

// REST route for palm analysis
app.post("/api/analyze-palm", async (req, res) => {
  try {
    const { base64Image, mimeType, focus, modelId, handType } = req.body;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: "参数不完整，缺少图像数据" });
    }

    // Determine the model to use
    const isOpenAI = modelId && modelId.startsWith("gpt");
    const targetModel = modelId || "gemini-3.5-flash";

    const handContext = handType === 'right' 
      ? '这是用户的右手，在传统手相学中代表后天运势、当下状态、自身的努力奋斗与近期的转变。' 
      : '这是用户的左手，在传统手相学中代表先天命格、基因禀赋、与生俱来的天赋特质与内在潜能。';

    const prompt = `
      You are a wise, philosophical, and deeply insightful mystical palm reader with decades of practice.
      Analyze this image of a palm and provide an exhaustive, accurate, and uplifting palmistry reading.
      Please write your entire reply in Simplified Chinese with an elegant, mystical, and authoritative yet warm tone.
      
      【重要背景信息】
      ${handContext} 请在解读时将左右手的这一深刻内涵融入字里行间，呈现出千人千面的绝妙体验，避免硬套通用说辞，让用户感受到这位执掌乾坤的“古老智者”正在温和地拂去掌心尘埃。

      Your review MUST follow this exact structure of Markdown heading sections (H2):
      ## 整体能量与掌型
      (Describe the general hand shape, skin tone, finger features, and overall energy. Discuss its direct relation to ${handType === 'right' ? 'the active post-birth development' : 'the innate talent and base attributes'}.)
      
      ## 生命线深度解析
      (Thoroughly identify the life line: check its length, boldness, curves, color, any breaks, islands, or stars. Connect this to biological energy, resilience, and life changes.)
      
      ## 智慧线深度解析
      (Locate the head line: identify its origin point, exit angle, depth, splits, and length. Relate directly to logical mindset, imagination, learning style, and life focus.)
      
      ## 感情线深度解析
      (Locate the heart line: analyze its starting path, curvature, splitting branches at the end, and gaps. Unveil the underlying attachment styles, empathy, romantic pathways, and emotional expression.)
      
      ## 事业线及其他特写（若可见）
      (Carefully observe the fate line rising vertically from base of palm, sun lines, or minor marks. Analyze its clarity as relative to personal initiative or external forces.)
      
      ## 婚姻线与家庭情缘深度解析（若可见）
      (Look at the small horizontal lines on the edge under the pinky. Discuss deep relationships, loyalty, timing of core unions, and general intimacy patterns.)
      
      ## 专属命运启示
      (Sum up with an extremely personalized, poetic, and highly inspiring divine advice that encourages personal growth and confidence. Make them feel empowered.)

      Please keep the explanations detailed, professional, and full of historical cultural depth, but maintain a helpful and safe perspective (avoid deterministic negative statements, never give health or medical diagnosis, instead reframe warnings as opportunities to grow).

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

    if (isOpenAI) {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: targetModel,
        messages: [
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
        max_tokens: 4096,
      });
      resultText = response.choices[0]?.message?.content || "";
    } else {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            },
            {
              text: `${prompt}\n\n${
                focus && focus !== "全部" 
                  ? `特别重点：用户目前非常渴求和关注【${focus}】。请在这个方向提供极为详尽、多维度的探讨，多花3倍以上的篇幅和细节为用户拨开尘雾。` 
                  : ""
              }`
            }
          ]
        }
      });
      resultText = response.text || "";
    }

    res.json({ output: resultText });
  } catch (error: any) {
    console.error("Palm API Error:", error);
    res.status(500).json({ error: error.message || "宇宙网络出现神秘震荡，请稍后重试" });
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
