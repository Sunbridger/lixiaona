
import React, { useState, useEffect } from 'react';
import { AppData, DailyLog } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { saveDailyLog } from '../services/storage';
import { analyzeFoodCalories } from '../services/geminiService';
import { ChevronLeft, Save, Flame, Apple, Sparkles, Loader2 } from 'lucide-react';

interface LogEntryProps {
  data: AppData;
  onBack: () => void;
}

export const LogEntry: React.FC<LogEntryProps> = ({ data, onBack }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Initialize state with existing log or empty
  const [entry, setEntry] = useState<DailyLog>(() => {
     return data.logs[today] || {
       id: today,
       date: Date.now(),
       weight: undefined,
       breakfast: '',
       lunch: '',
       dinner: '',
       caloriesIn: undefined,
       caloriesOut: undefined
     };
  });

  // Update entry when date changes
  useEffect(() => {
    const existing = data.logs[date];
    if (existing) {
      setEntry(existing);
    } else {
      setEntry({
        id: date,
        date: new Date(date).getTime(),
        weight: undefined,
        breakfast: '',
        lunch: '',
        dinner: '',
        caloriesIn: undefined,
        caloriesOut: undefined
      });
    }
  }, [date, data.logs]);

  const handleSave = () => {
    saveDailyLog({
      ...entry,
      id: date,
      date: new Date(date).getTime()
    });
    onBack();
  };

  const handleAICalculate = async () => {
    if (!entry.breakfast && !entry.lunch && !entry.dinner) {
      alert("请先填写今天的饮食内容哦~ 🍱");
      return;
    }
    
    setIsAnalyzing(true);
    const calories = await analyzeFoodCalories(
      entry.breakfast || '', 
      entry.lunch || '', 
      entry.dinner || ''
    );
    
    if (calories) {
      setEntry(prev => ({ ...prev, caloriesIn: calories }));
    } else {
      alert("AI 暂时无法估算，请稍后再试或手动输入 >_<");
    }
    setIsAnalyzing(false);
  };

  const mealConfig = [
    { label: '早餐', key: 'breakfast', icon: '🍳', placeholder: '早餐吃了什么美味呀？' },
    { label: '午餐', key: 'lunch', icon: '🍱', placeholder: '午餐吃了多少呢？' },
    { label: '晚餐', key: 'dinner', icon: '🥗', placeholder: '晚餐要清淡一点哦~' }
  ];

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm text-gray-500">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">记录一下 📝</h1>
      </div>

      {/* Date Picker */}
      <Card className="flex items-center justify-between">
        <label className="font-bold text-gray-600">日期</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-50 rounded-xl px-3 py-2 text-gray-700 outline-none focus:ring-2 ring-primary/20"
        />
      </Card>

      {/* Meals Input - Moved up for better flow with AI Calc */}
      <Card title="饮食打卡 🥗">
        <div className="space-y-4">
          {mealConfig.map((meal) => (
            <div key={meal.key} className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                {meal.icon} {meal.label}
              </label>
              <textarea
                rows={2}
                value={(entry as any)[meal.key] || ''}
                onChange={(e) => setEntry({...entry, [meal.key]: e.target.value})}
                placeholder={meal.placeholder}
                className="w-full bg-gray-50 rounded-xl p-3 text-gray-700 text-sm outline-none focus:bg-white focus:ring-2 ring-primary/20 transition-all resize-none"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Calorie Tracking */}
      <Card title="热量档案 (kcal) 🔥">
        <div className="mb-4 flex justify-between items-center bg-rose-50/50 p-2 rounded-xl">
           <span className="text-xs text-rose-400 font-bold px-2">没概念？让 AI 帮你算算 👇</span>
           <button 
             onClick={handleAICalculate}
             disabled={isAnalyzing}
             className="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-rose-100 flex items-center gap-1 active:scale-95 transition-transform"
           >
             {isAnalyzing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
             {isAnalyzing ? "估算中..." : "AI 估算摄入"}
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 rounded-2xl p-3 relative overflow-hidden">
             <div className="flex items-center gap-1 text-xs text-rose-500 font-bold mb-1">
               <Apple size={14} /> 摄入
             </div>
             <input 
               type="number" 
               placeholder="0"
               value={entry.caloriesIn || ''}
               onChange={(e) => setEntry({...entry, caloriesIn: parseInt(e.target.value) || undefined})}
               className="w-full bg-transparent text-2xl font-bold text-gray-700 outline-none placeholder:text-gray-300 relative z-10"
             />
             {/* Visual decoration */}
             <div className="absolute -bottom-2 -right-2 text-rose-100 transform rotate-12 pointer-events-none">
                <Sparkles size={40} />
             </div>
          </div>
          <div className="bg-orange-50 rounded-2xl p-3">
             <div className="flex items-center gap-1 text-xs text-orange-500 font-bold mb-1">
               <Flame size={14} /> 运动/消耗
             </div>
             <input 
               type="number" 
               placeholder="0"
               value={entry.caloriesOut || ''}
               onChange={(e) => setEntry({...entry, caloriesOut: parseInt(e.target.value) || undefined})}
               className="w-full bg-transparent text-2xl font-bold text-gray-700 outline-none placeholder:text-gray-300"
             />
          </div>
        </div>
      </Card>

      {/* Weight Input */}
      <Card title="体重 (kg)">
        <div className="flex items-end gap-2">
           <input 
             type="number" 
             step="0.1"
             placeholder="0.0"
             value={entry.weight || ''}
             onChange={(e) => setEntry({...entry, weight: parseFloat(e.target.value)})}
             className="text-4xl font-bold text-primary w-full outline-none placeholder:text-gray-200"
           />
           <span className="mb-2 text-gray-400 font-medium">kg</span>
        </div>
      </Card>

      <Button onClick={handleSave} fullWidth>
        <Save size={18} />
        保存记录
      </Button>
    </div>
  );
};
