export async function analyzePalm(base64Image: string, mimeType: string, focus: string = '全部'): Promise<string> {
  try {
    const prompt = `
      You are a wise, mystical, and experienced palm reader. 
      Analyze this image of a palm and provide a detailed, positive, and insightful palmistry reading.
      Please reply in Simplified Chinese.
      
      Please structure your reading with the following sections using Markdown headings (H2):
      ## 整体能量
      (Describe the general shape, energy, and overall impression of the hand)
      
      ## 生命线
      (Analyze the life line: vitality, major life changes, energy levels)
      
      ## 感情线
      (Analyze the heart line: emotional nature, relationships, love)
      
      ## 智慧线
      (Analyze the head line: intellect, thought processes, career focus)
      
      ## 事业线（若可见）
      (Analyze the fate line: destiny, career path, external influences)
      
      ## 神秘建议
      (Provide a short, uplifting piece of advice or fortune based on the reading)

      Keep the tone mystical, encouraging, and respectful. Do not provide medical advice.
      If you cannot clearly see the lines, provide a general positive reading based on the hand shape and offer mystical advice.
      
      ${focus !== '全部' ? `\n**特别注意**：用户希望重点关注【${focus}】。请在本次解读中，将大部分篇幅用于极其详细、深入地剖析【${focus}】，提供更多的细节、预测和针对性建议。其他线条的解读可以适当简略。` : ''}

      ---
      **IMPORTANT: VISUAL LINE MAPPING**
      At the very end of your response, you MUST append a JSON block containing the approximate visual coordinates of the main lines you identified in the palm image.
      Use percentage coordinates (x: 0-100, y: 0-100) where (0,0) is the top-left corner of the image.
      To ensure the lines accurately fit the user's specific palm creases, please provide 8 to 15 points per line. 
      Visually trace the exact curvature of the dark creases from start to finish.
      Use these specific hex colors for styling:
      - 生命线 (Life Line): #10b981
      - 感情线 (Heart Line): #f43f5e
      - 智慧线 (Head Line): #0ea5e9
      - 事业线 (Fate Line): #eab308

      You MUST enclose the JSON in a markdown code block like this:
      \`\`\`json
      {
        "lines": [
          {
            "name": "生命线",
            "color": "#10b981",
            "points": [{"x": 45, "y": 80}, {"x": 46, "y": 70}, {"x": 48, "y": 60}, {"x": 51, "y": 50}, {"x": 55, "y": 40}, {"x": 60, "y": 30}]
          }
        ]
      }
      \`\`\`
    `;

    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error("请配置 VITE_DASHSCOPE_API_KEY 环境变量");
    }

    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen-vl-max",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("DashScope API Error:", errData);
        throw new Error("API 请求失败: " + (errData.error?.message || response.statusText));
    }

    const data = await response.json();
    let fullText = data.choices?.[0]?.message?.content || "";

    if (!fullText) {
      fullText = "神秘的能量目前被云雾遮蔽。请换一张更清晰的图片再试一次。";
    }

    return fullText;
  } catch (error) {
    console.error("Error analyzing palm:", error);
    throw new Error("手相解读失败，宇宙连接已中断。");
  }
}
