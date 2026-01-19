
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Department, NoteFormat, StudyNote } from '../types';
import { firestoreService } from '../services/firestoreService';
import { generateSmartSummaryFromPdf } from '../services/geminiService';

interface SelectedFile {
  name: string;
  size: string;
  data: string;
}

const AddNote: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    semester: 1,
    department: 'Computer' as Department,
    type: 'PDF (Softcopy)' as NoteFormat
  });
  
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'upload' | 'summary' | 'idle'>('idle');

  const departments: Department[] = ['Computer', 'IT', 'Mechanical', 'Civil', 'E&TC', 'Chemical', 'Robotics', 'AI&DS', '1st Year (General)'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const types: NoteFormat[] = ['PDF (Softcopy)', 'Hardcopy (Handwritten)'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file only.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const sizeInKB = (file.size / 1024).toFixed(1);
        const sizeLabel = file.size > 1024 * 1024 
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          : sizeInKB + ' KB';

        setSelectedFile({
          name: file.name,
          size: sizeLabel,
          data: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    setSubmissionStep('upload');
    
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // STEP 1: UPLOAD TO SIMULATED 'academic_notes' STORAGE
      const downloadUrl = await firestoreService.uploadFile(selectedFile.data);
      
      // STEP 2: GENERATE SMART SUMMARY (If PDF)
      let smartSummary = '';
      if (formData.type === 'PDF (Softcopy)') {
        setSubmissionStep('summary');
        try {
          const summaryResult = await generateSmartSummaryFromPdf(selectedFile.data, formData.title);
          smartSummary = summaryResult || '';
        } catch (summaryErr) {
          console.error("AI Summary generation failed:", summaryErr);
          // Fallback - we continue even if summary fails, but log it
        }
      }

      // STEP 3: CREATE DOCUMENT IN 'notes' COLLECTION
      const newNote: StudyNote = {
        id: `note-${Date.now()}`,
        title: formData.title,
        subject: formData.subject,
        department: formData.department,
        semester: formData.semester,
        author: user?.name || 'Student',
        authorEmail: user?.email || '',
        isAuthorVerified: !!user?.email.endsWith('@bvuniversity.edu.in'),
        fileUrl: downloadUrl,
        format: formData.type,
        downloads: 0,
        summary: smartSummary // Attach the generated summary
      };

      await firestoreService.createNote(newNote);
      
      // Reward Student for academic contribution
      if (user) {
        user.karma = (user.karma ?? 100) + 25; // Extra 5 karma for providing Smart Summarized notes
        await firestoreService.saveUser(user);
      }
      
      alert(t('uploadSuccess'));
      navigate('/notes');
    } catch (error) {
      console.error("Failed to share material:", error);
      alert("Error sharing material. Please try again.");
    } finally {
      setIsSubmitting(false);
      setSubmissionStep('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'semester' ? Number(value) : value 
    }));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-sm"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('shareMaterial')}</h2>
          <p className="text-slate-500 text-sm">Contribute with AI-powered indexing</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 overflow-hidden relative">
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              {t('materialTitle')}
            </label>
            <input 
              type="text" 
              name="title"
              required
              placeholder="e.g. Applied Physics-I Mid-sem notes"
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              {t('subject')}
            </label>
            <input 
              type="text" 
              name="subject"
              required
              placeholder="e.g. Physics, Mechanics, etc."
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
              value={formData.subject}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                {t('semester')}
              </label>
              <select 
                name="semester"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none transition-all font-medium text-slate-800"
                value={formData.semester}
                onChange={handleChange}
              >
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                {t('department')}
              </label>
              <select 
                name="department"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none transition-all font-medium text-slate-800"
                value={formData.department}
                onChange={handleChange}
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              {t('materialType')}
            </label>
            <div className="flex gap-3">
              {types.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, type})}
                  className={`flex-1 py-4 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-widest ${
                    formData.type === type 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                  }`}
                >
                  <i className={`fas ${type.includes('PDF') ? 'fa-file-pdf' : 'fa-pen-nib'} mr-2`}></i>
                  {type === 'PDF (Softcopy)' ? t('softcopy') : t('hardcopy')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
              File Attachment (PDF Mandatory)
            </label>
            <input 
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-4 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-100 transition-all flex flex-col items-center gap-3 group"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 text-xl shadow-sm group-hover:scale-110 transition-transform">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <div className="text-center">
                  <span className="block text-xs font-black uppercase tracking-widest text-slate-600">Choose File</span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase mt-1">Select from device storage</span>
                </div>
              </button>
            ) : (
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-3xl flex items-center gap-4 animate-in zoom-in-95">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 text-lg shadow-sm">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{selectedFile.size}</p>
                </div>
                <button 
                  type="button"
                  onClick={removeFile}
                  className="w-10 h-10 flex items-center justify-center text-rose-500 bg-white rounded-xl shadow-sm hover:bg-rose-50 transition-colors"
                >
                  <i className="fas fa-trash-can"></i>
                </button>
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
               <i className="fas fa-sparkles"></i>
             </div>
             <p className="text-[10px] text-amber-800 font-bold leading-tight">
               Softcopy uploads trigger automated AI Smart Summary to help your peers index your notes better.
             </p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !selectedFile}
            className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
              selectedFile 
                ? 'bg-slate-900 text-white shadow-slate-200' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none grayscale cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3 animate-pulse">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span className="text-[10px] uppercase tracking-widest">
                  {submissionStep === 'upload' ? 'Saving to Cloud...' : 'Generating Smart Summary...'}
                </span>
              </span>
            ) : (
              <>
                <i className="fas fa-share-nodes"></i>
                <span className="text-xs uppercase tracking-[0.2em]">{t('shareMaterial')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNote;
