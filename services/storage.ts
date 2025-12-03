import { AppData, DailyLog, UserProfile } from '../types';

const STORAGE_KEY = 'momo_fit_data_v1';

// Pre-fill with data from "Li Xiaona's Plan" image for demo purposes
const DEFAULT_DATA: AppData = {
  profile: {
    name: '李小娜',
    startWeight: 50.8,
    targetWeight: 46.8, // 8 catties = 4kg loss
    startDate: new Date('2023-11-29').getTime(),
    height: 165,
  },
  logs: {
    '2023-11-29': {
      id: '2023-11-29',
      date: new Date('2023-11-29').getTime(),
      weight: 50.8,
      breakfast: '',
      lunch: '',
      dinner: '减脂计划开始！甩掉脂肪肝'
    },
    '2023-11-30': {
      id: '2023-11-30',
      date: new Date('2023-11-30').getTime(),
      weight: 50.6,
      breakfast: '两个鸡蛋 半根玉米 一袋无糖酸奶',
      lunch: '少量白米饭 清炒西葫芦',
      dinner: '水煮虾 凉拌黄瓜 少量糙米'
    },
    '2023-12-01': {
      id: '2023-12-01',
      date: new Date('2023-12-01').getTime(),
      weight: 50.4,
      breakfast: '一根水果黄瓜 一袋无糖酸奶',
      lunch: '少量糙米 水煮虾 清炒青菜',
      dinner: '少量米饭 青菜'
    },
    '2023-12-02': {
      id: '2023-12-02',
      date: new Date('2023-12-02').getTime(),
      weight: 50.0,
      breakfast: '无',
      lunch: '糙米 花菜 西红柿炒蛋',
      dinner: '豆芽 红萝卜炒墨鱼'
    },
    '2023-12-03': {
      id: '2023-12-03',
      date: new Date('2023-12-03').getTime(),
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