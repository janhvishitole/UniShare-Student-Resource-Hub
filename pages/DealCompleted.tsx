
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FeedbackType } from '../types';

const DealCompleted: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const traderName = searchParams.get('trader') || 'Fellow Engineer';
  const itemName = searchParams.get('item') || 'the item';
  const carbonSaved = searchParams.get('eco') || '0';

  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback) return;

    setIsSubmitting(true);
    
    setTimeout(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        let karmaChange = 0;
        
        if (feedback === 'Positive') {
          karmaChange = 10;
        } else if (feedback === 'Negative') {
          karmaChange = -10;
        } else if (feedback === 'Neutral') {
          karmaChange = 0;
        }
        
        user.karma = (user.karma ?? 100) + karmaChange;
        localStorage.setItem('user', JSON.stringify(user));
        
        window.dispatchEvent(new Event('storage'));
      }
      
      setIsSubmitting(false);
      setSubmitted(true);
      
      setTimeout(() => navigate('/'), 3000);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="relative">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-4xl shadow-xl shadow-emerald-50">
            <i className="fas fa-check"></i>
          </div>
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce">
            <i className="fas fa-leaf text-xs"></i>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900">Trade Successful!</h2>
          <p className="text-emerald-600 font-bold mt-2">You just saved <span className="underline decoration-wavy decoration-emerald-300">{carbonSaved}kg</span> of CO2 emissions.</p>
          <p className="text-slate-500 text-sm mt-1">Karma scores have been updated for both students.</p>
        </div>
        <p className="text-blue-600 font-bold text-sm">Returning to Marketplace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <i className="fas fa-handshake"></i> Trade Completed
        </div>
        <h2 className="text-3xl font-black text-slate-900">How was your trade?</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Help the BVDU community by rating your exchange for <b>{itemName}</b> with <b>{traderName}</b>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-3 gap-3">
          {(['Positive', 'Neutral', 'Negative'] as FeedbackType[]).map((type) => {
            const icons = { Positive: 'fa-face-laugh-beam', Neutral: 'fa-face-meh', Negative: 'fa-face-frown-open' };
            const colors = { 
              Positive: 'text-emerald-500 bg-emerald-50 border-emerald-200', 
              Neutral: 'text-amber-500 bg-amber-50 border-amber-200', 
              Negative: 'text-rose-500 bg-rose-50 border-rose-200' 
            };
            const activeColors = {
              Positive: 'bg-emerald-500 text-white border-emerald-600 scale-105 shadow-lg shadow-emerald-100',
              Neutral: 'bg-amber-500 text-white border-amber-600 scale-105 shadow-lg shadow-amber-100',
              Negative: 'bg-rose-500 text-white border-rose-600 scale-105 shadow-lg shadow-rose-100'
            };

            return (
              <button
                key={type}
                type="button"
                onClick={() => setFeedback(type)}
                className={`flex flex-col items-center justify-center py-6 px-2 rounded-3xl border-2 transition-all duration-300 ${
                  feedback === type ? activeColors[type] : `${colors[type]} opacity-60 hover:opacity-100`
                }`}
              >
                <i className={`fas ${icons[type]} text-3xl mb-3`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Optional Comment</label>
          <textarea
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[120px]"
            placeholder="Tell other students about your experience (e.g. 'Item exactly as described', 'Fair price', etc.)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={!feedback || isSubmitting}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl ${
            !feedback 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 active:scale-95 shadow-blue-200'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-circle-notch fa-spin"></i> Submitting...
            </span>
          ) : 'Submit Feedback'}
        </button>
      </form>

      <div className="bg-emerald-50 p-6 rounded-3xl flex items-start gap-4 border border-emerald-100">
        <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm shadow-emerald-100">
          <i className="fas fa-leaf text-xl"></i>
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wide">Eco Impact Detected</h4>
          <p className="text-[11px] text-emerald-700 leading-relaxed italic mt-1">
            Reusing this engineering hardware saves approximately <b>{carbonSaved}kg of CO2</b> emissions compared to buying new.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DealCompleted;
