
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Department, Category, MarketplaceItem, ListingType, HonestReview } from '../types';
import { firestoreService } from '../services/firestoreService';

const AddListing: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    listingType: 'Sell' as ListingType,
    pricePerDay: '',
    returnDate: '',
    securityDeposit: '',
    department: '1st Year (General)' as Department,
    category: Category.GENERAL_ESSENTIALS as Category,
    carbonSaved: 0
  });

  const [honestReview, setHonestReview] = useState<HonestReview | null>(null);
  const [qualityGrade, setQualityGrade] = useState<string>('Good');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackBar, setSnackBar] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const departments: Department[] = ['1st Year (General)', 'Computer', 'IT', 'Mechanical', 'Civil', 'E&TC', 'Chemical', 'Robotics', 'AI&DS'];
  const categories = Object.values(Category);

  useEffect(() => {
    if (location.state?.prefill) {
      const { prefill } = location.state;
      setFormData(prev => ({
        ...prev,
        name: prefill.name || '',
        category: prefill.category || Category.GENERAL_ESSENTIALS,
        description: prefill.description || '',
        price: prefill.price?.toString() || '',
        carbonSaved: prefill.carbonSaved || 0.5
      }));
      setHonestReview(prefill.honestReview || null);
      setQualityGrade(prefill.quality_grade || 'B');
      showToast("AI Appraisal attached!");
    } else {
        navigate('/scan');
    }
  }, [location.state]);

  const showToast = (msg: string) => {
    setSnackBar({ show: true, msg });
    setTimeout(() => setSnackBar({ show: false, msg: '' }), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const newListing: MarketplaceItem = {
        id: `listing-${Date.now()}`,
        title: formData.name,
        description: formData.description,
        listingType: formData.listingType,
        price: formData.listingType === 'Free' ? 0 : Number(formData.price),
        pricePerDay: formData.listingType === 'Rent' ? Number(formData.pricePerDay) : undefined,
        returnDate: formData.listingType === 'Rent' ? formData.returnDate : undefined,
        securityDeposit: (formData.listingType === 'Rent' || formData.listingType === 'Free') ? Number(formData.securityDeposit) : undefined,
        category: formData.category,
        department: formData.department,
        owner: user.name || 'Student',
        ownerEmail: user.email,
        ownerKarma: user.karma || 100,
        imageUrl: `https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&h=400`,
        honestReview: honestReview || undefined,
        condition: `${qualityGrade === 'A' ? 'Excellent' : qualityGrade === 'B' ? 'Good' : 'Fair'} (AI Audited)`, 
        createdAt: 'Just now',
        carbonSaved: formData.carbonSaved || 0.5
      };

      await firestoreService.createListing(newListing);
      alert(t('listingSuccess'));
      navigate('/');
    } catch (error) {
      console.error("Failed to create listing:", error);
      showToast("Error saving listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-sm">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finalize Appraisal</h2>
          <p className="text-slate-500 text-sm">Review AI audit results and post</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 space-y-8">
        
        {honestReview && (
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-lg">
                 <i className="fas fa-shield-check"></i>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">AI Honest Review Attached</p>
                  <p className="text-xs font-bold text-slate-300 mt-1">Transparency report will be visible to buyers.</p>
               </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
               <p className="text-[9px] font-black uppercase text-blue-400 mb-2">Technical Summary:</p>
               <ul className="space-y-1">
                 {honestReview.specs.map((s, i) => (
                   <li key={i} className="text-[10px] font-bold text-slate-200 flex items-center gap-2">
                     <i className="fas fa-microchip text-[8px] text-blue-500"></i> {s}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Identified Item</label>
            <input name="name" required className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none font-medium text-slate-800" value={formData.name} onChange={handleChange} />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Deal Type</label>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              {(['Sell', 'Rent', 'Free'] as ListingType[]).map((type) => (
                <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, listingType: type }))} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.listingType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Suggested Price (₹)</label>
                <input type="number" name="price" required className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none font-medium text-slate-800" value={formData.price} onChange={handleChange} />
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Category</label>
                <select name="category" className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none font-medium text-slate-800" value={formData.category} onChange={handleChange}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
             </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
            <textarea name="description" required rows={3} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none font-medium text-slate-800 resize-none" value={formData.description} onChange={handleChange} />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95">
            {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-paper-plane"></i> <span className="text-xs uppercase tracking-[0.2em]">Post to BVDU Hub</span></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddListing;
