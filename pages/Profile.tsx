import React, { useState } from 'react';
import { AppData } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { saveProfile } from '../services/storage';
import { User, Target, Ruler, Save, Award } from 'lucide-react';

export const Profile: React.FC<{ data: AppData; onSave: () => void }> = ({ data, onSave }) => {
  const [profile, setProfile] = useState(data.profile);

  const handleSave = () => {
    saveProfile(profile);
    onSave();
  };

  return (
    <div className="space-y-6 pb-24 page-transition">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-24 h-24 bg-gradient-to-tr from-primary to-rose-300 rounded-full flex items-center justify-center text-5xl shadow-float mb-4 border-4 border-white">
          🐰
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{profile.name} 的档案</h1>
      </div>

      <Card title="基本信息">
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-primary">
              <User size={18} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">昵称</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="w-full font-semibold text-gray-700 outline-none placeholder:text-gray-300"
                placeholder="你的名字"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-primary">
              <Ruler size={18} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">身高 (cm)</label>
              <input 
                type="number" 
                value={profile.height || ''}
                onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value)})}
                className="w-full font-semibold text-gray-700 outline-none placeholder:text-gray-300"
                placeholder="165"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="瘦身目标">
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-primary">
              <div className="text-xs font-bold">Start</div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">初始体重 (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={profile.startWeight}
                onChange={(e) => setProfile({...profile, startWeight: parseFloat(e.target.value)})}
                className="w-full font-semibold text-gray-700 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-primary">
              <Target size={18} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">目标体重 (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={profile.targetWeight}
                onChange={(e) => setProfile({...profile, targetWeight: parseFloat(e.target.value)})}
                className="w-full font-semibold text-primary text-lg outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-white/60 p-4 rounded-3xl flex gap-3 items-start text-sm text-gray-500 border border-white">
        <Award className="text-primary shrink-0" size={20} />
        <p>加油！只要坚持记录，Momo 相信你一定可以达到 {profile.targetWeight}kg 的！✨</p>
      </div>

      <Button onClick={handleSave} fullWidth>
        <Save size={18} />
        保存档案
      </Button>
    </div>
  );
};