
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppData, ChatMessage } from '../types';
import { chatWithMomo } from '../services/geminiService';
import { saveChatHistory } from '../services/storage';
import { Send, User, Trash2, Sparkles } from 'lucide-react';

interface AIChatProps {
  data: AppData;
}

export const AIChat: React.FC<AIChatProps> = ({ data }) => {
  const defaultMessage: ChatMessage = { 
    role: 'assistant', 
    content: `嗨！${data.profile.name}，我是你的减肥小助手 Momo 酱！🐰✨\n今天吃得怎么样呀？有什么想问我的吗？`,
    timestamp: Date.now()
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (data.chatHistory && data.chatHistory.length > 0) {
      return data.chatHistory;
    }
    return [defaultMessage];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  // Smart Contextual Suggestions based on Today's Logs
  const suggestions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const log = data.logs[todayStr];
    const list: string[] = [];
    
    // 1. Based on recorded meals
    if (log) {
       const meals = [];
       if (log.breakfast) meals.push("早餐");
       if (log.lunch) meals.push("午餐");
       if (log.dinner) meals.push("晚餐");
       
       if (meals.length > 0) {
         list.push(`分析${meals.join('+')}的热量`);
         list.push(`今天吃的${meals[0]}健康吗？`);
       }
       
       if (log.weight) {
          list.push(`我现在的体重${log.weight}kg需要注意什么？`);
       }
    }

    // 2. Time-based suggestions
    const hour = new Date().getHours();
    if (hour < 9) list.push("推荐一个减脂早餐");
    else if (hour > 11 && hour < 14) list.push("午餐吃什么不胖？");
    else if (hour > 17 && hour < 20) list.push("晚餐建议吃什么？");
    else if (hour > 21) list.push("饿了想吃夜宵怎么办？");

    // 3. Fallbacks
    if (list.length < 3) {
       list.push("喝水能减肥吗？");
       list.push("推荐几个燃脂运动");
       list.push("平台期怎么破？");
    }
    
    // Shuffle and pick top 4 to keep it fresh
    return list.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [data.logs]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const history = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));
    history.push({ role: 'user', content: userMsg.content });

    const replyContent = await chatWithMomo(history, data.profile);
    
    setMessages(prev => [...prev, { role: 'assistant', content: replyContent, timestamp: Date.now() }]);
    setIsLoading(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空和 Momo 的聊天记录吗？')) {
      const resetState = [defaultMessage];
      setMessages(resetState);
      saveChatHistory([]); 
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    // Root container: Using min-h to ensure full coverage but NO animations on root to prevent jumps
    <div className="-mx-4 -mt-4 flex flex-col min-h-[100dvh] bg-[#FFF9F9] relative">
      
      {/* Subtle Header */}
      <header className="sticky top-0 z-30 flex items-center justify-center py-2 bg-[#FFF9F9]/80 backdrop-blur-md h-10 border-b border-rose-50/50">
         <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 opacity-80">
            Momo 小助手 🐰
         </span>
      </header>
      
      {/* Messages Area - Removed 'animate-in' to prevent layout shifting/jumping on load */}
      <div className="flex-1 px-4 py-2 pb-48">
         {/* Clear Button */}
         {messages.length > 1 && (
            <div className="flex justify-center mb-6 opacity-40 hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleClearHistory}
                  className="text-[10px] text-gray-400 flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full border border-gray-100/50"
                >
                  <Trash2 size={10} /> 清空记录
                </button>
            </div>
         )}

        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-3 mb-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar - Top Aligned via items-start on parent */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white overflow-hidden mt-0 ${
              msg.role === 'user' ? 'bg-gray-100' : 'bg-primary text-white'
            }`}>
              {msg.role === 'user' ? (
                 data.profile.avatar ? (
                   <img src={data.profile.avatar} className="w-full h-full object-cover" alt="User"/>
                 ) : <User size={18} className="text-gray-400" />
              ) : (
                <span className="text-lg">🐰</span>
              )}
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-sm relative group ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-primary to-rose-400 text-white rounded-2xl rounded-tr-sm shadow-soft' 
                : 'bg-white text-gray-700 rounded-2xl rounded-tl-sm border border-rose-50'
            }`}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 mb-6">
             <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm border-2 border-white mt-0">🐰</div>
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-rose-50 shadow-sm flex gap-1 items-center h-[42px]">
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Fixed Bottom Input Area */}
      <div 
        className="fixed left-0 right-0 max-w-md mx-auto z-40 flex flex-col justify-end pointer-events-none transform-gpu translate-z-0"
        style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
      >
        {/* Suggestions Chips - Floating above */}
        {!inputText && !isLoading && (
          <div className="w-full px-4 pb-2 overflow-x-auto no-scrollbar flex gap-2 pointer-events-auto mask-gradient">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-3 py-1.5 bg-white/90 backdrop-blur border border-rose-100 text-rose-500 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-transform flex items-center gap-1 hover:bg-rose-50"
              >
                <Sparkles size={10} className="text-primary"/> {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white/95 backdrop-blur-md border-t border-rose-100 p-3 pointer-events-auto shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          <div className="flex items-end gap-2 bg-gray-50 rounded-3xl px-2 py-2 ring-1 ring-gray-100 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="想问点什么...？"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 px-3 py-2 placeholder:text-gray-400"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="bg-primary text-white w-9 h-9 rounded-full shadow-md flex items-center justify-center hover:bg-rose-500 active:scale-90 disabled:opacity-50 disabled:scale-100 transition-all duration-200 shrink-0 mb-0.5"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
