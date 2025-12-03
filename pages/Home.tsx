
import React, { useMemo, useState, useEffect } from 'react';
import { AppData, DietRecommendation } from '../types';
import { Card } from '../components/Card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Scale, TrendingDown, Clock, Flame, Apple, Sparkles } from 'lucide-react';
import { getDietRecommendation } from '../services/geminiService';
import { saveDailyTip } from '../services/storage';

interface HomeProps {
  data: AppData;
  onNavigateLog: () => void;
}

// Fallback Static Logic (Double safety)
const getStaticRecommendation = (): DietRecommendation => {
  const hour = new Date().getHours();
  let tip = { icon: "🌙", title: "早点休息", text: "早睡也是减肥的一部分哦！" };
  
  if (hour >= 5 && hour < 10) tip = { icon: "🍳", title: "早餐女王", text: "早餐是启动代谢的关键！推荐：全麦面包 + 鸡蛋 + 无糖豆浆。" };
  else if (hour >= 10 && hour < 14) tip = { icon: "🥗", title: "午餐均衡", text: "1拳主食+1掌心肉类+2拳蔬菜。细嚼慢咽更容易瘦！" };
  else if (hour >= 14 && hour < 17) tip = { icon: "🍵", title: "下午茶", text: "嘴馋了吗？吃个苹果或一把坚果吧，拒绝奶茶诱惑！" };
  else if (hour >= 17 && hour < 20) tip = { icon: "🥣", title: "晚餐清淡", text: "晚餐尽量在7点前吃完。少吃碳水，持续燃脂。" };
  
  return { ...tip, date: new Date().toISOString().split('T')[0] };
};

export const Home: React.FC<HomeProps> = ({ data, onNavigateLog }) => {
  const { profile, logs, dailyTip } = data;
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Use cached tip if available and from today, otherwise fallback
  const [tip, setTip] = useState<DietRecommendation>(() => {
    if (dailyTip && dailyTip.date === todayStr) {
      return dailyTip;
    }
    return getStaticRecommendation();
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Smart Recommendation if cache is missing or stale
  useEffect(() => {
    const shouldFetch = !dailyTip || dailyTip.date !== todayStr;
    
    if (shouldFetch) {
      let isMounted = true;
      const fetchTip = async () => {
        setIsLoading(true);
        // Call local smart engine
        const smartTip = await getDietRecommendation(profile, logs);
        if (isMounted && smartTip) {
          setTip(smartTip);
          saveDailyTip(smartTip); // Save to cache
        }
        if (isMounted) setIsLoading(false);
      };

      const timer = setTimeout(fetchTip, 800);
      return () => { isMounted = false; clearTimeout(timer); };
    }
  }, [dailyTip, todayStr, profile, logs]);

  const chartData = useMemo(() => {
    const sortedLogKeys = Object.keys(logs).sort();
    const recentKeys = sortedLogKeys.slice(-10);
    const result = [{ date: '初始', weight: profile.startWeight }];
    recentKeys.forEach(key => {
      if (logs[key].weight) {
        result.push({
          date: key.slice(5),
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

  // Today's stats
  const todayLog = logs[todayStr];
  const calIn = todayLog?.caloriesIn || 0;
  const calOut = todayLog?.caloriesOut || 0;

  const weightLost = (profile.startWeight - (currentWeight || profile.startWeight)).toFixed(1);
  const progressPercent = Math.min(100, Math.max(0, ((profile.startWeight - (currentWeight || profile.startWeight)) / (profile.startWeight - profile.targetWeight)) * 100));
  const daysOnPlan = Math.max(1, Math.floor((Date.now() - profile.startDate) / (1000 * 60 * 60 * 24)) + 1);

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <header className="flex justify-between items-start px-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            你好, {profile.name} <span className="text-xl">✨</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">目标: {profile.targetWeight}kg</p>
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

      {/* Calories Summary */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-rose-50 flex items-center justify-around">
          <div className="text-center">
             <div className="flex items-center gap-1 text-xs text-gray-400 mb-1 justify-center"><Apple size={12}/> 摄入</div>
             <div className="text-xl font-bold text-gray-800">{calIn}</div>
          </div>
          <div className="h-8 w-px bg-gray-100"></div>
          <div className="text-center">
             <div className="flex items-center gap-1 text-xs text-gray-400 mb-1 justify-center"><Flame size={12}/> 消耗</div>
             <div className="text-xl font-bold text-gray-800">{calOut}</div>
          </div>
          <div className="h-8 w-px bg-gray-100"></div>
          <div className="text-center">
             <div className="flex items-center gap-1 text-xs text-gray-400 mb-1 justify-center">结余</div>
             <div className={`text-xl font-bold ${calIn - calOut > 0 ? 'text-primary' : 'text-green-500'}`}>
               {calIn - calOut}
             </div>
          </div>
      </div>

      {/* Diet Recommendation (Momo's Tip) - Local Smart Engine */}
      <div className="bg-gradient-to-r from-rose-50 to-white border border-rose-100 rounded-3xl p-4 shadow-sm relative overflow-hidden group">
         <div className="flex items-start gap-3 relative z-10">
            <div className={`text-2xl bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm shrink-0 transition-transform ${isLoading ? 'animate-pulse' : ''}`}>
               {tip.icon}
            </div>
            <div className="flex-1">
               <div className="flex justify-between items-center mb-1">
                 <h3 className="font-bold text-primary text-sm flex items-center gap-1">
                    <Sparkles size={14} className={isLoading ? "animate-spin" : ""}/> 
                    Momo 的建议
                 </h3>
               </div>
               
               <h4 className={`font-bold text-gray-800 text-sm mb-1 transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
                 {tip.title}
               </h4>
               <p className={`text-xs text-gray-500 leading-relaxed transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
                 {tip.text}
               </p>
            </div>
         </div>
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

      {/* CTA Button */}
      <div className="flex justify-center pb-4">
         <button onClick={onNavigateLog} className="bg-primary text-white shadow-soft px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform">
            <Apple size={18} /> 记录今日饮食 & 热量
         </button>
      </div>
    </div>
  );
};
