
import React, { useState, useEffect, useRef } from 'react';
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

type MealType = 'breakfast' | 'lunch' | 'dinner';

export const LogEntry: React.FC<LogEntryProps> = ({ data, onBack }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  
  // Track individual meal calories for display
  const [mealCals, setMealCals] = useState<{ [key in MealType]: number | null }>({
    breakfast: null,
    lunch: null,
    dinner: null
  });

  const [analyzingStates, setAnalyzingStates] = useState<{ [key in MealType]: boolean }>({
    breakfast: false,
    lunch: false,
    dinner: false
  });
  
  // Initialize state
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
      // Reset local cal states on date change (or could try to infer if needed, but safe to reset)
      setMealCals({ breakfast: null, lunch: null, dinner: null });
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
      setMealCals({ breakfast: null, lunch: null, dinner: null });
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

  // Helper to calculate a single meal's calories
  const calculateSingleMeal = async (type: MealType, text: string): Promise<number> => {
    if (!text.trim()) return 0;
    
    // Pass the text to the corresponding argument, others empty
    const b = type === 'breakfast' ? text : '';
    const l = type === 'lunch' ? text : '';
    const d = type === 'dinner' ? text : '';
    
    try {
      const cal = await analyzeFoodCalories(b, l, d);
      return cal || 0;
    } catch (e) {
      console.warn(`Failed to calculate ${type}`, e);
      return 0;
    }
  };

  // Handle blur event: calculate specific meal and auto-sum others if needed
  const handleMealBlur = async (type: MealType) => {
    const text = (entry[type as keyof DailyLog] as string) || '';
    
    // Don't recalculate if text hasn't changed effectively (optimization skipped for simplicity/robustness)
    // Or if text is empty, just reset that meal cal
    if (!text.trim()) {
       setMealCals(prev => {
          const newState = { ...prev, [type]: null };
          updateTotalCalories(newState); // Recalculate total with 0 for this meal
          return newState;
       });
       return;
    }

    setAnalyzingStates(prev => ({ ...prev, [type]: true }));

    // 1. Calculate THIS meal
    const currentCal = await calculateSingleMeal(type, text);

    // 2. Check if other meals have text but NO calculated value (e.g., initial load)
    // We do this concurrently
    const otherMeals: MealType[] = (['breakfast', 'lunch', 'dinner'] as MealType[]).filter(t => t !== type);
    const missingCalUpdates: Partial<{ [key in MealType]: number }> = {};

    await Promise.all(otherMeals.map(async (otherType) => {
       const otherText = (entry[otherType as keyof DailyLog] as string) || '';
       // If there is text, but we haven't calculated it locally yet
       if (otherText.trim() && mealCals[otherType] === null) {
          setAnalyzingStates(prev => ({ ...prev, [otherType]: true }));
          const cal = await calculateSingleMeal(otherType, otherText);
          missingCalUpdates[otherType] = cal;
          setAnalyzingStates(prev => ({ ...prev, [otherType]: false }));
       }
    }));

    // 3. Update all states
    setMealCals(prev => {
      const newState = { 
        ...prev, 
        [type]: currentCal,
        ...missingCalUpdates 
      };
      
      // 4. Update Total Calories immediately
      updateTotalCalories(newState);
      
      return newState;
    });

    setAnalyzingStates(prev => ({ ...prev, [type]: false }));
  };

  const updateTotalCalories = (cals: { [key in MealType]: number | null }) => {
    const total = (cals.breakfast || 0) + (cals.lunch || 0) + (cals.dinner || 0);
    if (total > 0) {
      setEntry(prev => ({ ...prev, caloriesIn: total }));
    }
  };

  const renderMealInput = (label: string, key: MealType, icon: string, placeholder: string) => (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
          {icon} {label}
        </label>
        {/* Dynamic Calorie Label */}
        <div className="h-4 flex items-center">
            {analyzingStates[key] ? (
               <div className="flex items-center gap-1 text-[10px] text-primary animate-pulse">
                 <Loader2 size={10} className="animate-spin"/> 计算中...
               </div>
            ) : mealCals[key] ? (
               <div className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <Flame size={10} fill="currentColor" /> {mealCals[key]} kcal
               </div>
            ) : null}
        </div>
      </div>
      <textarea
        rows={2}
        value={(entry as any)[key] || ''}
        onChange={(e) => setEntry({...entry, [key]: e.target.value})}
        onBlur={() => handleMealBlur(key)}
        placeholder={placeholder}
        className="w-full bg-gray-50 rounded-xl p-3 text-gray-700 text-sm outline-none focus:bg-white focus:ring-2 ring-primary/20 transition-all resize-none"
      />
    </div>
  );

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

      {/* Meals Input */}
      <Card title="饮食打卡 🥗">
        <div className="space-y-4">
          {renderMealInput('早餐', 'breakfast', '🍳', '早餐吃了什么美味呀？')}
          {renderMealInput('午餐', 'lunch', '🍱', '午餐吃了多少呢？')}
          {renderMealInput('晚餐', 'dinner', '🥗', '晚餐要清淡一点哦~')}
        </div>
      </Card>

      {/* Calorie Tracking */}
      <Card title="热量档案 (kcal) 🔥">
        <div className="mb-2 text-xs text-gray-400 px-1">
           * 输入饮食后会自动估算热量并汇总哦
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 rounded-2xl p-3 relative overflow-hidden transition-all duration-300 ring-2 ring-transparent focus-within:ring-primary/20">
             <div className="flex items-center gap-1 text-xs text-rose-500 font-bold mb-1">
               <Apple size={14} /> 摄入 (汇总)
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
