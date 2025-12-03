
import { AppData, DietRecommendation } from "../types";

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
  '青菜': 40, '白菜': 30, '菠菜': 30, '西蓝花': 35, '生菜': 20, '花菜': 35,
  '黄瓜': 20, '番茄': 30, '西红柿': 30, '胡萝卜': 40, '红萝卜': 40,
  '西葫芦': 30, '豆芽': 30, '豌豆': 80,
  '苹果': 50, '香蕉': 90, '梨': 50, '西瓜': 30, '葡萄': 60, 
  '水果': 60, '沙拉': 150,

  // 饮料/零食
  '咖啡': 15, '美式': 10, '拿铁': 180, '奶茶': 450, '可乐': 150,
  '蛋糕': 350, '饼干': 200, '巧克力': 300, '薯片': 300,
  '汉堡': 550, '薯条': 350, '披萨': 400, '火锅': 800, '烧烤': 600
};

// 减肥建议知识库 (按时间段)
const TIPS_DB = {
  morning: [
    { icon: "🌞", title: "元气早餐", text: "早安！早餐记得吃点蛋白质（鸡蛋/牛奶），开启一整天的高代谢！" },
    { icon: "🥪", title: "碳水要适量", text: "早餐吃点粗粮面包或玉米，比白粥更抗饿哦！" },
    { icon: "💧", title: "早起一杯水", text: "起床先喝温水，唤醒肠胃，加速排毒，皮肤也会变好！" },
    { icon: "☕️", title: "消肿黑咖", text: "早上一杯黑咖啡，去水肿神器，还能提神醒脑！" }
  ],
  noon: [
    { icon: "🍱", title: "午餐八分饱", text: "细嚼慢咽，每口嚼20下，大脑才有时间接收'吃饱了'的信号。" },
    { icon: "🥗", title: "蔬菜先吃", text: "先吃蔬菜垫底，再吃肉和主食，可以平稳血糖，不易长胖。" },
    { icon: "🍗", title: "补充优质蛋白", text: "午餐来点鸡胸肉或鱼虾，下午才不会饿得想吃零食。" }
  ],
  afternoon: [
    { icon: "🍵", title: "拒绝奶茶", text: "想喝饮料？试试黑咖啡或无糖茶，0热量还能消水肿！" },
    { icon: "🍎", title: "加餐首选", text: "饿了吃个苹果或一小把坚果，比吃饼干健康多啦。" },
    { icon: "🥤", title: "多喝水", text: "有时候感觉饿其实是渴了，先喝杯水试试？" }
  ],
  evening: [
    { icon: "🥣", title: "晚餐清淡", text: "晚餐少吃主食，多吃蔬菜和鱼虾，减轻肠胃负担。" },
    { icon: "🚶‍♀️", title: "饭后走走", text: "吃完饭别马上躺下，靠墙站立15分钟或散步对消化很好哦。" },
    { icon: "🥦", title: "控糖时刻", text: "晚上尽量避开高糖水果和甜点，让身体在睡眠中持续燃脂。" }
  ],
  late: [
    { icon: "🌙", title: "早点睡吧", text: "熬夜容易掉肌肉长脂肪，早睡是性价比最高的减肥法！" },
    { icon: "🚫", title: "忍住夜宵", text: "睡前3小时不进食，明早体重会给你惊喜的！坚持住！" },
    { icon: "🛌", title: "美容觉", text: "放下手机，做个好梦。充足的睡眠能抑制食欲激素哦。" }
  ]
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// 本地热量估算函数
const analyzeFoodCaloriesLocal = async (
  breakfast: string,
  lunch: string,
  dinner: string
): Promise<number | null> => {
  console.log("🔍 [Local] Analyzing calories...");
  await sleep(400); // 模拟少许延迟

  let total = 0;
  const combinedText = (breakfast + lunch + dinner).toLowerCase();
  
  if (!combinedText.trim()) return null;

  let matchCount = 0;
  for (const [key, cal] of Object.entries(FOOD_CALORIES)) {
    if (combinedText.includes(key)) {
      const regex = new RegExp(`(\\d+)[个碗份片块杯只]*${key}`);
      const match = combinedText.match(regex);
      const multiplier = match ? parseInt(match[1]) : 1;
      
      total += cal * multiplier;
      matchCount++;
    }
  }

  if (matchCount === 0 || total < 100) {
    if (breakfast.trim()) total += 300;
    if (lunch.trim()) total += 450;
    if (dinner.trim()) total += 350;
    total += Math.floor(Math.random() * 50) - 25;
  } else {
    total = Math.round(total * 1.1);
  }

  return total > 0 ? total : null;
};

// 本地建议生成函数
const getDietRecommendationLocal = async (
  profile: AppData['profile'],
  logs: AppData['logs']
): Promise<DietRecommendation | null> => {
  console.log("💡 [Local] Getting tip...");
  await sleep(200);
  
  const hour = new Date().getHours();
  let pool = TIPS_DB.morning;
  
  if (hour >= 11 && hour < 14) pool = TIPS_DB.noon;
  else if (hour >= 14 && hour < 18) pool = TIPS_DB.afternoon;
  else if (hour >= 18 && hour < 22) pool = TIPS_DB.evening;
  else if (hour >= 22 || hour < 5) pool = TIPS_DB.late;

  const tip = pool[Math.floor(Math.random() * pool.length)];
  const personalizedText = tip.text.replace("早安！", `早安 ${profile.name}！`);
  
  return {
    ...tip,
    text: personalizedText,
    date: new Date().toISOString().split('T')[0]
  };
};

// ==========================================
// 2. Kimi (Moonshot AI) API 服务
// ==========================================

const fetchFromMoonshot = async (messages: any[]): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(MOONSHOT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: messages,
        temperature: 0.3
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
       const errText = await response.text();
       throw new Error(`Moonshot API Error ${response.status}: ${errText}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// ==========================================
// 3. 混合智能接口 (Exported)
// ==========================================

export const analyzeFoodCalories = async (
  breakfast: string,
  lunch: string,
  dinner: string
): Promise<number | null> => {
  try {
    if (!breakfast && !lunch && !dinner) return null;
    console.log("🚀 [API] Attempting Moonshot AI analysis...");
    
    // 调用 API
    const content = await fetchFromMoonshot([
      { role: "system", content: "你是一个营养师。请根据用户输入的早午晚餐内容，估算总热量（大卡）。请只返回一个纯数字（整数），严禁包含任何文字、单位或标点符号。如果内容为空或无法估算，返回 0。" },
      { role: "user", content: `早餐: ${breakfast}, 午餐: ${lunch}, 晚餐: ${dinner}` }
    ]);
    
    // 解析结果
    const calories = parseInt(content.trim());
    if (isNaN(calories) || calories <= 0) throw new Error("Invalid API response format");
    
    console.log("✅ [API] Success:", calories);
    return calories;

  } catch (e) {
    console.warn("⚠️ [API] Failed or timed out. Falling back to Local Engine.", e);
    // 降级回本地逻辑
    return analyzeFoodCaloriesLocal(breakfast, lunch, dinner);
  }
};

export const getDietRecommendation = async (
  profile: AppData['profile'],
  logs: AppData['logs']
): Promise<DietRecommendation | null> => {
  try {
    console.log("🚀 [API] Attempting Moonshot AI recommendation...");
    const hour = new Date().getHours();
    
    // 调用 API
    const content = await fetchFromMoonshot([
      { role: "system", content: "你叫Momo，是一个可爱、元气满满的减肥助手。请根据用户的档案和时间，给出一个简短（30字以内）、贴心且实用的减肥建议或鼓励。语气要像闺蜜一样亲切，多用emoji。" },
      { role: "user", content: `用户:${profile.name}, 目标:${profile.targetWeight}kg. 当前时间:${hour}点。` }
    ]);

    if (!content.trim()) throw new Error("Empty API response");

    console.log("✅ [API] Success:", content);
    return {
      icon: "✨", 
      title: "Momo的AI建议",
      text: content,
      date: new Date().toISOString().split('T')[0]
    };

  } catch (e) {
    console.warn("⚠️ [API] Failed or timed out. Falling back to Local Engine.", e);
    // 降级回本地逻辑
    return getDietRecommendationLocal(profile, logs);
  }
};

export const chatWithMomo = async (
  history: { role: string; content: string }[],
  profile: AppData['profile']
): Promise<string> => {
  try {
    console.log("🚀 [API] Chatting with Moonshot AI...");
    
    const systemPrompt = `你叫“Momo酱”，是用户${profile.name}的私人减肥小助手。你的性格非常可爱、元气满满、像贴心的闺蜜。你的任务是鼓励用户坚持减肥、回答关于热量和饮食的问题、提供情绪价值。请用中文回答，多使用可爱的emoji（如🐰、✨、💪）。回复要简短精炼，不要长篇大论。`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    const content = await fetchFromMoonshot(messages);
    return content;

  } catch (e) {
    console.error("Chat API failed", e);
    return "Momo 稍微有点累了（连接超时），请稍后再试哦~ 🐰💤";
  }
};
