
import React, { useState, useMemo } from 'react';
import { AppData } from '../types';
import { Card } from '../components/Card';
import { Filter } from 'lucide-react';

export const History: React.FC<{ data: AppData }> = ({ data }) => {
  // Default to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const sortedDates = useMemo(() => {
    return Object.keys(data.logs)
      .filter(date => date.startsWith(selectedMonth))
      .sort((a, b) => b.localeCompare(a));
  }, [data.logs, selectedMonth]);

  return (
    <div className="space-y-4 page-transition">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-2xl font-bold text-gray-800">历史记录 📅</h1>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100">
           <Filter size={14} className="text-primary" />
           <input 
             type="month" 
             value={selectedMonth}
             onChange={(e) => setSelectedMonth(e.target.value)}
             className="text-sm font-bold text-gray-600 outline-none bg-transparent"
           />
        </div>
      </div>
      
      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🍃</div>
          <p>这个月还没有记录哦！</p>
        </div>
      ) : (
        sortedDates.map(date => {
          const log = data.logs[date];
          return (
            <Card key={date} className="relative overflow-hidden group hover:border-primary/30 transition-colors">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                    <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {date}
                    </div>
                    {log.caloriesIn && log.caloriesOut && (
                        <div className="text-[10px] text-gray-400 flex gap-1">
                           <span>摄 {log.caloriesIn}</span>
                           <span>/</span>
                           <span>耗 {log.caloriesOut}</span>
                        </div>
                    )}
                 </div>
                 {log.weight && (
                   <div className="font-bold text-gray-700 text-lg">{log.weight} <span className="text-xs font-normal text-gray-400">kg</span></div>
                 )}
               </div>
               
               <div className="space-y-2 mt-3">
                 {log.breakfast && (
                   <div className="flex gap-2 text-sm items-start">
                      <span className="opacity-70 mt-0.5">🍳</span> <span className="text-gray-600 line-clamp-1">{log.breakfast}</span>
                   </div>
                 )}
                 {log.lunch && (
                   <div className="flex gap-2 text-sm items-start">
                      <span className="opacity-70 mt-0.5">🍱</span> <span className="text-gray-600 line-clamp-1">{log.lunch}</span>
                   </div>
                 )}
                 {log.dinner && (
                   <div className="flex gap-2 text-sm items-start">
                      <span className="opacity-70 mt-0.5">🥗</span> <span className="text-gray-600 line-clamp-1">{log.dinner}</span>
                   </div>
                 )}
                 {!log.breakfast && !log.lunch && !log.dinner && (
                    <div className="text-xs text-gray-400 italic pl-1">未记录饮食</div>
                 )}
               </div>
            </Card>
          );
        })
      )}
    </div>
  );
};
