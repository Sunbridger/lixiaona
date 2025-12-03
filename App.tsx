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
    setData(getAppData());
  }, [currentTab]);

  const refreshData = () => {
    setData(getAppData());
  };

  if (!data) return <div className="h-screen flex items-center justify-center bg-rose-50 text-primary font-bold animate-pulse">MomoFit 加载中... 🐰</div>;

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
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden shadow-2xl bg-transparent">
      {/* Safe Area Top Padding */}
      <div className="h-14 w-full bg-transparent pointer-events-none" />

      {/* Main Content Area */}
      <main className="px-5 h-full overflow-y-auto no-scrollbar pb-32">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-white/50 pb-8 pt-3 px-6 flex justify-between items-end z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_-5px_rgba(255,158,170,0.15)]">
        <button 
          onClick={() => setCurrentTab(TabView.HOME)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentTab === TabView.HOME ? 'text-primary -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <HomeIcon size={24} strokeWidth={currentTab === TabView.HOME ? 2.5 : 2} fill={currentTab === TabView.HOME ? "currentColor" : "none"} className={currentTab === TabView.HOME ? "opacity-20" : ""} />
          <HomeIcon size={24} strokeWidth={currentTab === TabView.HOME ? 2.5 : 2} className={`absolute ${currentTab === TabView.HOME ? "" : "hidden"}`} />
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
          className="relative -top-8 bg-gradient-to-tr from-primary to-rose-400 text-white p-4 rounded-full shadow-float hover:scale-105 transition-all duration-300 active:scale-95 group"
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