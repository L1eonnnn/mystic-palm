/**
 * Service to analyze palm image using our backend Express API.
 * Keeps API keys and model inference securely server-side.
 */
export async function analyzePalm(
  base64Image: string, 
  mimeType: string, 
  focus: string = '全部', 
  modelId: string = 'gemini-3.5-flash', 
  handType: string = 'left'
): Promise<string> {
  try {
    const response = await fetch("/api/analyze-palm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        base64Image,
        mimeType,
        focus,
        modelId,
        handType
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `服务器请求失败 (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.output || "命运之星目前被迷雾笼罩，请再试一次。";
  } catch (error: any) {
    console.error("Error in analyzePalm:", error);
    throw new Error(error.message || "连接神秘星宿失败，请检查网络后重试。");
  }
}
