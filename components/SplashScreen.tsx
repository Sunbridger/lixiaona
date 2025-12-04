import React from 'react';

interface SplashScreenProps {
  isLoading: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#FFF9F9] via-[#FFE5E5] to-[#FFD0D0] animate-in fade-in duration-300">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(#FFB6C1 1.5px, transparent 1.5px)',
          backgroundSize: '30px 30px'
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6 animate-in zoom-in duration-500">
        {/* Splash Image */}
        <div className="relative">
          <img
            src="/splash.png"
            alt="MomoFit"
            className="w-64 h-64 object-contain drop-shadow-2xl animate-in zoom-in duration-700"
          />

          {/* Sparkle Effects */}
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce">✨</div>
          <div className="absolute -bottom-2 -left-4 text-3xl animate-pulse">💖</div>
          <div className="absolute top-1/2 -right-6 text-2xl animate-bounce delay-150">⭐</div>
        </div>

        {/* App Name */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary animate-in slide-in-from-bottom-4 duration-700 delay-200">
            MomoFit
          </h1>
          <p className="text-sm text-gray-500 animate-in slide-in-from-bottom-4 duration-700 delay-300">
            可爱减肥记录
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="flex gap-2 animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Cute Message */}
        <p className="text-xs text-gray-400 animate-in fade-in duration-1000 delay-500">
          正在为你准备可爱的界面... 🐰
        </p>
      </div>
    </div>
  );
};
