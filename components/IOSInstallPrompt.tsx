import React, { useState, useEffect } from 'react';
import { Share, X, PlusSquare } from 'lucide-react';

export const IOSInstallPrompt: React.FC<{ avatar?: string | null }> = ({ avatar }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    // Show prompt only on iOS browsers (not installed app)
    if (isIOS && !isStandalone) {
      // Delay slightly to not annoy immediately
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-500 animate-in fade-in">
      <div 
        className="bg-white rounded-t-3xl p-6 shadow-float animate-slide-up relative"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-center">
            {/* App Icon Preview */}
            <div className="w-16 h-16 rounded-[14px] bg-primary/10 overflow-hidden shadow-sm border border-black/5 shrink-0 relative">
               {avatar ? (
                 <img src={avatar} alt="App Icon" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-3xl bg-[#FFF9F9]">🐰</div>
               )}
               {/* Gloss effect overlay to mimic iOS icon */}
               <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">安装 MomoFit</h3>
              <p className="text-sm text-gray-500">添加到主屏幕，图标就是你的头像哦 ✨</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPrompt(false)}
            className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-600 bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-primary font-bold shadow-sm text-xs shrink-0">1</span>
            <span>点击底部浏览器工具栏的 <Share className="inline w-4 h-4 mx-0.5 text-[#007AFF]" /> 分享按钮</span>
          </div>
          <div className="h-px bg-rose-200/50 w-full ml-9" />
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-primary font-bold shadow-sm text-xs shrink-0">2</span>
            <span>向上滑动，找到 <span className="font-bold text-gray-800 inline-flex items-center gap-1 mx-1">添加到主屏幕 <PlusSquare size={14} className="text-gray-500"/></span></span>
          </div>
          <div className="h-px bg-rose-200/50 w-full ml-9" />
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-primary font-bold shadow-sm text-xs shrink-0">3</span>
            <span>点击右上角的 <span className="font-bold text-gray-800">添加</span> 即可</span>
          </div>
        </div>
        
        {/* Pointer Arrow pointing to the bottom toolbar */}
        <div className="mt-4 flex justify-center pb-1">
            <div className="animate-bounce text-primary/50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            </div>
        </div>
      </div>
    </div>
  );
};