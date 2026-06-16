import OpenAI from "openai";

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
      console.warn(`[OpenRouter Dynamic Scaling] Credit limit or token count error captured: "${errorMessage}"`);
      // Parse "can only afford X"
      const match = errorMessage.match(/can only afford (\d+)/i);
      let affordableTokens = 0;
      if (match && match[1]) {
        affordableTokens = parseInt(match[1], 10);
      }

      if (affordableTokens > 150) {
        // Reserve slightly fewer tokens than the exact threshold to guarantee authorization clearance
        const saferLimit = Math.max(100, affordableTokens - 35);
        console.log(`[Self-Healing] Retrying within current balance capability - setting max_tokens to ${saferLimit}`);
        try {
          return await openrouter.chat.completions.create({
            model,
            messages,
            max_tokens: saferLimit,
          });
        } catch (retryErr: any) {
          console.error(`[Self-Healing] Retry with safer limit failed:`, retryErr);
          throw retryErr;
        }
      } else {
        const fallbackLimit = maxTokens > 1500 ? 1000 : 500;
        if (fallbackLimit < maxTokens) {
          console.log(`[Self-Healing] Retrying with general conservative token limit of ${fallbackLimit}`);
          try {
            return await openrouter.chat.completions.create({
              model,
              messages,
              max_tokens: fallbackLimit,
            });
          } catch (retryErr: any) {
            console.error(`[Self-Healing] Generic fallback retry failed:`, retryErr);
            throw retryErr;
          }
        }
      }
    }
    throw error;
  }
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

    const targetModel = modelId || "google/gemini-2.5-flash";

    // Select correct API Key
    const zenmuxKey = process.env.ZENMUX_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const activeKey = zenmuxKey || openrouterKey;

    if (!activeKey) {
      return res.status(401).json({ error: "宇宙深处传来回音：请先在主控面板配置您的 ZENMUX_API_KEY 或 OPENROUTER_API_KEY 密钥。" });
    }

    const handContext = handType === 'right' 
      ? '这是用户的右手，在传统手相学中代表后天运势、当下状态、自身的努力奋斗与近期的转变。' 
      : '这是用户的左手，在传统手相学中代表先天命格、基因禀赋、与生俱来的天赋特质与内在潜能。';

    const prompt = `
      You are an elite, deeply mystical Eastern metaphysician who has integrated traditional Palmistry, I Ching (易经), BaGua (八卦), and Traditional Chinese Medicine (中医学) diagnostics with modern intuitive character mapping.
      
      Write your entire reply in Simplified Chinese. Keep your tone highly professional, mysterious, extremely precise, and intellectually satisfying. We need the user to read this and say "This is incredibly, unbelievably accurate!" (要让用户觉得准).
      
      【关于左右手的重要内涵】
      ${handContext} 请在解读时将左右手的这一深刻内涵融入字里行间，呈现出千人千面的绝妙体验。
      
      Your review MUST follow this exact structure of Markdown H2 headings. Do NOT change the keywords in the H2 headings as they are used by the program to parse the sections.
      
      ## 整体能量与「星核掌型」之乾坤易医解析
      (Provide an elegant overview: Identify their hand shape under I Ching BaGua/Elements (e.g., 坤土、巽木、乾金, etc.). Discuss general muscle fullness, skin texture, Qi-Blood circulation, and their primary psychological and vital energy status. Analyze the hand palm color using the words "掌色" or "气血" or "手掌" to indicate their energy status.)
      
      ## 生命线之意志律动与先天元气精度分析
      (Specifically include detailed paragraphs about the following 3 points, making sure to use the specific keywords in each paragraph so they are parsed correctly):
      1. 生命线 (地纹)：Discuss the physical battery, origin point, trace arc, thickness, branches, island cracks, and warning targets (e.g., 32岁, 38岁, 45岁). Must contain the keywords "生命" or "体力". Detail the "线条关键点" (e.g., 起于震宫与巽宫交界, 弯曲弧度, 止于艮宫). Include "中医学预警" for energy/vitality.
      2. 健康线 (中平线)：Analyze the spleen, stomach, liver, and nerve weakness indicators, corresponding to digestion and sleep. Must contain keywords "健康" or "脾胃" or "睡眠". Detail the "线条关键点" (e.g., 穿过坎宫与震宫之间的细纹). Provide a clear TCM pre-warning ("中医预警").
      3. 金星丘 (拇指根部)：Discuss the fish-mount muscle tone, family affinity, and somatic vitality. Must contain keywords "金星丘" or "肉垫" or "饱满". Detail the "线条关键点" (e.g., 大鱼际艮位之隆起饱满度).

      ## 智慧线之认知极性与大脑决策流向精析
      (Focus on the Head line):
      - 智慧线 (人纹)：Analyze cognitive style, logic vs imagination, decision bottlenecks. Must contain keywords "智慧" or "思维" or "头脑". Detail the "线条关键点" (e.g., 起源与生命线分界处、走向平直伸展、或下垂至乾宫之势). Provide detailed forecast warnings if island cracks or breaks are present, suggesting mental focus points ("预警").

      ## 感情线之依恋本色、心墙密码与心血管反射
      (Focus on the Heart line):
      - 感情线 (天纹)：Analyze attachment style, romantic triggers, heart-circulation energy, and standards. Must contain keywords "感情" or "情愫" or "依恋". Detail the "线条关键点" (e.g., 起于坤宫下方、延展至巽宫或中指 gap 下方). Discuss "中医预警" or psychological blocks.

      ## 事业线与后天财富命运刻度解析
      (Provide a detailed dynamic analysis of the career, luck, and wealth lines. Include the following 3 points with appropriate keywords):
      1. 命运线 (事业线)：Analyze the achievement timing, career transitions. Must contain keywords "事业" or "命运" or "后天志向". Detail the "线条关键点" (e.g., 自坎宫扶摇直上、穿过乾坤交汇、直指离宫). Provide age warning targets (e.g., "35岁流年变局").
      2. 太阳线 (功名线)：Analyze reputation, fame, and helpful connections. Must contain keywords "太阳" or "名气" or "贵人". Detail the "线条关键点" (e.g., 无名指下方坤位至离位之间的纵深细纹).
      3. 财运纹 (水星割)：Analyze wealth-saving capability, business intuition. Must contain keywords "财" or "富" or "盈余". Detail the "线条关键点" (e.g., 小鱼际坤位下方的垂直短小纹理).

      ## 婚姻线、亲密演变与羁绊边界探微
      (Focus on the Marriage line):
      - 婚姻线 (羁绊线)：Analyze capacity for companion attachment, deep connections. Must contain keywords "婚姻" or "亲密" or "羁绊". Detail the "线条关键点" (e.g., 水星丘外侧的横向刻度). Detail relation warning points.

      ## 星尘启示与灵魂共振催化剂
      (Review user palm lines and provide exactly 3 bullet points starting with "-" that represent "Soul Catalysts" and 趋吉避凶. Keep them incredibly profound, specific, and actionable for somatic, sleep health, or energetic wellness).

      Never give deterministic doom predictions; reframe everything into an empowering, precise guide for physical and spiritual cultivation ("命自我造").
      
      ---
      **IMPORTANT: COMPUTER VISION EXTRACTION FOR PAINTS**
      Please try to match the actual hand crease positions as precisely as possible in the image. Map the lines onto a 100x100 grid where (0,0) is top-left and (100,100) is bottom-right. Output a final JSON block at the very end of your response with the traced splines (about 5-10 points per line).
      
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

    return res.status(200).json({ output: resultText });
  } catch (error: any) {
    console.error("Vercel Serverless Function error:", error);
    return res.status(500).json({ error: error.message || "内部服务器错误" });
  }
}
