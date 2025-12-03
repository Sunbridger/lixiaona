
export interface DailyLog {
  id: string; // ISO Date String YYYY-MM-DD
  date: number; // Timestamp
  weight?: number;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'motivated';
}

export interface UserProfile {
  name: string;
  startWeight: number;
  targetWeight: number;
  startDate: number;
  height?: number; // cm
  avatar?: string; // Base64 string of the image
}

export interface AppData {
  profile: UserProfile;
  logs: Record<string, DailyLog>; // Keyed by YYYY-MM-DD
}

export enum TabView {
  HOME = 'HOME',
  LOG = 'LOG',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}
