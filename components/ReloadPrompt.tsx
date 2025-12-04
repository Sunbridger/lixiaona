
import React, { useState, useEffect } from 'react';
import { RefreshCcw, CheckCircle2, CloudOff, Sparkles } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      // Use relative path for proper origin matching
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          setRegistration(reg);

          // Check for waiting worker on load
          if (reg.waiting) {
            console.log('[PWA] Found waiting worker on load');
            setNeedRefresh(true);
            setShowPrompt(true);
          }

          // Check for updates periodically (every 60 seconds)
          const checkForUpdates = () => {
            reg.update().catch(err => {
              console.log('[PWA] Update check failed:', err);
            });
          };

          // Check immediately and then every minute
          checkForUpdates();
          const updateInterval = setInterval(checkForUpdates, 60 * 1000);

          // Listen for new updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('[PWA] Update found, installing new version...');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                // If the new worker is installed and we already have a controller, it's an update
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version installed and ready');
                  setNeedRefresh(true);
                  setShowPrompt(true);
                }
              });
            }
          });

          return () => clearInterval(updateInterval);
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err);
        });

      // Listen for controller change (triggers page reload)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          console.log('[PWA] New service worker activated, reloading...');
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 2. Network Status Listeners
    const handleOnline = () => {
      console.log('[PWA] Back online');
      setIsOffline(false);
    };

    const handleOffline = () => {
      console.log('[PWA] Gone offline');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = async () => {
    if (!registration || !registration.waiting) {
      console.log('[PWA] No waiting worker found');
      return;
    }

    setIsUpdating(true);

    try {
      // Send message to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('[PWA] Sent SKIP_WAITING message to service worker');

      // The controllerchange event will trigger a reload
    } catch (error) {
      console.error('[PWA] Failed to update service worker:', error);
      setIsUpdating(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  // Don't show anything if no prompt and online
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
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-float border border-rose-100 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-rose-400 flex items-center justify-center text-white shrink-0 shadow-soft">
              {needRefresh ? (
                <Sparkles size={20} className={isUpdating ? 'animate-spin' : 'animate-pulse'} />
              ) : (
                <CheckCircle2 size={20} />
              )}
            </div>

            <div className="text-sm flex-1">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {needRefresh ? (
                  <>
                    <span>Momo 有新版本啦</span>
                    <span className="text-lg">✨</span>
                  </>
                ) : (
                  '准备就绪'
                )}
              </h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                {needRefresh
                  ? '点击更新以体验最新功能和性能优化'
                  : '应用已准备好离线使用，所有资源已缓存'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {needRefresh && (
              <button
                onClick={updateServiceWorker}
                disabled={isUpdating}
                className="bg-gradient-to-r from-primary to-rose-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-soft hover:shadow-float hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <RefreshCcw size={12} className="animate-spin" />
                    更新中...
                  </span>
                ) : (
                  '立即更新'
                )}
              </button>
            )}
            <button
              onClick={dismissPrompt}
              className="bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-all whitespace-nowrap"
            >
              {needRefresh ? '稍后提醒' : '关闭'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
