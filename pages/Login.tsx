
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, Language } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import { firestoreService } from '../services/firestoreService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { lang, setLang, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate Auth delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (email.toLowerCase().endsWith('@bvuniversity.edu.in')) {
      const generatedUid = btoa(email.toLowerCase()).replace(/=/g, '');
      
      let user = await firestoreService.getUserByUid(generatedUid);
      
      if (!user) {
        user = { 
          uid: generatedUid,
          email: email.toLowerCase(), 
          name: '', 
          isLoggedIn: true,
          karma: 100,
          totalCarbonSaved: 0,
          isVerified: true,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email.toLowerCase()}`
        };
      }

      // Generate a simulated JWT for the session
      const token = firestoreService.generateSimulatedJWT(user);
      user.isLoggedIn = true;
      user.token = token;

      await firestoreService.saveUser(user);

      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
      navigate('/');
    } else {
      setError(t('loginError'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border-4 border-white/10 animate-in zoom-in-95 duration-500">
        <div className="absolute top-6 right-8 z-20">
          <select 
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="appearance-none bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 py-2 pl-4 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        <div className="text-center mb-10 relative z-10">
          <div className="inline-block bg-blue-50/50 p-6 rounded-[2.5rem] mb-6 shadow-inner ring-4 ring-white">
            <Logo size={80} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">UniShare</h2>
          <div className="flex flex-col items-center mt-2">
            <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest leading-none">BVDUCOEP HUB</span>
            <span className="text-blue-600 text-xs font-bold mt-2">{t('welcome')}</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
              {t('loginEmail')}
            </label>
            <input 
              type="email" 
              required
              placeholder="rollno@bvuniversity.edu.in"
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-rose-500 text-[10px] mt-2 font-black uppercase flex items-center gap-1.5">
                <i className="fas fa-exclamation-circle"></i> {error}
              </p>
            )}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-200 flex flex-col items-center justify-center gap-1 group active:scale-95 ${
              isSubmitting ? 'opacity-80' : ''
            }`}
          >
            {isSubmitting ? (
              <span className="text-[10px] uppercase tracking-widest animate-pulse">{t('loading')}</span>
            ) : (
              <span className="text-xs uppercase tracking-[0.2em]">{t('enterApp')}</span>
            )}
          </button>
        </form>

        <div className="mt-10 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center relative z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            BVDUCOEP: Building a legacy (Varasa) of resource sharing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
