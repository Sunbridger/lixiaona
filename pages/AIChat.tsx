
import React, { useState, useRef, useEffect } from 'react';
import { AppData, ChatMessage } from '../types';
import { chatWithMomo } from '../services/geminiService';
import { saveChatHistory } from '../services/storage';
import { Send, User, Sparkles, Trash2 } from 'lucide-react';

interface AIChatProps {
  data: AppData;
}

export const AIChat: React.FC<AIChatProps> = ({ data }) => {
  const defaultMessage: ChatMessage = { 
    role: 'assistant', 
    content: `嗨！${data.profile.name}，我是你的减肥小助手 Momo 酱！🐰✨\n今天有什么想聊的吗？可以问我食物热量，或者求鼓励哦！`,
    timestamp: Date.now()
  };

  // Initialize from props (data.chatHistory) or default
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

  // Save to persistence whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Prepare history for API (limit last 10 messages context to save tokens)
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
      saveChatHistory([]); // Clear in storage
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col min-h-full page-transition relative">
      {/* Header */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10 rounded-2xl mb-2 shadow-sm">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
           <Sparkles className="text-primary" size={20} /> 李小娜的小助手
        </h1>
        <button 
          onClick={handleClearHistory}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors"
          title="清空记录"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-5 pb-8 px-2">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white overflow-hidden ${
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
            <div className={`max-w-[75%] rounded-[20px] px-5 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-primary to-rose-400 text-white rounded-tr-sm shadow-soft' 
                : 'bg-white text-gray-700 rounded-tl-sm border border-rose-50'
            }`}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm border-2 border-white">🐰</div>
             <div className="bg-white px-4 py-3 rounded-[20px] rounded-tl-sm border border-rose-50 shadow-sm flex gap-1.5 items-center h-[44px]">
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Floating Input Bar - Fixed above Bottom Nav */}
      <div 
        className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
      >
         <div className="max-w-md mx-auto pointer-events-auto">
            <div className="bg-white/80 backdrop-blur-xl p-2 rounded-full shadow-[0_8px_32px_rgba(255,158,170,0.25)] border border-white/60 flex items-center gap-2 ring-1 ring-rose-100/50">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="和 Momo 聊聊减肥的事..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 px-4 py-2 placeholder:text-gray-400"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="bg-primary text-white w-10 h-10 rounded-full shadow-md flex items-center justify-center hover:bg-rose-500 active:scale-90 disabled:opacity-50 disabled:scale-100 transition-all duration-300"
              >
                <Send size={18} className="-ml-0.5" />
              </button>
            </div>
         </div>
      </div>
    </div>
  );
};
