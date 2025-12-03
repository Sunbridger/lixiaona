import React, { useState, useEffect } from 'react';
import { AppData, TabView } from './types';
import { getAppData } from './services/storage';
import { Home } from './pages/Home';
import { LogEntry } from './pages/LogEntry';
import { History } from './pages/History';
import { AICoach } from './pages/AICoach';
import { Profile } from './pages/Profile';
import { Home as HomeIcon, PlusCircle, Calendar, Sparkles, User } from 'lucide-react';

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
      case TabView.AI:
        return <AICoach data={data} />;
      case TabView.PROFILE:
        return <Profile data={data} onSave={() => { refreshData(); setCurrentTab(TabView.HOME); }} />;
      default:
        return <Home data={data} onNavigateLog={() => setCurrentTab(TabView.LOG)} />;
    }
  };

  return (
    // Main container uses 100dvh for proper mobile height and handles safe area paddings
    <div className="relative w-full h-full max-w-md mx-auto bg-transparent flex flex-col shadow-2xl overflow-hidden">
      
      {/* Top Safe Area Spacer (Dynamic Island/Notch) */}
      {/* Using pt-safe-top logic via standard padding or specific pixel amount if env not supported well in all contexts, but tailored here */}
      <div className="w-full shrink-0" style={{ height: 'max(env(safe-area-inset-top), 20px)' }} />

      {/* Main Content Scrollable Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-28 pt-4">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      {/* Added safe-area-inset-bottom padding support */}
      <nav 
        className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/50 px-6 flex justify-between items-end z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_-5px_rgba(255,158,170,0.15)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', paddingTop: '12px' }}
      >
        <button 
          onClick={() => setCurrentTab(TabView.HOME)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === TabView.HOME ? 'text-primary -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <div className="relative">
            <HomeIcon size={24} strokeWidth={currentTab === TabView.HOME ? 2.5 : 2} className={currentTab === TabView.HOME ? "opacity-0" : "opacity-100"} />
            <HomeIcon size={24} strokeWidth={currentTab === TabView.HOME ? 2.5 : 2} fill="currentColor" className={`absolute top-0 left-0 ${currentTab === TabView.HOME ? "opacity-100" : "opacity-0"}`} />
          </div>
          <span className="text-[10px] font-bold">首页</span>
        </button>

        <button 
          onClick={() => setCurrentTab(TabView.HISTORY)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === TabView.HISTORY ? 'text-primary -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <Calendar size={24} strokeWidth={currentTab === TabView.HISTORY ? 2.5 : 2} />
          <span className="text-[10px] font-bold">历史</span>
        </button>

        {/* Floating Add Button */}
        <button 
          onClick={() => setCurrentTab(TabView.LOG)}
          className="relative -top-6 bg-gradient-to-tr from-primary to-rose-400 text-white p-4 rounded-full shadow-float hover:scale-105 transition-all duration-300 active:scale-95 group"
        >
          <PlusCircle size={32} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <button 
          onClick={() => setCurrentTab(TabView.AI)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === TabView.AI ? 'text-primary -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <Sparkles size={24} strokeWidth={currentTab === TabView.AI ? 2.5 : 2} />
          <span className="text-[10px] font-bold">私教</span>
        </button>
        
        <button 
          onClick={() => setCurrentTab(TabView.PROFILE)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === TabView.PROFILE ? 'text-primary -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <User size={24} strokeWidth={currentTab === TabView.PROFILE ? 2.5 : 2} />
          <span className="text-[10px] font-bold">我的</span>
        </button>
      </nav>
    </div>
  );
};

export default App;