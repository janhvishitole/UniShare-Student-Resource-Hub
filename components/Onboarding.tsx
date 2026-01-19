
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const { lang } = useLanguage();

  const screens = [
    {
      title: "AI Tool Audit",
      titleHi: "AI टूल ऑडिट",
      titleMr: "एआय टूल ऑडिट",
      description: "Passing down your drawing kits or sensors? Use our Gemini-powered scanner to verify condition and detect damage instantly.",
      icon: "fa-qrcode",
      color: "bg-indigo-600",
      accent: "text-indigo-600"
    },
    {
      title: "Engineering Karma",
      titleHi: "इंजीनियरिंग कर्मा",
      titleMr: "अभियांत्रिकी कर्मा",
      description: "Every honest trade and helpful note upload builds your 'Varasa'. High karma unlocks the 'Master Engineer' status.",
      icon: "fa-bolt",
      color: "bg-amber-500",
      accent: "text-amber-500"
    },
    {
      title: "Safe Handover Zones",
      titleHi: "सुरक्षित क्षेत्र",
      titleMr: "सुरक्षित हस्तांतरण क्षेत्र",
      description: "Security first! Always meet at verified Safe Zones like the Central Library for your exchange.",
      icon: "fa-map-location-dot",
      color: "bg-emerald-500",
      accent: "text-emerald-500"
    }
  ];

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = screens[step];

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-700 ${current.color}`}></div>
      <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-700 ${current.color}`}></div>

      <div className="w-full max-w-sm flex flex-col items-center relative z-10">
        <div className="flex gap-2 mb-12">
          {screens.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 transition-all duration-300 rounded-full ${
                step === i ? `w-8 ${current.color}` : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="relative mb-10 group">
          <div className={`w-32 h-32 rounded-[2.5rem] ${current.color} shadow-2xl shadow-indigo-200 flex items-center justify-center transition-all duration-500 transform ${step % 2 === 0 ? 'rotate-3' : '-rotate-3'}`}>
            <i className={`fas ${current.icon} text-5xl text-white`}></i>
          </div>
        </div>

        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{current.title}</h2>
            <div className="flex justify-center gap-3">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${current.accent}`}>{current.titleHi}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${current.accent}`}>{current.titleMr}</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed px-2">
            {current.description}
          </p>
        </div>

        <button 
          onClick={handleNext}
          className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${current.color}`}
        >
          {step === screens.length - 1 ? "Start / शुरू करें / सुरू करा" : "Next / अगला / पुढे"}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
