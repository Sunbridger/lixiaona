
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
import { Home as HomeIcon, Plus, Calendar, User, MessageCircleHeart, ChevronsRight, X } from 'lucide-react';

const App = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.HOME);
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

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

  const navItems = [
    { tab: TabView.HOME, icon: HomeIcon, label: '首页' },
    { tab: TabView.HISTORY, icon: Calendar, label: '历史' },
    { tab: TabView.LOG, icon: Plus, label: '记一笔', isMain: true },
    { tab: TabView.AI_CHAT, icon: MessageCircleHeart, label: '小助手' },
    { tab: TabView.PROFILE, icon: User, label: '我的' },
  ];

  const DrawerButton = ({ tab, icon: Icon, label, isMain = false, index = 0 }: { tab: TabView, icon: any, label: string, isMain?: boolean, index?: number }) => {
    const isActive = currentTab === tab;
    return (
      <button
        onClick={() => { setCurrentTab(tab); setIsNavOpen(false); }}
        style={{ transitionDelay: `${index * 40}ms` }}
        className={`flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-200 ${
          isActive ? 'bg-primary/15 text-primary shadow-inner-soft' : 'text-gray-500 hover:bg-rose-50'
        }`}
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-soft scale-105' : 'bg-rose-50 text-primary/70'}`}>
          <Icon size={isMain ? 24 : 18} strokeWidth={isMain ? 2.6 : 2.2} />
        </div>
        <span className="text-sm font-bold">{label}</span>
      </button>
    );
  };

  return (
    // Main container - 固定占满视口高度，由 body 控制整体高度
    <div className="h-full w-full bg-[#FFF9F9] flex flex-col overflow-hidden relative">

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div
          className="max-w-md mx-auto p-4 min-h-full space-y-4"
          style={{
            paddingTop: `calc(12px + env(safe-area-inset-top))`,
            paddingBottom: `calc(48px + env(safe-area-inset-bottom))`
          }}
        >
           {renderContent()}
           <DeveloperInfo />
        </div>
      </main>

      {/* PWA / Install Features */}
      <IOSInstallPrompt avatar={data.profile.avatar} />
      <ReloadPrompt />

      <button
        onClick={() => setIsNavOpen(true)}
        className={`fixed left-1 top-1/2 -translate-y-1/2 z-40 px-1.5 py-3 rounded-r-full rounded-l-2xl border border-rose-100 bg-white/90 backdrop-blur-xl text-primary shadow-float transition-opacity duration-300 ${isNavOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <ChevronsRight size={18} />
      </button>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${isNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsNavOpen(false)}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        <div
          className={`absolute left-0 top-0 bottom-0 w-[236px] bg-white/95 backdrop-blur-2xl shadow-2xl border-r border-rose-50 rounded-r-3xl px-5 py-6 flex flex-col gap-4 transform transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">导航菜单</h2>
            <button className="p-1.5 rounded-full bg-rose-50 text-primary hover:bg-rose-100" onClick={() => setIsNavOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {navItems.map((item, idx) => (
              <DrawerButton key={item.tab} index={idx} {...item} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;
