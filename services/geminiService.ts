
import { AppData, DietRecommendation, UserProfile, DailyLog, ChatMessage } from "../types";

// ==========================================
// 配置区域
// ==========================================
const MOONSHOT_API_KEY = "sk-A2X55BDqpJDJiy7XBP7J4OH6h34DoduUCE3MzO9BBflAHcJM";
const MOONSHOT_API_URL = "https://api.moonshot.cn/v1/chat/completions";
const TIMEOUT_MS = 10000; // API 请求超时时间

// ==========================================
// 1. 本地智能引擎 (Local Smart Engine) - 兜底方案
// ==========================================

// 基础食物热量库 (单位: kcal/份)
const FOOD_CALORIES: Record<string, number> = {
  // 主食
  '米饭': 220, '饭': 220, '粥': 120, '馒头': 220, '包子': 200, 
  '面条': 300, '面': 300, '粉': 280, '吐司': 100, '面包': 150, 
  '全麦': 120, '玉米': 100, '红薯': 130, '紫薯': 130, '燕麦': 150,
  '糙米': 110, '荞麦': 100, '藜麦': 120,

  // 蛋白质
  '鸡蛋': 80, '蛋': 80, '荷包蛋': 150, '水煮蛋': 80, 
  '牛奶': 130, '豆浆': 100, '酸奶': 120, '豆奶': 110,
  '鸡胸': 130, '鸡肉': 180, '鸡腿': 260, '鸡翅': 220, '红烧鸡翅': 250,
  '牛肉': 200, '牛排': 300, '猪肉': 350, '排骨': 300, '五花肉': 400,
  '鱼': 120, '虾': 100, '豆腐': 80, '墨鱼': 90, '鱿鱼': 100,

  // 蔬果
  '青菜': 40, '白菜': 30, '菠菜': 30, '生菜': 20, '西兰花': 35,
  '黄瓜': 20, '西红柿': 25, '番茄': 25, '胡萝卜': 40, '土豆': 80,
  '苹果': 50, '香蕉': 90, '橙子': 50, '葡萄': 45, '西瓜': 30,
  '草莓': 30, '蓝莓': 57,

  // 其他
  '咖啡': 10, '拿铁': 150, '美式': 5, '奶茶': 400, '可乐': 150,
  '坚果': 600, '沙拉': 300, '蛋糕': 350, '饼干': 450
};

// 本地分析逻辑
const analyzeLocal = (text: string): number => {
  let total = 0;
  Object.keys(FOOD_CALORIES).forEach(key => {
    if (text.includes(key)) {
      // 简单估算：如果出现关键字，默认算一份热量
      // 进阶：可以尝试解析前面的数字，例如 "2个鸡蛋"
      const regex = new RegExp(`(\\d+|[一二三四五六七八九十]+)\\s*[个只份碗杯勺片]*\\s*${key}`);
      const match = text.match(regex);
      let multiplier = 1;
      
      if (match) {
         const numStr = match[1];
         const mapCN: Record<string, number> = {'一':1, '二':2, '两':2, '三':3, '四':4, '五':5};
         multiplier = parseFloat(numStr) || mapCN[numStr] || 1;
      }
      
      total += FOOD_CALORIES[key] * multiplier;
    }
  });
  return total;
};


// ==========================================
// 2. 远程 AI 服务 (Moonshot / Gemini Proxy)
// ==========================================

async function callAI(messages: any[], temperature = 0.3) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(MOONSHOT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: messages,
        temperature: temperature
      }),
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
       console.warn("AI API Error:", response.status);
       return null;
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.warn("AI Request Failed:", error);
    return null;
  }
}

// ------------------------------------------
// Feature: Smart Food Portion Suggestions
// ------------------------------------------
export const suggestFoodPortions = async (text: string): Promise<string[]> => {
  if (!text || text.length < 2) return [];

  const prompt = `
    用户正在记录饮食。输入: "${text}"。
    请分析用户输入的最后一个食物词汇。
    如果该食物没有数量单位，请返回 3-4 个常见的份量单位建议。
    如果用户已经输入了详细的数量，则返回相关的补充建议（如做法或搭配），或者返回空数组。
    
    输出要求：
    仅返回一个 JSON 字符串数组，不要包含任何 markdown 格式。
    例如输入"米饭"，输出 ["1碗 (150g)", "半碗 (100g)", "100g"]
    例如输入"鸡蛋"，输出 ["1个 (50g)", "2个", "100g"]
  `;

  const result = await callAI([
    { role: "system", content: "你是专业的营养师助手，负责辅助用户记录饮食。" },
    { role: "user", content: prompt }
  ], 0.3);

  if (!result) return [];

  try {
    // Clean up potential markdown code blocks
    const cleanJson = result.replace(/```json|```/g, '').trim();
    const suggestions = JSON.parse(cleanJson);
    return Array.isArray(suggestions) ? suggestions.slice(0, 4) : [];
  } catch (e) {
    console.warn("Failed to parse suggestion JSON", e);
    return [];
  }
};


// ------------------------------------------
// Feature: Calorie Analysis
// ------------------------------------------
export const analyzeFoodCalories = async (breakfast: string, lunch: string, dinner: string): Promise<number | null> => {
  const combined = `早餐:${breakfast}, 午餐:${lunch}, 晚餐:${dinner}`;
  if (!breakfast && !lunch && !dinner) return 0;

  // 1. Try Local Analysis First for fast feedback (optional mixed approach)
  // For now, let's trust AI but use local as fallback if AI fails entirely.
  
  const prompt = `
    请分析以下饮食摄入的总热量（单位：千卡 kcal）。
    饮食记录: "${combined}"
    
    规则：
    1. 仔细识别食物名称和数量（如 "2个鸡蛋", "150g米饭"）。
    2. 如果没有单位（如只写了"米饭"），请按常规一人份（如1碗/150g）估算。
    3. 仅返回一个纯数字（例如：1250），不要包含任何文字、解释或符号。
  `;

  const aiResult = await callAI([
    { role: "system", content: "你是专业的营养师。你只输出数字结果。" },
    { role: "user", content: prompt }
  ]);

  if (aiResult) {
     const num = parseInt(aiResult.replace(/\D/g, ''));
     if (!isNaN(num)) return num;
  }

  // Fallback to local engine
  return analyzeLocal(breakfast) + analyzeLocal(lunch) + analyzeLocal(dinner);
};

// ------------------------------------------
// Feature: Daily Diet Tip (Home Page)
// ------------------------------------------
export const getDietRecommendation = async (profile: UserProfile, logs: Record<string, DailyLog>): Promise<DietRecommendation | null> => {
  // 1. Context Expansion: Get last 7 days of logs (Weekly analysis)
  const recentLogs = Object.values(logs)
    .filter(l => l.caloriesIn || l.weight || l.breakfast || l.lunch || l.dinner) // Filter out empty logs
    .sort((a, b) => b.date - a.date)
    .slice(0, 7);

  // Calculate stats
  const latestWeight = recentLogs.find(l => l.weight)?.weight || profile.startWeight;
  const startWeightOfPeriod = recentLogs[recentLogs.length - 1]?.weight || profile.startWeight;
  const weightDiff = (latestWeight - startWeightOfPeriod).toFixed(1);
  const avgCalories = recentLogs.reduce((sum, l) => sum + (l.caloriesIn || 0), 0) / (recentLogs.length || 1);

  // Richer Context Construction
  const context = JSON.stringify(recentLogs.map(l => ({
    date: l.id.slice(5), // MM-DD
    weight: l.weight,
    calories: l.caloriesIn,
    meals: [l.breakfast, l.lunch, l.dinner].filter(Boolean).join('|')
  })));

  const currentHour = new Date().getHours();
  let timeContext = "休息时间";
  if (currentHour >= 6 && currentHour < 9) timeContext = "早餐前";
  else if (currentHour >= 9 && currentHour < 11) timeContext = "早餐后/上午";
  else if (currentHour >= 11 && currentHour < 13) timeContext = "午餐时间";
  else if (currentHour >= 13 && currentHour < 15) timeContext = "午饭后";
  else if (currentHour >= 15 && currentHour < 18) timeContext = "下午茶/运动前";
  else if (currentHour >= 18 && currentHour < 20) timeContext = "晚餐时间";
  else if (currentHour >= 20) timeContext = "夜间/休息前";

  const prompt = `
    角色: Momo酱 (私人减肥助手，语气元气可爱、治愈，喜欢用emoji 🐰✨💪)。
    
    用户档案:
    - 名字: ${profile.name}
    - 目标: ${profile.targetWeight}kg
    - 近期体重走势: 从 ${startWeightOfPeriod}kg 变成 ${latestWeight}kg (变化 ${weightDiff}kg)
    - 近7天记录: ${context}
    - 平均摄入: ${Math.round(avgCalories)} kcal/day
    
    当前时间: ${timeContext} (${currentHour}点)

    任务:
    请分析用户过去一周的饮食和体重数据，寻找规律，并结合当前时间点，给出一条最贴心的建议。

    分析维度:
    1. 饮食习惯: 是否有暴饮暴食？是否碳水过多？是否经常漏得一餐？
    2. 体重反馈: 吃多了是否第二天重了？清淡了是否瘦了？(如果瘦了请大力夸奖！)
    3. 时机: 现在的点应该做什么？(如: 还没睡就提醒早睡，饭点提醒吃蛋白质/蔬菜)

    输出要求:
    - 返回纯 JSON 格式。
    - 标题简短有力(4-8字)。
    - 内容(text)在30-50字之间，要有针对性，不要全是套话。

    JSON 示例:
    {
      "icon": "📉",
      "title": "体重下降啦！",
      "text": "哇！看到你这几天晚饭吃得很清淡，体重真的掉了耶！继续保持，今晚也要多吃蔬菜哦 🥗✨"
    }
  `;

  const result = await callAI([
    { role: "system", content: "你是Momo，一个专业的AI营养师兼私人减肥教练。" },
    { role: "user", content: prompt }
  ], 0.7);

  if (!result) return null;

  try {
     const cleanJson = result.replace(/```json|```/g, '').trim();
     return JSON.parse(cleanJson);
  } catch (e) {
    console.warn("Recommendation Parse Error", e);
    return null;
  }
};

// ------------------------------------------
// Feature: AI Chat
// ------------------------------------------
export const chatWithMomo = async (history: any[], profile: UserProfile): Promise<string> => {
  const systemPrompt = `
    你叫Momo酱，是一个可爱的私人减肥助手（兔子形象）。
    用户叫 ${profile.name}。
    你的语气要非常可爱、元气、充满鼓励，多用emoji (🐰, ✨, 💪, 🥗)。
    回答要简短精炼，不要长篇大论。
    如果用户问吃什么，根据减肥原则推荐低卡食物。
  `;

  const result = await callAI([
    { role: "system", content: systemPrompt },
    ...history
  ]);

  return result || "Momo 好像睡着了... 稍后再试一下吧 🐰💤";
};
