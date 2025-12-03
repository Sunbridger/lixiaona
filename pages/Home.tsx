import React, { useMemo } from 'react';
import { AppData } from '../types';
import { Card } from '../components/Card';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Scale, TrendingDown, CalendarHeart } from 'lucide-react';

interface HomeProps {
  data: AppData;
  onNavigateLog: () => void;
}

export const Home: React.FC<HomeProps> = ({ data, onNavigateLog }) => {
  const { profile, logs } = data;

  const chartData = useMemo(() => {
    const sortedLogKeys = Object.keys(logs).sort();
    // Get last 7 entries or all if less than 7
    const recentKeys = sortedLogKeys.slice(-10);
    
    // Always include start
    const result = [{ date: '初始', weight: profile.startWeight }];
    
    recentKeys.forEach(key => {
      if (logs[key].weight) {
        result.push({
          date: key.slice(5), // MM-DD
          weight: logs[key].weight!
        });
      }
    });
    return result;
  }, [logs, profile]);

  const currentWeight = useMemo(() => {
    const keys = Object.keys(logs).sort();
    for (let i = keys.length - 1; i >= 0; i--) {
      if (logs[keys[i]].weight) return logs[keys[i]].weight;
    }
    return profile.startWeight;
  }, [logs, profile]);

  const weightLost = (profile.startWeight - (currentWeight || profile.startWeight)).toFixed(1);
  const progressPercent = Math.min(100, Math.max(0, ((profile.startWeight - (currentWeight || profile.startWeight)) / (profile.startWeight - profile.targetWeight)) * 100));

  return (
    <div className="space-y-6 pb-24 page-transition">
      {/* Header */}
      <header className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">你好, {profile.name} ✨</h1>
          <p className="text-gray-500 text-sm">让我们一起努力达到 {profile.targetWeight}kg 吧！</p>
        </div>
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl">
          🐰
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary to-rose-400 text-white border-none">
          <div className="flex items-center gap-2 opacity-90 mb-1">
            <Scale size={16} />
            <span className="text-sm font-medium">当前体重</span>
          </div>
          <div className="text-3xl font-bold">{currentWeight}<span className="text-base font-normal opacity-80">kg</span></div>
        </Card>
        
        <Card className="bg-white">
          <div className="flex items-center gap-2 text-primary mb-1">
            <TrendingDown size={16} />
            <span className="text-sm font-medium">已减掉</span>
          </div>
          <div className="text-3xl font-bold text-gray-700">{weightLost}<span className="text-base font-normal text-gray-400">kg</span></div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>当前进度</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{profile.startWeight}kg</span>
          <span>目标: {profile.targetWeight}kg</span>
        </div>
      </Card>

      {/* Chart */}
      <Card title="体重趋势">
        <div className="h-48 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9EAA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF9EAA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#FF9EAA" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorWeight)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Today's Summary or CTA */}
      <div className="bg-white/50 border border-white p-4 rounded-3xl flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-xl text-green-600">
               <CalendarHeart size={20} />
            </div>
            <div className="text-sm">
               <p className="font-bold text-gray-700">每日打卡</p>
               <p className="text-gray-500">别忘了记录今天的饮食哦！</p>
            </div>
         </div>
         <button onClick={onNavigateLog} className="bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            去记录
         </button>
      </div>
    </div>
  );
};