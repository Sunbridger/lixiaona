
import { AppData, DailyLog, UserProfile } from '../types';

const STORAGE_KEY = 'momo_fit_data_v3'; // Bumped version for schema change

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

// Generate data dynamically so it looks active "Today"
const dateMinus4 = getRelativeDate(-4);
const dateMinus3 = getRelativeDate(-3);
const dateMinus2 = getRelativeDate(-2);
const dateMinus1 = getRelativeDate(-1);
const dateToday = getRelativeDate(0);

const DEFAULT_DATA: AppData = {
  profile: {
    name: '李小娜',
    startWeight: 50.8,
    targetWeight: 46.8, // 8 catties = 4kg loss
    startDate: getRelativeTimestamp(-4),
    height: 165,
    avatar: undefined // No default avatar, will show emoji
  },
  logs: {
    [dateMinus4]: {
      id: dateMinus4,
      date: getRelativeTimestamp(-4),
      weight: 50.8,
      breakfast: '',
      lunch: '',
      dinner: '减脂计划开始！甩掉脂肪肝'
    },
    [dateMinus3]: {
      id: dateMinus3,
      date: getRelativeTimestamp(-3),
      weight: 50.6,
      breakfast: '两个鸡蛋 半根玉米 一袋无糖酸奶',
      lunch: '少量白米饭 清炒西葫芦',
      dinner: '水煮虾 凉拌黄瓜 少量糙米'
    },
    [dateMinus2]: {
      id: dateMinus2,
      date: getRelativeTimestamp(-2),
      weight: 50.4,
      breakfast: '一根水果黄瓜 一袋无糖酸奶',
      lunch: '少量糙米 水煮虾 清炒青菜',
      dinner: '少量米饭 青菜'
    },
    [dateMinus1]: {
      id: dateMinus1,
      date: getRelativeTimestamp(-1),
      weight: 50.0,
      breakfast: '无',
      lunch: '糙米 花菜 西红柿炒蛋',
      dinner: '豆芽 红萝卜炒墨鱼'
    },
    [dateToday]: {
      id: dateToday,
      date: getRelativeTimestamp(0),
      weight: 49.9,
      breakfast: '无',
      lunch: '2个红烧鸡翅 糙米 豌豆',
      dinner: ''
    }
  }
};

export const getAppData = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return JSON.parse(raw);
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

export const getLatestWeight = (): number | undefined => {
  const data = getAppData();
  const sortedLogs = Object.values(data.logs)
    .filter(l => l.weight)
    .sort((a, b) => b.date - a.date);
  
  if (sortedLogs.length > 0) return sortedLogs[0].weight;
  return data.profile.startWeight;
};
