
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CENTRAL_LIBRARY_COORDINATES, HANDOVER_DISTANCE_THRESHOLD_METERS } from '../constants';
import { Category, MarketplaceItem, Department } from '../types';
import { compareMarketplaceItems } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { firestoreService } from '../services/firestoreService';

const ItemImage: React.FC<{ src: string; alt: string; itemId: string }> = ({ src, alt, itemId }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  return (
    <div 
      className="relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden"
      style={{ viewTransitionName: `hero-${itemId}` } as any}
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {hasError ? (
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <i className="fas fa-image text-4xl"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Image Unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          }`}
        />
      )}
    </div>
  );
};

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All' | 'Wishlist'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [wishlist, setWishlist] = useState<MarketplaceItem[]>([]);
  const [compareList, setCompareList] = useState<MarketplaceItem[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonText, setComparisonText] = useState<string>('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showHandshake, setShowHandshake] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackBar, setSnackBar] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email || 'guest';

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToListings((data) => {
      setItems(data);
      setWishlist(firestoreService.getWishlist(userEmail));
      setLoading(false);
    });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => {
      unsubscribe();
      navigator.geolocation.clearWatch(watchId);
    };
  }, [userEmail]);

  const showToast = (msg: string) => {
    setSnackBar({ show: true, msg });
    setTimeout(() => setSnackBar({ show: false, msg: '' }), 3000);
  };

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice search not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      showToast(`Searching for: ${transcript}`);
    };

    recognition.start();
  }, []);

  const toggleWishlist = async (e: React.MouseEvent, item: MarketplaceItem) => {
    e.stopPropagation();
    e.preventDefault();
    await firestoreService.toggleWishlist(userEmail, item);
  };

  const startComparison = async () => {
    if (compareList.length === 2) {
      setCompareLoading(true);
      setShowCompareModal(true);
      try {
        const result = await compareMarketplaceItems(compareList[0], compareList[1]);
        setComparisonText(result || '');
      } catch (e) {
        setComparisonText('Error generating comparison.');
      } finally {
        setCompareLoading(false);
      }
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'UniShare BVDUCOEP',
      text: t('appShareText'),
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        showToast(t('linkCopied'));
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleShareItem = async (e: React.MouseEvent, item: MarketplaceItem) => {
    e.stopPropagation();
    e.preventDefault();
    const itemUrl = `${window.location.origin}/#/item/listing/${item.id}`;
    const shareData = {
      title: item.title,
      text: `${t('itemShareText')} ${item.title}`,
      url: itemUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(itemUrl);
        showToast(t('linkCopied'));
      }
    } catch (err) {
      console.error('Item share failed:', err);
    }
  };

  const handleRequest = async (e: React.MouseEvent, item: MarketplaceItem) => {
    e.stopPropagation();
    e.preventDefault();
    await firestoreService.setTradeStatus(item.id, 'requested', userEmail);
  };

  const handleAccept = async (e: React.MouseEvent, item: MarketplaceItem) => {
    e.stopPropagation();
    e.preventDefault();
    await firestoreService.setTradeStatus(item.id, 'accepted');
  };

  const handleCancel = async (e: React.MouseEvent, item: MarketplaceItem) => {
    e.stopPropagation();
    e.preventDefault();
    await firestoreService.setTradeStatus(item.id, 'active', '');
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredItems = useMemo(() => {
    let list = items;
    if (categoryFilter === 'Wishlist') {
      const wishlistIds = wishlist.map(i => i.id);
      list = items.filter(i => wishlistIds.includes(i.id));
    } else if (categoryFilter !== 'All') {
      list = items.filter(i => i.category === categoryFilter);
    }
    return list.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, categoryFilter, searchTerm, wishlist]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Trade Center...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {showHandshake && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center space-y-6">
              <h3 className="text-xl font-black uppercase text-slate-900">{t('safetyHandshake')}</h3>
              <div className="aspect-square bg-slate-50 rounded-[2rem] border-4 border-dashed border-blue-200 flex items-center justify-center p-4">
                 <i className="fas fa-qrcode text-8xl text-blue-600"></i>
              </div>
              <button 
                onClick={() => navigate(`/deal-completed?trader=${encodeURIComponent(showHandshake.owner)}&item=${encodeURIComponent(showHandshake.title)}&eco=${showHandshake.carbonSaved}`)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl"
              >Simulate Scan</button>
           </div>
        </div>
      )}

      {showCompareModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between bg-blue-600 text-white rounded-t-[2.5rem]">
              <h3 className="text-xl font-black uppercase">{t('comparison')}</h3>
              <button onClick={() => setShowCompareModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                {compareList.map(i => (
                  <div key={i.id} className="text-center p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-full aspect-square mb-2 overflow-hidden rounded-xl">
                      <ItemImage src={i.imageUrl} alt={i.title} itemId={i.id} />
                    </div>
                    <h4 className="font-black text-[10px] uppercase">{i.title}</h4>
                    <p className="text-blue-600 font-bold">₹{i.price}</p>
                  </div>
                ))}
              </div>
              {compareLoading ? <div className="text-center py-10 animate-pulse">Comparing Assets...</div> : <div className="bg-blue-50/50 p-6 rounded-[2rem] text-xs leading-relaxed">{comparisonText}</div>}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">{t('tradeCenter')}</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShareApp} 
            className="bg-white text-slate-900 border border-slate-200 p-4 rounded-2xl shadow-sm active:scale-95 transition-all hover:bg-slate-50"
            title={t('shareApp')}
          >
            <i className="fas fa-arrow-up-from-bracket"></i>
          </button>
          <button 
            onClick={() => navigate('/scan')} 
            className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"
            title={t('addListing')}
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>

      <div className="relative z-50">
        <input 
          type="text" 
          placeholder={t('searchPlaceholder')}
          className={`w-full pl-12 pr-12 py-5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 outline-none transition-all shadow-sm font-medium text-slate-700 ${isSearchFocused ? 'ring-4 ring-blue-500/10 border-blue-500' : ''}`}
          value={searchTerm}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <button 
          onClick={startVoiceSearch}
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
            isListening ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-blue-600'
          }`}
          title="Voice Search"
        >
          <i className="fas fa-microphone"></i>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'Wishlist', ...Object.values(Category)].map((cat) => (
          <button 
            key={cat} 
            onClick={() => setCategoryFilter(cat as any)} 
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${categoryFilter === cat ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white/50 text-slate-600 border-white/60'}`}
          >{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-24">
        {filteredItems.map((item) => {
          const trade = firestoreService.getTradeStatus(item.id);
          const isOwner = item.ownerEmail === userEmail;
          const dist = userLocation ? getDistance(userLocation.lat, userLocation.lng, CENTRAL_LIBRARY_COORDINATES.latitude, CENTRAL_LIBRARY_COORDINATES.longitude) : Infinity;
          const nearLib = dist <= HANDOVER_DISTANCE_THRESHOLD_METERS;
          const isWishlisted = wishlist.some(i => i.id === item.id);

          return (
            <Link 
              key={item.id} 
              to={`/item/listing/${item.id}`}
              className="bg-white/90 backdrop-blur-md rounded-[2rem] border border-white/40 overflow-hidden shadow-sm hover:shadow-xl transition-all animate-in fade-in duration-500 flex flex-col"
            >
              <div className="relative h-44">
                <ItemImage src={item.imageUrl} alt={item.title} itemId={item.id} />
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <button 
                    onClick={(e) => toggleWishlist(e, item)} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${isWishlisted ? 'bg-blue-600 text-white' : 'bg-white/80 text-slate-400'}`}
                  >
                    <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`}></i>
                  </button>
                  <button 
                    onClick={(e) => handleShareItem(e, item)} 
                    className="w-10 h-10 rounded-full bg-white/80 text-slate-400 flex items-center justify-center transition-all shadow-lg hover:text-blue-600"
                  >
                    <i className="fas fa-share-nodes"></i>
                  </button>
                </div>
                <div 
                  className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/40 flex items-center gap-2 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input type="checkbox" checked={!!compareList.find(i => i.id === item.id)} onChange={() => {
                    setCompareList(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : prev.length < 2 ? [...prev, item] : prev);
                  }} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">{t('compare')}</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 leading-tight truncate pr-2">{item.title}</h3>
                  <span className="text-[10px] font-black text-blue-600 shrink-0">₹{item.price}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 mb-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase">{item.owner}</span>
                  <div className="bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="fas fa-check-circle text-blue-600 text-[8px]"></i>
                    <span className="text-[7px] font-black text-blue-700 uppercase">{t('verifiedStudent')}</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mb-4 line-clamp-2 flex-1">{item.description}</p>
                <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
                  {!isOwner ? (
                    trade?.status === 'requested' ? (
                      trade.buyerId === userEmail ? (
                        <button onClick={(e) => handleCancel(e, item)} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase shadow-lg">
                          {t('cancelRequest')}
                        </button>
                      ) : (
                        <button disabled className="flex-1 py-2 bg-amber-400 text-white rounded-xl text-xs font-black uppercase">
                          {t('requested')}
                        </button>
                      )
                    )
                    : trade?.status === 'accepted' ? <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowHandshake(item); }} disabled={!nearLib} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase ${nearLib ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{nearLib ? 'Complete Trade' : 'Go to Library'}</button>
                    : <button onClick={(e) => handleRequest(e, item)} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg">{t('request')}</button>
                  ) : (
                    trade?.status === 'requested' ? <div className="flex gap-2 w-full"><button onClick={(e) => handleAccept(e, item)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase">{t('accept')}</button><button onClick={(e) => handleCancel(e, item)} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl"><i className="fas fa-times"></i></button></div>
                    : <button className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-black uppercase border border-slate-100">{t('sold')}</button>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {compareList.length > 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 border border-white/10">
          <div className="flex -space-x-3">
             {compareList.map(item => (
               <div key={item.id} className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800">
                 <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
               </div>
             ))}
          </div>
          <button onClick={startComparison} disabled={compareList.length < 2} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50">
            {t('compare')}
          </button>
          <button onClick={() => setCompareList([])} className="text-white/40 hover:text-white"><i className="fas fa-times"></i></button>
        </div>
      )}

      {snackBar.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <i className="fas fa-check text-[10px]"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{snackBar.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
