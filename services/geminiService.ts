import { GoogleGenAI } from "@google/genai";
import { AppData } from '../types';

export const generateDietAdvice = async (data: AppData, query: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "请配置 API Key 才能让 Momo 给你建议哦！";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare context from user data
  const recentLogs = Object.values(data.logs)
    .sort((a, b) => b.date - a.date)
    .slice(0, 5); // Last 5 days

  const contextStr = JSON.stringify({
    profile: data.profile,
    recentHistory: recentLogs
  });

  const systemInstruction = `
    你叫 Momo (莫莫)，是一个超级可爱、贴心、元气满满的私人减肥教练姐姐。
    你的用户是一个想要健康瘦身的年轻女生。
    
    风格指南：
    - 请全程使用中文回答。
    - 经常使用可爱的表情符号 (✨, 🎀, 🥗, 💪, 🌸, 🐰)。
    - 语气要温柔鼓励，像闺蜜一样，但对健康原则要坚持。
    - 绝对不要鼓励过度节食，总是建议营养均衡的饮食。
    - 回复要简短（150字以内），适合手机阅读。
    - 使用“我们”、“咱们”来拉近距离。
    
    用户数据上下文:
    ${contextStr}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "抱歉，Momo 现在想不出什么建议呢！( >_<)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "哎呀！脑子有点迷糊了（网络连接错误）。稍后再试吧！☁️";
  }
};