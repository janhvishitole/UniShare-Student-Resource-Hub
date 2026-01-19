
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { t } = useLanguage();
  const [karma, setKarma] = useState(100);
  const [avatar, setAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=student");
  
  // Consolidating navigation
  const navItems = [
    { path: '/', icon: 'fa-shopping-bag', label: t('marketplace') },
    { path: '/notes', icon: 'fa-book-open', label: t('notesHub') },
    { path: '/profile', icon: 'fa-user-gear', label: t('profile') },
  ];

  const updateUserState = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setKarma(user.karma ?? 100);
      setAvatar(user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`);
    }
  };

  useEffect(() => {
    updateUserState();
    const interval = setInterval(updateUserState, 2000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  if (location.pathname === '/login') return <>{children}</>;

  const isProfile = location.pathname === '/profile';
  const isNotes = location.pathname === '/notes';
  const isMarketplace = location.pathname === '/';
  const hideMainHeader = location.pathname === '/support' || location.pathname === '/scan';
  const hideBottomNav = location.pathname === '/scan' || location.pathname === '/support';

  // Soft Geometric Pastel Background for Profile
  const profileBgStyle = {
    backgroundColor: '#ffffff',
    backgroundImage: `
      linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%),
      url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66-3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-43c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm20-17c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")
    `,
    backgroundAttachment: 'fixed' as const,
  };

  // Caramel Brown Background for Notes Hub and Marketplace
  const caramelBgStyle = {
    backgroundColor: '#AF6F09', // Rich Caramel Brown
  };

  // Pink-Blue Mesh Gradient for Marketplace
  const meshBgStyle = {
    backgroundImage: `
      radial-gradient(at 0% 0%, #ff9a9e 0px, transparent 50%), 
      radial-gradient(at 100% 0%, #fad0c4 0px, transparent 50%), 
      radial-gradient(at 100% 100%, #fbc2eb 0px, transparent 50%), 
      radial-gradient(at 0% 100%, #a1c4fd 0px, transparent 50%),
      radial-gradient(at 50% 50%, #c2e9fb 0px, transparent 50%)
    `,
    filter: 'blur(100px)',
    opacity: 0.2,
  };

  const isNegative = karma < 0;
  const isMaster = karma > 150;

  return (
    <div className="min-h-screen pb-24 relative overflow-x-hidden">
      {/* Background Container */}
      {isProfile ? (
        <div className="fixed inset-0 -z-10" style={profileBgStyle}></div>
      ) : (isNotes || isMarketplace) ? (
        <div className="fixed inset-0 -z-10" style={caramelBgStyle}>
          {isMarketplace && <div className="absolute inset-0" style={meshBgStyle}></div>}
        </div>
      ) : (
        <div className="fixed inset-0 -z-10 bg-white"></div>
      )}

      {!hideMainHeader && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-white/40 px-6 py-4 flex items-center justify-between shadow-sm min-h-[80px]">
          <div className="flex items-center gap-4">
            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-slate-50 shrink-0">
              <Logo size={40} />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">UniShare</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">BVDUCOEP HUB</span>
                <span className="text-slate-200 text-[8px]">|</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('varasa')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
               <span className={`text-[10px] font-black uppercase tracking-widest ${isNegative ? 'text-rose-600' : 'text-slate-700'}`}>{karma} {t('karma')}</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase">Current Standing</span>
            </div>
            
            <Link to="/profile" className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-lg active:scale-95 transition-transform bg-slate-50 relative group">
              <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
              {isMaster && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm ring-2 ring-white">
                  <i className="fas fa-crown"></i>
                </div>
              )}
            </Link>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-5 py-6 relative z-10">
        {children}
      </main>

      {!hideBottomNav && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] px-3 py-3 flex items-center gap-2 shadow-2xl shadow-slate-300/50 w-[94%] max-w-md border border-white/10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white text-blue-600 shadow-xl scale-105' 
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <i className={`fas ${item.icon} text-base mb-1`}></i>
                <span className="text-[8px] font-black uppercase tracking-tight text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default Layout;
