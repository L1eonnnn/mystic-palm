import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Lazy init of Gemini Client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!aiInstance) {
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
function getOpenAIClient(apiKey: string): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiInstance;
}

export default async function handler(req: any, res: any) {
  // Support CORS if needed
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
    const { base64Image, mimeType, focus, modelId, handType } = req.body;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: "参数不完整，缺少图像数据" });
    }

    const isOpenAI = modelId && modelId.startsWith("gpt");
    const targetModel = modelId || "gemini-3.5-flash";

    // Select correct API Key
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!isOpenAI && !geminiKey) {
      return res.status(401).json({ error: "宇宙深处传来回音：请先在主控面板配置您的 GEMINI_API_KEY 密钥。" });
    }
    if (isOpenAI && !openaiKey) {
      return res.status(401).json({ error: "宇宙深处传来回音：请先在主控面板配置您的 OPENAI_API_KEY 密钥。" });
    }

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

    if (isOpenAI) {
      const openai = getOpenAIClient(openaiKey!);
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
      const ai = getGeminiClient(geminiKey!);
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

    return res.status(200).json({ output: resultText });
  } catch (error: any) {
    console.error("Vercel Serverless Function error:", error);
    return res.status(500).json({ error: error.message || "内部服务器错误" });
  }
}
