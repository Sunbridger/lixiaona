import React, { useMemo } from 'react';
import { AppData } from '../types';
import { Card } from '../components/Card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Scale, TrendingDown, CalendarHeart, Clock } from 'lucide-react';

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

  // Calculate days on plan
  const daysOnPlan = Math.max(1, Math.floor((Date.now() - profile.startDate) / (1000 * 60 * 60 * 24)) + 1);

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <header className="flex justify-between items-start px-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            你好, {profile.name} <span className="text-xl">✨</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">让我们一起努力达到 {profile.targetWeight}kg 吧！</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl shadow-sm overflow-hidden border border-white">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              "🐰"
            )}
          </div>
          <div className="bg-white/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-primary shadow-sm flex items-center gap-1 border border-primary/10">
            <Clock size={10} /> 第 {daysOnPlan} 天
          </div>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary to-rose-400 text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Scale size={48} />
          </div>
          <div className="flex items-center gap-2 opacity-90 mb-1">
            <Scale size={16} />
            <span className="text-sm font-medium">当前体重</span>
          </div>
          <div className="text-3xl font-bold relative z-10">{currentWeight}<span className="text-base font-normal opacity-80">kg</span></div>
        </Card>
        
        <Card className="bg-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-5 text-primary">
            <TrendingDown size={48} />
          </div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <TrendingDown size={16} />
            <span className="text-sm font-medium">已减掉</span>
          </div>
          <div className="text-3xl font-bold text-gray-700 relative z-10">{weightLost}<span className="text-base font-normal text-gray-400">kg</span></div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>当前进度</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner-soft">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative" 
            style={{ width: `${progressPercent}%` }}
          >
             <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{profile.startWeight}kg</span>
          <span>目标: {profile.targetWeight}kg</span>
        </div>
      </Card>

      {/* Chart */}
      <Card title="体重趋势 📉">
        <div className="h-56 w-full -ml-4 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9EAA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF9EAA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10}} 
                dy={10}
              />
              <YAxis 
                hide={false} 
                axisLine={false} 
                tickLine={false}
                tick={{fill: '#9CA3AF', fontSize: 10}}
                domain={['dataMin - 1', 'dataMax + 1']} 
                width={30}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                cursor={{ stroke: '#FF9EAA', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              {/* Target Line */}
              <ReferenceLine 
                y={profile.targetWeight} 
                stroke="#3AA6B9" 
                strokeDasharray="3 3" 
                label={{ position: 'right', value: '目标', fill: '#3AA6B9', fontSize: 10 }} 
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#FF9EAA" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                animationDuration={1500}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#FF9EAA' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Today's Summary or CTA */}
      <div className="bg-white/60 backdrop-blur-sm border border-white p-4 rounded-3xl flex items-center justify-between shadow-soft">
         <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-xl text-green-600">
               <CalendarHeart size={20} />
            </div>
            <div className="text-sm">
               <p className="font-bold text-gray-700">每日打卡</p>
               <p className="text-gray-500 text-xs">记录今天的饮食，保持好身材！</p>
            </div>
         </div>
         <button onClick={onNavigateLog} className="bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-50 transition-colors">
            去记录
         </button>
      </div>
    </div>
  );
};