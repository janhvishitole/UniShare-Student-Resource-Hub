
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { summarizeNote } from '../services/geminiService';
import { firestoreService } from '../services/firestoreService';
import { StudyNote, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Notes: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [allNotes, setAllNotes] = useState<StudyNote[]>([]);
  const [activeSummary, setActiveSummary] = useState<{id: string, text: string, type: 'smart' | 'general'} | null>(null);
  const [sumLoading, setSumLoading] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFiltered, setIsFiltered] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [snackBar, setSnackBar] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    setCurrentUser(user);

    const unsubscribe = firestoreService.subscribeToNotes((notes) => {
      setAllNotes(notes);
    }, isFiltered ? user?.department : undefined);
    
    return () => unsubscribe();
  }, [isFiltered]);

  const showToast = (msg: string) => {
    setSnackBar({ show: true, msg });
    setTimeout(() => setSnackBar({ show: false, msg: '' }), 6000);
  };

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice search not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
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

  const handleToggleSummary = async (e: React.MouseEvent, note: StudyNote) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeSummary?.id === note.id) {
      setActiveSummary(null);
      return;
    }

    if (note.summary) {
      setActiveSummary({ id: note.id, text: note.summary, type: 'smart' });
      return;
    }

    setSumLoading(note.id);
    try {
      const summary = await summarizeNote(note.title, note.department);
      setActiveSummary({ id: note.id, text: summary || 'Summary unavailable.', type: 'general' });
    } catch (e) {
      console.error(e);
    } finally {
      setSumLoading(null);
    }
  };

  const handleRequestTrade = async (e: React.MouseEvent, note: StudyNote) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    
    try {
      await firestoreService.setTradeStatus(note.id, 'requested', currentUser.email);
      showToast(t('tradeRequestSent'));
    } catch (err) {
      console.error(err);
      showToast("Failed to send request.");
    }
  };

  const filteredNotes = useMemo(() => {
    return allNotes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (note.subject && note.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      note.department.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allNotes, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Notes Hub</h2>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-1.5 h-1.5 rounded-full animate-pulse"></div>
            <p className="text-slate-800 text-[10px] font-black uppercase tracking-widest">
              Live Feed: {currentUser?.department || 'General'} Branch
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/add-note')}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"
          title={t('shareMaterial')}
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
            <i className="fas fa-search"></i>
          </div>
          <input 
            type="text" 
            placeholder="Search resources..."
            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={startVoiceSearch}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
              isListening ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-blue-600'
            }`}
            title="Voice Search"
          >
            <i className="fas fa-microphone"></i>
          </button>
        </div>
        <button 
          onClick={() => setIsFiltered(!isFiltered)}
          className={`px-4 py-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${
            isFiltered ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-md' : 'bg-white text-slate-400 border-slate-200'
          }`}
        >
          <i className={`fas ${isFiltered ? 'fa-filter' : 'fa-globe'} mr-2`}></i>
          {isFiltered ? 'My Branch' : 'All Depts'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="py-20 text-center bg-white/80 rounded-[2.5rem] border border-dashed border-slate-300">
            <i className="fas fa-book-open-reader text-4xl text-slate-200 mb-4"></i>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No resources available.</p>
            <button 
              onClick={() => setIsFiltered(false)}
              className="mt-4 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const trade = firestoreService.getTradeStatus(note.id);
            const isHardcopy = note.format.includes('Hardcopy');
            const isOwner = note.authorEmail === currentUser?.email;

            return (
              <div 
                key={note.id} 
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xl flex flex-col hover:shadow-2xl transition-all border-l-4 border-l-blue-600 group"
              >
                <div className="flex items-center justify-between">
                  <Link to={`/item/note/${note.id}`} className="flex items-center gap-5 flex-1 min-w-0">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0 ${
                        note.format.includes('PDF') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                      }`}
                    >
                      <i className={`fas ${note.format.includes('PDF') ? 'fa-file-pdf' : 'fa-pen-nib'}`}></i>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight text-xs truncate max-w-[180px]">{note.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{note.author}</span>
                          {note.isAuthorVerified && (
                            <div className="flex items-center justify-center w-3 h-3 bg-blue-500 text-white rounded-full scale-[0.8]" title="Verified BVDU Student">
                              <i className="fas fa-check text-[6px]"></i>
                            </div>
                          )}
                        </div>
                        <span className="text-slate-300 text-[8px]">•</span>
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Sem {note.semester}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleToggleSummary(e, note)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        sumLoading === note.id ? 'bg-blue-100 text-blue-600 animate-spin' : 
                        (activeSummary?.id === note.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-blue-600 hover:bg-blue-50')
                      }`}
                    >
                      <i className={`fas ${sumLoading === note.id ? 'fa-circle-notch' : (activeSummary?.id === note.id ? 'fa-eye' : 'fa-wand-magic-sparkles')}`}></i>
                    </button>
                    
                    {!isHardcopy ? (
                      <a 
                        href={note.fileUrl} 
                        download={`${note.title.replace(/\s+/g, '_')}.pdf`}
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-95"
                      >
                        <i className="fas fa-arrow-down"></i>
                        <span className="hidden sm:inline">{t('download')}</span>
                      </a>
                    ) : (
                      !isOwner ? (
                        <button 
                          onClick={(e) => handleRequestTrade(e, note)}
                          disabled={trade?.status === 'requested'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                            trade?.status === 'requested' ? 'bg-amber-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <i className={`fas ${trade?.status === 'requested' ? 'fa-clock' : 'fa-handshake'}`}></i>
                          <span>{trade?.status === 'requested' ? t('requested') : t('requestTrade')}</span>
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                          My Note
                        </div>
                      )
                    )}
                  </div>
                </div>

                {activeSummary?.id === note.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                        <i className={`fas ${activeSummary.type === 'smart' ? 'fa-brain' : 'fa-sparkles'}`}></i>
                        Gemini {activeSummary.type === 'smart' ? 'Smart Summary' : 'Quick Summary'}
                      </span>
                    </div>
                    <div className={`text-[11px] leading-relaxed p-4 rounded-2xl italic border transition-colors ${
                      activeSummary.type === 'smart' ? 'bg-blue-50/50 text-slate-800 border-blue-100 shadow-inner' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {activeSummary.text.split('\n').map((line, i) => (
                        <p key={i} className="mb-1">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-[70%]">
          <h4 className="text-xl font-black mb-2 uppercase tracking-tight">AI Academic Hub</h4>
          <p className="text-slate-300 text-[10px] mb-6 leading-relaxed font-black uppercase tracking-widest">Contribute Softcopy PDF notes to earn +25 Karma and automated smart indexing for your peers.</p>
          <button 
            onClick={() => navigate('/add-note')}
            className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black shadow-xl uppercase tracking-widest active:scale-95 transition-transform"
          >
            {t('shareMaterial')} / साहित्य जोडा
          </button>
        </div>
        <i className="fas fa-microchip absolute -bottom-6 -right-6 text-white/10 text-9xl rotate-12"></i>
      </div>

      {snackBar.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <i className="fas fa-paper-plane text-[10px]"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{snackBar.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
