
export interface DailyLog {
  id: string; // ISO Date String YYYY-MM-DD
  date: number; // Timestamp
  weight?: number;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'motivated';
  caloriesIn?: number; // kCal
  caloriesOut?: number; // kCal
}

export interface UserProfile {
  name: string;
  startWeight: number;
  targetWeight: number;
  startDate: number;
  height?: number; // cm
  avatar?: string; // Base64 string of the image
}

export interface DietRecommendation {
  icon: string;
  title: string;
  text: string;
  date?: string; // Cache key: YYYY-MM-DD
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface AppData {
  profile: UserProfile;
  logs: Record<string, DailyLog>; // Keyed by YYYY-MM-DD
  dailyTip?: DietRecommendation; // Cached tip for the day
  chatHistory?: ChatMessage[]; // Persisted chat history
}

export enum TabView {
  HOME = 'HOME',
  LOG = 'LOG',
  HISTORY = 'HISTORY',
  AI_CHAT = 'AI_CHAT',
  PROFILE = 'PROFILE'
}
