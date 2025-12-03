import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export const IOSInstallPrompt: React.FC<{ avatar?: string }> = ({ avatar }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    // Show prompt only on iOS browsers (not installed app)
    if (isIOS && !isStandalone) {
      // Delay slightly to not annoy immediately
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl p-6 shadow-float animate-slide-up pb-safe-bottom">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-xl bg-primary/10 overflow-hidden shadow-inner border border-primary/20 shrink-0">
               {avatar ? (
                 <img src={avatar} alt="App Icon" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-2xl">🐰</div>
               )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">添加到主屏幕</h3>
              <p className="text-sm text-gray-500">安装应用，图标就是你的头像哦 ✨</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPrompt(false)}
            className="p-1 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-600 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-primary font-bold shadow-sm text-xs">1</span>
            <span>点击底部工具栏的 <Share className="inline w-4 h-4 mx-1 text-blue-500" /> 分享按钮</span>
          </div>
          <div className="h-px bg-rose-200/50 w-full ml-9" />
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-primary font-bold shadow-sm text-xs">2</span>
            <span>向下滑动选择 <span className="font-bold text-gray-800">添加到主屏幕</span></span>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center pb-2">
            <div className="animate-bounce text-primary/50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            </div>
        </div>
      </div>
    </div>
  );
};
