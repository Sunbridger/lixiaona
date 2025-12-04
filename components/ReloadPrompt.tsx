
import React, { useState, useEffect } from 'react';
import { RefreshCcw, CheckCircle2, CloudOff } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      // CRITICAL FIX: Use relative path './sw.js' instead of absolute paths.
      // This ensures the origin matches the document's origin exactly.
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => {
          console.log('[SW] Registered successfully:', reg.scope);

          // Check for waiting worker on load
          if (reg.waiting) {
            console.log('[SW] Found waiting worker');
            setNeedRefresh(true);
            setShowPrompt(true);
          }

          // Listen for new updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('[SW] Update found, installing...');
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                // If the new worker is installed and we already have a controller, it's an update
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New version installed and waiting');
                  setNeedRefresh(true);
                  setShowPrompt(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error('[SW] Registration failed:', err);
        });

      // Listen for controller change (triggers page reload)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 2. Network Status Listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.waiting) {
        // Send message to skip waiting
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  };

  const close = () => {
    setShowPrompt(false);
  };

  if (!showPrompt && !isOffline) return null;

  // Offline Toast
  if (isOffline && !showPrompt) {
     return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 pointer-events-none">
           <div className="bg-gray-800/90 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
             <CloudOff size={14} /> 当前处于离线模式
           </div>
        </div>
     );
  }

  // Update Prompt
  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top-4 duration-500">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-float border border-rose-100 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-primary shrink-0">
            {needRefresh ? <RefreshCcw size={20} className="animate-spin-slow" /> : <CheckCircle2 size={20} />}
          </div>
          <div className="text-sm">
            <h3 className="font-bold text-gray-800">
              {needRefresh ? 'Momo 有新版本啦 ✨' : '准备就绪'}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {needRefresh ? '点击更新以体验最新功能' : '应用已准备好离线使用'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
            {needRefresh && (
                <button
                    onClick={updateServiceWorker}
                    className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl shadow-soft hover:scale-105 active:scale-95 transition-all"
                >
                    更新
                </button>
            )}
            <button
                onClick={close}
                className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-200 transition-all"
            >
                关闭
            </button>
        </div>
      </div>
    </div>
  );
};
