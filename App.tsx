
import React, { useState, useEffect } from 'react';
import { AppData, TabView } from './types';
import { getAppData, STORAGE_KEY } from './services/storage';
import { Home } from './pages/Home';
import { LogEntry } from './pages/LogEntry';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { AIChat } from './pages/AIChat';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import { ReloadPrompt } from './components/ReloadPrompt';
import { SplashScreen } from './components/SplashScreen';
import { DeveloperInfo } from './components/DeveloperInfo';
import { Home as HomeIcon, Plus, Calendar, User, MessageCircleHeart } from 'lucide-react';

const App = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.HOME);
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  // Initial load with splash screen
  useEffect(() => {
    const load = async () => {
      // Show splash screen for at least 1.5 seconds for better UX
      const minLoadTime = new Promise(r => setTimeout(r, 1500));
      const dataLoad = new Promise(r => {
        setTimeout(() => {
          setData(getAppData());
          r(null);
        }, 100);
      });

      await Promise.all([minLoadTime, dataLoad]);
      setIsLoading(false);
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

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(Boolean(standalone));
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const listener = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Show splash screen during initial load
  if (isLoading || !data) {
    return <SplashScreen isLoading={true} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case TabView.HOME:
        return <Home data={data} onNavigateLog={() => setCurrentTab(TabView.LOG)} />;
      case TabView.LOG:
        return <LogEntry data={data} onBack={() => setCurrentTab(TabView.HOME)} />;
      case TabView.HISTORY:
        return <History data={data} />;
      case TabView.AI_CHAT:
        return <AIChat data={data} />;
      case TabView.PROFILE:
        return <Profile data={data} onSave={() => { refreshData(); setCurrentTab(TabView.HOME); }} />;
      default:
        return <Home data={data} onNavigateLog={() => setCurrentTab(TabView.LOG)} />;
    }
  };

  const NavButton = ({ tab, icon: Icon, label, isMain = false }: { tab: TabView, icon: any, label: string, isMain?: boolean }) => {
    const isActive = currentTab === tab;

    if (isMain) {
      return (
        <button
          onClick={() => setCurrentTab(tab)}
          className="flex flex-col items-center justify-center -mt-6 group"
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center shadow-float border-4 border-white transition-transform duration-200
            ${isActive ? 'bg-primary text-white scale-110' : 'bg-primary text-white hover:scale-105'}
          `}>
             <Icon size={28} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-1">{label}</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => setCurrentTab(tab)}
        className={`flex flex-col items-center justify-center gap-1 group transition-all duration-200`}
      >
        <div className={`
          flex items-center justify-center w-10 h-8 rounded-2xl transition-all duration-300
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
    // Main container - 固定占满视口高度，由 body 控制整体高度
    <div className="h-full w-full bg-[#FFF9F9] flex flex-col overflow-hidden relative">

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div
          className="max-w-md mx-auto p-4 min-h-full"
          style={{
            paddingTop: `calc(16px + env(safe-area-inset-top))`,
            paddingBottom: `calc(80px + env(safe-area-inset-bottom))`
          }}
        >
           {renderContent()}
           <DeveloperInfo />
        </div>
      </main>

      {/* PWA / Install Features */}
      <IOSInstallPrompt avatar={data.profile.avatar} />
      <ReloadPrompt />

      {/* Fixed Bottom Navigation - 真正贴底的方案 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-rose-100"
        style={{
          paddingBottom: isStandalone ? 0 : 'env(safe-area-inset-bottom)'
        }}
      >
        <nav
          className="max-w-md mx-auto w-full h-[60px] flex items-center justify-between px-4"
        >
          <NavButton tab={TabView.HOME} icon={HomeIcon} label="首页" />
          <NavButton tab={TabView.HISTORY} icon={Calendar} label="历史" />
          <NavButton tab={TabView.LOG} icon={Plus} label="记一笔" isMain={true} />
          <NavButton tab={TabView.AI_CHAT} icon={MessageCircleHeart} label="小助手" />
          <NavButton tab={TabView.PROFILE} icon={User} label="我的" />
        </nav>
        {/* standalone 模式下，安全区占位让导航栏背景延伸到屏幕底部 */}
        {isStandalone && (
          <div style={{ height: 'env(safe-area-inset-bottom)', backgroundColor: 'inherit' }} />
        )}
      </div>

    </div>
  );
};

export default App;
