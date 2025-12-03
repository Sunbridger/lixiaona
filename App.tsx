import React, { useState, useEffect } from 'react';
import { AppData, TabView } from './types';
import { getAppData, STORAGE_KEY } from './services/storage';
import { Home } from './pages/Home';
import { LogEntry } from './pages/LogEntry';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import { Home as HomeIcon, PenTool, Calendar, User } from 'lucide-react';

const App = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.HOME);
  const [data, setData] = useState<AppData | null>(null);

  // Initial load
  useEffect(() => {
    // Simulate a tiny loading delay for smooth feel
    const load = async () => {
       await new Promise(r => setTimeout(r, 100));
       setData(getAppData());
    };
    load();
  }, []);

  // Listen for storage changes (multi-tab sync or re-add to homescreen persistence checks)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If the specific key changed, or if clear() was called (key is null)
      if (e.key === STORAGE_KEY || e.key === null) {
        setData(getAppData());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Refresh data when switching tabs to ensure internal consistency
  useEffect(() => {
    if (data) setData(getAppData());
  }, [currentTab]);

  // Sync Avatar to iOS Home Screen Icon
  useEffect(() => {
    if (data?.profile?.avatar) {
      generateAppIcon(data.profile.avatar);
    } else {
      generateAppIcon(null);
    }
  }, [data?.profile?.avatar]);

  // Dynamic Icon Generation Helper
  const generateAppIcon = (avatarBase64: string | null) => {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#FF9EAA'; // Primary color
    ctx.fillRect(0, 0, 180, 180);

    if (avatarBase64) {
      const img = new Image();
      // Important: Allow cross origin if needed, though usually base64
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Crop to square cover
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        
        ctx.drawImage(img, x, y, size, size, 0, 0, 180, 180);
        updateLinkTag(canvas.toDataURL('image/png'));
      };
      img.src = avatarBase64;
    } else {
      // Draw Default Emoji Icon
      ctx.fillStyle = '#FFF9F9'; // Light background
      ctx.fillRect(0, 0, 180, 180);
      
      ctx.font = '90px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐰', 90, 100);
      updateLinkTag(canvas.toDataURL('image/png'));
    }
  };

  const updateLinkTag = (dataUrl: string) => {
    const link = document.getElementById('dynamic-icon') as HTMLLinkElement;
    if (link) {
      link.href = dataUrl;
    }
  };

  const refreshData = () => {
    setData(getAppData());
  };

  if (!data) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FFF9F9] text-primary gap-4">
      <div className="text-6xl animate-bounce-slow">🐰</div>
      <div className="font-bold text-lg animate-pulse">MomoFit 加载中...</div>
    </div>
  );

  const renderContent = () => {
    switch (currentTab) {
      case TabView.HOME:
        return <Home data={data} onNavigateLog={() => setCurrentTab(TabView.LOG)} />;
      case TabView.LOG:
        return <LogEntry data={data} onBack={() => setCurrentTab(TabView.HOME)} />;
      case TabView.HISTORY:
        return <History data={data} />;
      case TabView.PROFILE:
        return <Profile data={data} onSave={() => { refreshData(); setCurrentTab(TabView.HOME); }} />;
      default:
        return <Home data={data} onNavigateLog={() => setCurrentTab(TabView.LOG)} />;
    }
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: TabView, icon: any, label: string }) => {
    const isActive = currentTab === tab;
    
    return (
      <button 
        onClick={() => setCurrentTab(tab)}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full group transition-all duration-200`}
      >
        <div className={`
          flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-300
          ${isActive 
            ? 'bg-primary text-white shadow-soft scale-105' 
            : 'bg-transparent text-gray-400 group-hover:text-primary group-hover:bg-rose-50'
          }
        `}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-bold transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    // Main container - Fixed to viewport height
    <div className="h-full w-full bg-[#FFF9F9] flex flex-col overflow-hidden relative">
      
      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar w-full pb-40">
        <div className="max-w-md mx-auto p-4 pt-safe-top min-h-full">
           {renderContent()}
        </div>
      </main>

      {/* iOS Install Prompt Overlay */}
      <IOSInstallPrompt avatar={data.profile.avatar} />

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-rose-100 z-50 pb-safe-bottom">
        <div className="max-w-md mx-auto h-[60px] grid grid-cols-4 items-center px-2">
          <NavButton tab={TabView.HOME} icon={HomeIcon} label="首页" />
          <NavButton tab={TabView.HISTORY} icon={Calendar} label="历史" />
          <NavButton tab={TabView.LOG} icon={PenTool} label="记一笔" />
          <NavButton tab={TabView.PROFILE} icon={User} label="我的" />
        </div>
      </nav>
      
    </div>
  );
};

export default App;