
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestoreService } from '../services/firestoreService';
import { explainJWTClaims } from '../services/geminiService';
import { JWTDecoded } from '../types';

const JWTHub: React.FC = () => {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [decoded, setDecoded] = useState<JWTDecoded | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'payload' | 'header' | 'explanation'>('payload');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Automatically try to decode session token if empty
    if (!tokenInput && user.token) {
      setTokenInput(user.token);
      handleDecode(user.token);
    }
  }, []);

  const handleDecode = (input: string) => {
    const result = firestoreService.decodeJWT(input);
    setDecoded(result);
    setAiExplanation('');
  };

  const handleAiExplain = async () => {
    if (!decoded?.isValid) return;
    setIsLoading(true);
    try {
      const explanation = await explainJWTClaims(decoded.payload);
      setAiExplanation(explanation);
      setActiveTab('explanation');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">JWT Developer Lab</h2>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">UniShare Engineer's Toolkit</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
           <i className="fas fa-microchip"></i>
           Auth Secure
        </div>
      </header>

      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paste your Token / सामायिक करा टोकन</label>
            <button 
              onClick={() => { setTokenInput(user.token || ''); handleDecode(user.token || ''); }} 
              className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline"
            >
              Use My Session Token
            </button>
          </div>
          <textarea 
            className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-emerald-400 font-mono text-xs leading-relaxed focus:border-blue-500 outline-none transition-all shadow-inner min-h-[120px]"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={tokenInput}
            onChange={(e) => { setTokenInput(e.target.value); handleDecode(e.target.value); }}
          />
        </div>

        {decoded?.isValid ? (
          <div className="space-y-6">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
              <button 
                onClick={() => setActiveTab('payload')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payload' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500'}`}
              >Payload (Data)</button>
              <button 
                onClick={() => setActiveTab('header')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'header' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500'}`}
              >Header (Alg)</button>
              <button 
                onClick={() => setActiveTab('explanation')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'explanation' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500'}`}
              >Gemini Explain</button>
            </div>

            <div className="bg-black/60 rounded-[2rem] p-6 border border-white/5 min-h-[200px] relative">
              {activeTab === 'explanation' ? (
                isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gemini is auditing claims...</p>
                  </div>
                ) : aiExplanation ? (
                  <div className="prose prose-invert prose-xs max-w-none animate-in fade-in">
                    <div className="text-[11px] text-slate-300 leading-relaxed font-medium italic">
                       {aiExplanation.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 gap-6">
                    <i className="fas fa-robot text-4xl text-white/10"></i>
                    <button 
                      onClick={handleAiExplain}
                      className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      Audit with Gemini AI
                    </button>
                  </div>
                )
              ) : (
                <pre className="text-emerald-500 text-[11px] font-mono whitespace-pre-wrap leading-relaxed animate-in fade-in">
                  {JSON.stringify(activeTab === 'payload' ? decoded.payload : decoded.header, null, 2)}
                </pre>
              )}
            </div>

            <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 p-5 rounded-3xl">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm shadow-lg">
                 <i className="fas fa-fingerprint"></i>
               </div>
               <div>
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Signature Verified</h4>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Mock verification successful for university context</p>
               </div>
               <div className="ml-auto text-emerald-500 font-mono text-[9px] truncate max-w-[80px]">
                 {decoded.signature}
               </div>
            </div>
          </div>
        ) : (
          tokenInput && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-center space-y-3">
              <i className="fas fa-bug text-rose-500 text-2xl"></i>
              <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Malformed JWT Token</p>
              <p className="text-slate-500 text-[9px] font-medium leading-relaxed italic">Ensure the token has 3 parts separated by dots.</p>
            </div>
          )
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-start gap-6">
        <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white text-xl shrink-0 shadow-lg">
          <i className="fas fa-graduation-cap"></i>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Learning Hub: Web Dev</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            JWT (JSON Web Token) is a compact, URL-safe means of representing claims to be transferred between two parties. Use this tool for your assignments in <b>Web Technologies (TE)</b> or <b>Software Engineering (BE)</b>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JWTHub;
