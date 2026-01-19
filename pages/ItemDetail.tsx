
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestoreService } from '../services/firestoreService';
import { MarketplaceItem, StudyNote } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ItemDetail: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [item, setItem] = useState<MarketplaceItem | StudyNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackBar, setSnackBar] = useState({ show: false, msg: '' });
  const [isRequesting, setIsRequesting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email || 'guest';

  useEffect(() => {
    if (!id || !type) return;
    if (type === 'listing') {
      const all = firestoreService.getListings();
      setItem(all.find(i => i.id === id) || null);
    } else {
      const all = firestoreService.getNotes();
      setItem(all.find(n => n.id === id) || null);
    }
    setLoading(false);
  }, [id, type]);

  const showToast = (msg: string) => {
    setSnackBar({ show: true, msg });
    setTimeout(() => setSnackBar({ show: false, msg: '' }), 5000);
  };

  const handleAction = async () => {
    if (!item) return;
    setIsRequesting(true);
    await firestoreService.setTradeStatus(item.id, 'requested', userEmail);
    showToast('Trade request sent!');
    setTimeout(() => { setIsRequesting(false); navigate(-1); }, 2000);
  };

  if (loading || !item) return <div className="p-20 text-center">Loading...</div>;

  const isListing = type === 'listing';
  const listing = item as MarketplaceItem;
  const isOwner = isListing ? listing.ownerEmail === userEmail : (item as StudyNote).authorEmail === userEmail;
  const hasReview = isListing && listing.honestReview;

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{item.title}</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-white shadow-xl">
            {isListing ? <img src={listing.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><i className="fas fa-file-pdf text-9xl text-red-500"></i></div>}
          </div>
          
          {/* Eco Stat */}
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
             <i className="fas fa-leaf text-emerald-600 text-xl"></i>
             <p className="text-xs font-black text-emerald-900 uppercase">Legacy Impact: {isListing ? listing.carbonSaved : '0.2'}kg Carbon Saved</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Transparency Card for Buyers */}
          {hasReview ? (
            <div className="rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6" style={{ backgroundColor: '#C2B280' }}>
               <div className="bg-white rounded-[2rem] p-8 space-y-6 shadow-xl">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black text-slate-900">Honest Audit</h4>
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest">
                      Grade {listing.condition.charAt(0)}
                    </span>
                  </div>

                  <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                     <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-3">Faulty Things Detected</span>
                     <div className="space-y-2">
                        {listing.honestReview?.faults.length ? listing.honestReview.faults.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                            <i className="fas fa-circle text-[4px]"></i> {f}
                          </div>
                        )) : <div className="text-emerald-600 text-xs font-bold">No technical flaws detected.</div>}
                     </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">"{listing.honestReview?.grading_explanation}"</p>
                  </div>

                  {!isOwner && (
                    <button onClick={handleAction} disabled={isRequesting} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">
                      Accept Trade
                    </button>
                  )}
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl">
               <h3 className="text-3xl font-black text-slate-900">₹{isListing ? listing.price : 'Exchange'}</h3>
               <p className="text-slate-500 text-sm mt-4">{isListing ? listing.description : 'Academic resources shared for BVDUCOEP Hub.'}</p>
               {!isOwner && (
                 <button onClick={handleAction} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">Request Trade</button>
               )}
            </div>
          )}
        </div>
      </div>

      {snackBar.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl z-50">
          {snackBar.msg}
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
