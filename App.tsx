import React, { useState, useEffect } from 'react';
import { AppData, TabView } from './types';
import { getAppData } from './services/storage';
import { Home } from './pages/Home';
import { LogEntry } from './pages/LogEntry';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import { Home as HomeIcon, PenTool, Calendar, User } from 'lucide-react';

const App = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.HOME);
  const [data, setData] = useState<AppData | null>(null);

  // Load data on mount and whenever tab changes (to refresh views)
  useEffect(() => {
    // Simulate a tiny loading delay for smooth feel
    const load = async () => {
       // Allow time for font to load or just a nice entrance
       await new Promise(r => setTimeout(r, 100));
       setData(getAppData());
    };
    load();
  }, []);

  // Also refresh when switching tabs to ensure latest data
  useEffect(() => {
    if (data) setData(getAppData());
  }, [currentTab]);

  // Sync Avatar to iOS Home Screen Icon
  useEffect(() => {
    if (data?.profile?.avatar) {
      const link = document.getElementById('dynamic-icon') as HTMLLinkElement;
      if (link) {
        // Create a temporary canvas to ensure the image is a square (iOS requirement mostly)
        // or just use the base64 directly if it's already square-ish.
        // For simplicity and performance, we use the avatar directly.
        link.href = data.profile.avatar;
      }
    }
  }, [data?.profile?.avatar]);

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
        {/* Unified active state: Cute pill background for selected tab */}
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
    // Main container uses 100dvh for proper mobile height and handles safe area paddings
    <div className="relative w-full h-full max-w-md mx-auto bg-transparent flex flex-col shadow-2xl overflow-hidden">
      
      {/* IOS Install Prompt Overlay */}
      <IOSInstallPrompt avatar={data.profile.avatar} />

      {/* Top Safe Area Spacer (Dynamic Island/Notch) */}
      <div className="w-full shrink-0" style={{ height: 'max(env(safe-area-inset-top), 20px)' }} />

      {/* Main Content Scrollable Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 pt-4">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-rose-50 z-50 rounded-t-2xl shadow-[0_-4px_20px_-5px_rgba(255,158,170,0.1)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="grid grid-cols-4 h-[60px] items-center px-2">
          <NavButton tab={TabView.HOME} icon={HomeIcon} label="首页" />
          <NavButton tab={TabView.HISTORY} icon={Calendar} label="历史" />
          <NavButton tab={TabView.LOG} icon={PenTool} label="记录" />
          <NavButton tab={TabView.PROFILE} icon={User} label="我的" />
        </div>
      </nav>
    </div>
  );
};

export default App;