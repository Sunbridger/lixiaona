import React from 'react';
import { AppData } from '../types';
import { Card } from '../components/Card';

export const History: React.FC<{ data: AppData }> = ({ data }) => {
  const sortedDates = Object.keys(data.logs).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4 page-transition">
      <h1 className="text-2xl font-bold text-gray-800 px-2">历史记录 📅</h1>
      
      {sortedDates.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p>还没有记录哦！</p>
          <p className="text-sm">从今天开始你的蜕变之旅吧 ✨</p>
        </div>
      ) : (
        sortedDates.map(date => {
          const log = data.logs[date];
          return (
            <Card key={date} className="relative overflow-hidden">
               <div className="flex justify-between items-start mb-2">
                 <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold">
                    {date}
                 </div>
                 {log.weight && (
                   <div className="font-bold text-gray-700">{log.weight} kg</div>
                 )}
               </div>
               
               <div className="space-y-2 mt-3">
                 {log.breakfast && (
                   <div className="flex gap-2 text-sm">
                      <span className="opacity-50">🍳</span> <span className="text-gray-600 line-clamp-1">{log.breakfast}</span>
                   </div>
                 )}
                 {log.lunch && (
                   <div className="flex gap-2 text-sm">
                      <span className="opacity-50">🍱</span> <span className="text-gray-600 line-clamp-1">{log.lunch}</span>
                   </div>
                 )}
                 {log.dinner && (
                   <div className="flex gap-2 text-sm">
                      <span className="opacity-50">🥗</span> <span className="text-gray-600 line-clamp-1">{log.dinner}</span>
                   </div>
                 )}
                 {!log.breakfast && !log.lunch && !log.dinner && (
                    <div className="text-xs text-gray-400 italic">未记录饮食</div>
                 )}
               </div>
            </Card>
          );
        })
      )}
    </div>
  );
};