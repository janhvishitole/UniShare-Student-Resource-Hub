
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Department, MarketplaceItem, StudyNote } from '../types';
import { firestoreService } from '../services/firestoreService';

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=student";

interface AssetDisplay {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
  type: 'item' | 'note';
  listingType?: string;
  condition?: string;
  owner?: string;
  ownerEmail?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userData, setUserData] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [myAssets, setMyAssets] = useState<AssetDisplay[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AssetDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    name: '',
    department: 'Computer' as Department,
    classYear: 'FE' as 'FE' | 'SE' | 'TE' | 'BE',
    rollNumber: '',
    avatarUrl: ''
  });

  const departments: Department[] = ['Computer', 'IT', 'E&TC', 'Mechanical', 'Civil', 'Chemical', 'Robotics', 'AI&DS', '1st Year (General)'];
  const years: ('FE' | 'SE' | 'TE' | 'BE')[] = ['FE', 'SE', 'TE', 'BE'];

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('user') || 'null');
    if (!session) return;

    // Persistently subscribe to this student's cloud document
    const unsubscribeUser = firestoreService.subscribeToUser(session.uid, (user) => {
      if (user) {
        setUserData(user);
        
        // SMART ONBOARDING: If profile details are missing, trigger edit mode automatically
        if (!user.name || !user.department || !user.classYear) {
          setIsEditing(true);
        }

        if (!isEditing) {
          setForm({
            name: user.name || '',
            department: user.department || 'Computer',
            classYear: user.classYear || 'FE',
            rollNumber: user.rollNumber || '',
            avatarUrl: user.avatarUrl || DEFAULT_AVATAR
          });
        }
      }
      setLoading(false);
    });

    const unsubscribeListings = firestoreService.subscribeToListings((all) => {
      const filteredItems: AssetDisplay[] = all
        .filter(item => item.ownerEmail === session.email)
        .map(i => ({
          id: i.id,
          title: i.title,
          price: i.price,
          imageUrl: i.imageUrl,
          type: 'item',
          listingType: i.listingType,
          condition: i.condition
        }));

      firestoreService.subscribeToNotes((allNotes) => {
        const filteredNotes: AssetDisplay[] = allNotes
          .filter(n => n.authorEmail === session.email && n.format.includes('Hardcopy'))
          .map(n => ({
            id: n.id,
            title: n.title,
            type: 'note',
            condition: n.format
          }));
          
        setMyAssets([...filteredItems, ...filteredNotes]);
      });
    });

    return () => {
      unsubscribeUser();
      unsubscribeListings();
    };
  }, [isEditing]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '#/login';
    window.location.reload();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = await firestoreService.uploadImage(reader.result as string);
        setForm(prev => ({ ...prev, avatarUrl: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userData) return;
    const updatedUser: User = { ...userData, ...form };
    await firestoreService.saveUser(updatedUser);
    setIsEditing(false);
  };

  const handleStatusUpdate = async (id: string, status: string, asset: AssetDisplay) => {
    const isReturning = status === 'completed';
    const isSale = asset.listingType === 'Sell';
    
    if (isReturning && userData) {
      if (!isSale) {
        const confirmed = window.confirm(`Confirm that "${asset.title}" was returned in good condition? +15 Karma will be awarded.`);
        if (!confirmed) return;
        
        // Persist award to cloud folder
        const updatedUser = { 
          ...userData, 
          karma: userData.karma + 15,
          totalCarbonSaved: userData.totalCarbonSaved + 1.2 // Increment persistent eco stats
        };
        await firestoreService.saveUser(updatedUser);
      } else {
        const updatedUser = { 
          ...userData, 
          karma: userData.karma + 10,
          totalCarbonSaved: userData.totalCarbonSaved + 2.5 
        };
        await firestoreService.saveUser(updatedUser);
      }
    }

    await firestoreService.setTradeStatus(id, status);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Cloud Profile...</p>
    </div>
  );

  if (!userData) return null;

  const karma = userData.karma ?? 100;
  const getRankInfo = () => {
    if (karma >= 150) return { label: 'Legendary Engineer', color: 'text-amber-600', bg: 'bg-amber-100', icon: 'fa-crown' };
    if (karma >= 50) return { label: 'Pro Engineer', color: 'text-blue-600', bg: 'bg-blue-100', icon: 'fa-bolt' };
    return { label: 'Rookie Engineer', color: 'text-slate-600', bg: 'bg-slate-100', icon: 'fa-seedling' };
  };

  const rank = getRankInfo();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-10">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/60 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-2xl">
                <img src={isEditing ? form.avatarUrl : (userData.avatarUrl || DEFAULT_AVATAR)} className="w-full h-full object-cover" alt="Profile" />
                {isEditing && (
                  <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <i className="fas fa-camera"></i>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-xl ${rank.bg} ${rank.color} border-2 border-white flex items-center justify-center shadow-lg`}>
                <i className={`fas ${rank.icon}`}></i>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-4 w-full">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-center gap-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{userData.name}</h2>
                    {userData.isVerified && (
                      <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg border border-white" title="Verified BVDU student">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </div>
                  <div className={`inline-flex items-center self-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${rank.bg} ${rank.color}`}>
                     <i className={`fas ${rank.icon}`}></i> {rank.label}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl text-center border border-slate-100 shadow-sm">
                    <span className="block text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Department</span>
                    <span className="text-xs font-black text-slate-700">{userData.department || 'Not Set'}</span>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl text-center border border-slate-100 shadow-sm">
                    <span className="block text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">Class</span>
                    <span className="text-xs font-black text-slate-700">{userData.classYear || 'Not Set'}</span>
                  </div>
                </div>
                
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-3xl mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <i className="fas fa-leaf"></i>
                    </div>
                    <div className="text-left">
                      <span className="block text-[8px] font-black text-emerald-800 uppercase tracking-widest">Sustainability Impact</span>
                      <span className="text-xs font-black text-emerald-600 uppercase">Legacy Carbon Saved</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-900">{userData.totalCarbonSaved.toFixed(1)}kg</span>
                    <span className="block text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">CO2 Equiv.</span>
                  </div>
                </div>

                <button onClick={() => setIsEditing(true)} className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-black active:scale-95 transition-all">Update Identity</button>
              </div>
            ) : (
              <div className="w-full space-y-4 text-left">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-relaxed">
                    <i className="fas fa-info-circle mr-2"></i>
                    {userData.name ? "Edit your details" : "Fill your details to complete UniShare Onboarding"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Display Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white/60 p-4 rounded-xl font-bold border border-slate-100 outline-none focus:border-blue-500 transition-colors shadow-inner" placeholder="Full Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Department</label>
                    <select value={form.department} onChange={e => setForm({...form, department: e.target.value as any})} className="w-full bg-white/60 p-4 rounded-xl font-bold border border-slate-100 shadow-inner">
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1">Year</label>
                    <select value={form.classYear} onChange={e => setForm({...form, classYear: e.target.value as any})} className="w-full bg-white/60 p-4 rounded-xl font-bold border border-slate-100 shadow-inner">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  {userData.name && (
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-white/80 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                  )}
                  <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">Complete Profile</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Listings</h4>
            <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{myAssets.length}</span>
          </div>
          <div className="space-y-3">
            {myAssets.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-white/50 backdrop-blur-md rounded-3xl border border-dashed border-slate-200 shadow-sm">No active listings yet.</p>
            ) : (
              myAssets.map(item => {
                const trade = firestoreService.getTradeStatus(item.id);
                const status = trade?.status || 'active';
                const isNonSale = item.listingType === 'Rent' || item.listingType === 'Free';

                return (
                  <div key={item.id} className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] border border-white/60 shadow-md flex flex-col gap-4 hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-inner">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-500 text-xl">
                            <i className="fas fa-pen-nib"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{item.title}</h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${item.listingType === 'Free' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{item.listingType}</span>
                          <span className="text-slate-200">•</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.condition}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100/50">
                      <button 
                        onClick={() => handleStatusUpdate(item.id, 'requested', item)}
                        className={`px-3 py-2 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all ${
                          status === 'requested' ? 'bg-amber-400 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                        }`}
                      >Requested</button>
                      <button 
                        onClick={() => handleStatusUpdate(item.id, 'accepted', item)}
                        className={`px-3 py-2 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all ${
                          status === 'accepted' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                        }`}
                      >Accepted</button>
                      <button 
                        onClick={() => handleStatusUpdate(item.id, 'completed', item)}
                        className={`px-3 py-2 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all ${
                          status === 'completed' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                        }`}
                      >{isNonSale ? 'Returned' : 'Completed'}</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest">Settings & Security</h4>
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/60 shadow-2xl space-y-2">
          
          <button 
            onClick={() => navigate('/jwt-tool')}
            className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl border border-white/10 hover:bg-black transition-all group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm">
                <i className="fas fa-terminal"></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Developer Utilities</span>
            </div>
            <i className="fas fa-arrow-right text-[10px]"></i>
          </button>

          <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
             <i className="fas fa-fingerprint"></i>
             Persistent Sync Enabled
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-rose-50/50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-sm">
                <i className="fas fa-sign-out-alt"></i>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Logout Session</span>
            </div>
          </button>
        </div>

        <div className="p-8 rounded-[2.5rem] border bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
           <i className="fas fa-shield-halved absolute -bottom-4 -right-4 text-white/10 text-9xl rotate-12"></i>
           <span className="text-2xl font-black uppercase tracking-tight relative z-10">Cloud Secured</span>
           <span className="text-[9px] font-bold text-blue-100 uppercase tracking-widest text-center leading-relaxed relative z-10">
             Your profile data is encrypted and tied to your university email UID.
           </span>
           <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative z-10">
             <div className="h-full bg-white w-3/4"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
