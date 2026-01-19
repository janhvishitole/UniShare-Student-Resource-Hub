
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getSupportResponse } from '../services/geminiService';

const SupportHub: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [botLoading, setBotLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userName, setUserName] = useState('Student');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUserName(JSON.parse(userStr).name);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, botLoading]);

  const handleSupportQuery = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = manualQuery || query;
    if (!activeQuery.trim() || botLoading) return;

    setChatHistory(prev => [...prev, { role: 'user', text: activeQuery }]);
    setQuery('');
    setBotLoading(true);

    try {
      const response = await getSupportResponse(activeQuery);
      setChatHistory(prev => [...prev, { role: 'bot', text: response || 'Sorry, I am currently offline.' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Error contacting support.' }]);
    } finally { setBotLoading(false); }
  };

  const startVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') alert("Microphone access denied. Please check your browser settings.");
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSupportQuery(undefined, transcript);
    };

    recognition.start();
  }, [query]);

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in slide-in-from-bottom-10 duration-500 rounded-[2.5rem] overflow-hidden bg-white/40 backdrop-blur-md border border-white/60 shadow-2xl mt-4">
      <header className="flex items-center justify-between px-6 py-5 bg-white/90 backdrop-blur-xl border-b border-white/40 shadow-sm shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 text-slate-700 active:scale-90"><i className="fas fa-arrow-left"></i></button>
          <div className="ml-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Support Hub</h2>
            <div className="flex items-center gap-1.5 mt-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span><p className="text-[8px] text-blue-600 font-black uppercase">UniShare Assistant</p></div>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        <div className="bg-white/95 backdrop-blur-sm p-5 rounded-3xl rounded-tl-none border border-white/60 max-w-[85%] text-[11px] font-semibold text-slate-700 shadow-sm">
          <p className="mb-2">Hello, {userName}! I'm the UniShare Assistant. 👋</p>
          <p className="italic text-slate-500 font-medium text-[9px]">How can I help you? Use the microphone to speak your query.</p>
        </div>

        {chatHistory.map((chat, i) => (
          <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`p-5 rounded-[2rem] max-w-[85%] text-[11px] font-bold border ${chat.role === 'user' ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none' : 'bg-white/95 text-slate-800 border-white/60 rounded-tl-none shadow-md'}`}>
              {chat.text}
            </div>
          </div>
        ))}
        {botLoading && <div className="flex justify-start"><div className="bg-white/95 p-5 rounded-[2rem] rounded-tl-none border border-white/60 shadow-md animate-pulse">Thinking...</div></div>}
      </div>

      <div className="p-5 bg-white/60 backdrop-blur-md border-t border-white/40 shrink-0">
        <form onSubmit={handleSupportQuery} className="bg-white rounded-[2rem] p-2 flex gap-2 shadow-2xl border border-slate-100">
          <button type="button" onClick={startVoiceInput} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}>
            <i className={`fas ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
          </button>
          <input type="text" placeholder="Type or speak your question..." className="flex-1 bg-transparent border-none px-4 text-xs font-bold outline-none text-slate-800" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit" disabled={!query.trim() || botLoading} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:bg-slate-200"><i className="fas fa-paper-plane text-xs"></i></button>
        </form>
      </div>
    </div>
  );
};

export default SupportHub;
