import React, { useState, useRef, useEffect } from 'react';
import { AppData } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { generateDietAdvice } from '../services/geminiService';
import { Sparkles, Send, Bot } from 'lucide-react';

export const AICoach: React.FC<{ data: AppData }> = ({ data }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "嗨！我是 Momo，你的专属减肥小姐妹！🎀 关于饮食或进度有什么想问的吗？" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const advice = await generateDietAdvice(data, userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', text: advice }]);
    setLoading(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] page-transition">
      <h1 className="text-2xl font-bold text-gray-800 px-2 mb-4">Momo 教练 🎀</h1>
      
      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 no-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-white text-gray-700 rounded-bl-none border border-rose-50'}
            `}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold text-xs uppercase">
                  <Bot size={14} /> Momo
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center">
                <Sparkles size={16} className="text-primary animate-spin" />
                <span className="text-xs text-gray-400">思考中...</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-4 bg-white p-3 rounded-3xl shadow-soft flex gap-2 border border-rose-50">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="问点建议..."
          className="flex-1 bg-transparent outline-none text-gray-700 px-2"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-primary text-white p-3 rounded-full hover:bg-rose-400 disabled:opacity-50 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};