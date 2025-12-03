import React, { useState, useEffect } from 'react';
import { AppData, DailyLog } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { saveDailyLog } from '../services/storage';
import { ChevronLeft, Utensils, Save } from 'lucide-react';

interface LogEntryProps {
  data: AppData;
  onBack: () => void;
}

export const LogEntry: React.FC<LogEntryProps> = ({ data, onBack }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  
  // Initialize state with existing log or empty
  const [entry, setEntry] = useState<DailyLog>(() => {
     return data.logs[today] || {
       id: today,
       date: Date.now(),
       weight: undefined,
       breakfast: '',
       lunch: '',
       dinner: ''
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
        dinner: ''
      });
    }
  }, [date, data.logs]);

  const handleSave = () => {
    saveDailyLog({
      ...entry,
      id: date,
      date: new Date(date).getTime()
    });
    // Visual feedback could be added here
    onBack();
  };

  const mealConfig = [
    { label: '早餐', key: 'breakfast', icon: '🍳', placeholder: '早餐吃了什么美味呀？' },
    { label: '午餐', key: 'lunch', icon: '🍱', placeholder: '午餐吃了多少呢？' },
    { label: '晚餐', key: 'dinner', icon: '🥗', placeholder: '晚餐要清淡一点哦~' }
  ];

  return (
    <div className="space-y-6 pb-24 page-transition">
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

      {/* Meals */}
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

      <Button onClick={handleSave} fullWidth>
        <Save size={18} />
        保存记录
      </Button>
    </div>
  );
};