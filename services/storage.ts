
import { AppData, DailyLog, UserProfile, DietRecommendation } from '../types';

export const STORAGE_KEY = 'momo_fit_data_v6'; // Bump version for schema change

const getRelativeDate = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

const getRelativeTimestamp = (daysOffset: number): number => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.getTime();
};

// Default data populated with "Li Xiaona's Plan" (李小娜的计划)
const DEFAULT_DATA: AppData = {
  profile: {
    name: '李小娜',
    startWeight: 50.8,
    targetWeight: 46.8, // Goal: Lose 4kg (8 jin)
    startDate: getRelativeTimestamp(-4), // Started 4 days ago
    height: 165,
    avatar: undefined 
  },
  logs: {
    [getRelativeDate(-4)]: {
      id: getRelativeDate(-4),
      date: getRelativeTimestamp(-4),
      weight: 50.8,
      breakfast: '两个鸡蛋 半根玉米 一袋无糖酸奶',
      lunch: '少量白米饭 + 清炒西葫芦',
      dinner: '水煮虾 + 凉拌黄瓜 + 少量糙米',
      caloriesIn: 1250,
      caloriesOut: 300
    },
    [getRelativeDate(-3)]: {
      id: getRelativeDate(-3),
      date: getRelativeTimestamp(-3),
      weight: 50.6,
      breakfast: '全麦面包一片 + 黑咖啡',
      lunch: '鸡胸肉沙拉',
      dinner: '一个苹果',
      caloriesIn: 1100,
      caloriesOut: 450
    },
    [getRelativeDate(-2)]: {
      id: getRelativeDate(-2),
      date: getRelativeTimestamp(-2),
      weight: 50.4,
      breakfast: '一根水果黄瓜 一袋无糖酸奶',
      lunch: '少量糙米 + 水煮虾 + 清炒青菜',
      dinner: '少量米饭 + 青菜',
      caloriesIn: 1150,
      caloriesOut: 200
    },
    [getRelativeDate(-1)]: {
      id: getRelativeDate(-1),
      date: getRelativeTimestamp(-1),
      weight: 50.0,
      breakfast: '无',
      lunch: '糙米 + 花菜 + 西红柿炒蛋',
      dinner: '豆芽 + 红萝卜炒墨鱼',
      caloriesIn: 980,
      caloriesOut: 150
    },
    [getRelativeDate(0)]: {
      id: getRelativeDate(0),
      date: getRelativeTimestamp(0),
      weight: 49.9,
      breakfast: '无',
      lunch: '2个红烧鸡翅 + 糙米 + 豌豆',
      dinner: '', // Dinner not yet eaten today
      caloriesIn: 650, // Partial day
      caloriesOut: 100
    }
  },
  dailyTip: undefined
};

export const getAppData = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    
    // First time load: Save the default data immediately.
    saveAppData(DEFAULT_DATA);
    return DEFAULT_DATA;
  } catch (e) {
    console.error("Failed to load data", e);
    return DEFAULT_DATA;
  }
};

export const saveAppData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

export const saveDailyLog = (log: DailyLog) => {
  const data = getAppData();
  data.logs[log.id] = log;
  saveAppData(data);
};

export const saveProfile = (profile: UserProfile) => {
  const data = getAppData();
  data.profile = profile;
  saveAppData(data);
};

export const saveDailyTip = (tip: DietRecommendation) => {
  const data = getAppData();
  data.dailyTip = tip;
  saveAppData(data);
};

export const getLatestWeight = (): number | undefined => {
  const data = getAppData();
  const sortedLogs = Object.values(data.logs)
    .filter(l => l.weight)
    .sort((a, b) => b.date - a.date);
  
  if (sortedLogs.length > 0) return sortedLogs[0].weight;
  return data.profile.startWeight;
};
