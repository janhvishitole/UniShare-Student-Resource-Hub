
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyze360Video, VideoInspectionResult } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

const ScanTool: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  
  // States
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Rotation Tracking
  const [totalRotation, setTotalRotation] = useState(0);
  const lastAlphaRef = useRef<number | null>(null);
  const [gyroPermission, setGyroPermission] = useState<boolean | null>(null);

  const loadingMessages = [
    "Waking up the Honest Inspector...",
    "Transmitting technical data to cloud...",
    "Inspecting surface imperfections...",
    "Auditing sensor responsiveness...",
    "Gemini is performing deep technical audit...",
    "Calculating legacy carbon impact...",
    "Finalizing quality grading..."
  ];

  useEffect(() => {
    let interval: number;
    if (isAnalyzing) {
      interval = window.setInterval(() => {
        setAnalysisStep(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      setError(null);
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, 
        audio: true 
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;

      // Audio Level Monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(s);
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      source.connect(analyzerRef.current);
      
      const updateLevel = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        requestAnimationFrame(updateLevel);
      };
      updateLevel();
      setCameraLoading(false);
    } catch (err) {
      setError("Camera or Microphone access denied. UniShare needs these for tool validation.");
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
      window.removeEventListener('deviceorientation', handleOrientation);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.alpha === null || !isRecording) return;
    const currentAlpha = event.alpha;
    if (lastAlphaRef.current !== null) {
      let delta = Math.abs(currentAlpha - lastAlphaRef.current);
      if (delta > 180) delta = 360 - delta;
      setTotalRotation(prev => {
        const next = prev + delta;
        if (next >= 355) stopRecording(); // Auto-stop near 360
        return next;
      });
    }
    lastAlphaRef.current = currentAlpha;
  }, [isRecording]);

  const requestGyroPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setGyroPermission(true);
          return true;
        }
      } catch (err) {
        console.error("Gyro permission failed", err);
      }
      setGyroPermission(false);
      return false;
    }
    setGyroPermission(true);
    return true;
  };

  const startRecording = async () => {
    if (!stream) return;
    if (gyroPermission === null) await requestGyroPermission();

    // Use lower bitrate to speed up upload for Gemini analysis
    const options = {
      mimeType: MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm',
      videoBitsPerSecond: 1000000 // 1Mbps (Low enough for fast upload, high enough for AI)
    };
    
    setIsRecording(true);
    setTotalRotation(0);
    setRecordingTime(0);
    lastAlphaRef.current = null;
    setError(null);
    window.addEventListener('deviceorientation', handleOrientation);

    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 25) { // Stop after 25s max
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    const chunks: Blob[] = [];
    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setRecordedBlob(blob);
        await processVideo(blob, recorder.mimeType);
      };
      recorder.start();
    } catch (err) {
      setError("Recording failed. Ensure your browser is up to date.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    window.removeEventListener('deviceorientation', handleOrientation);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const processVideo = async (blob: Blob, mimeType: string) => {
    setIsAnalyzing(true);
    // Increase timeout to 60s for slow networks
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Network too slow. Try moving closer to router.")), 60000)
    );

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const result = await Promise.race([analyze360Video(base64, mimeType), timeoutPromise]) as VideoInspectionResult;
      
      const thumbReader = new FileReader();
      thumbReader.onloadend = () => {
        navigate('/add-listing', { 
          replace: true,
          state: { 
            prefill: { 
              ...result, 
              previewUrl: thumbReader.result, 
              honestReview: result.review, 
              quality_grade: result.quality_grade, 
              name: result.item_name 
            } 
          }
        });
      };
      thumbReader.readAsDataURL(blob);
    } catch (err: any) {
      console.error("Scan Error:", err);
      setError(err.message || "Appraisal failed. Ensure the object is in frame.");
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
      <div className="p-6 flex items-center justify-between text-white bg-slate-900/50 backdrop-blur-md z-10 shrink-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 active:scale-90 transition-transform">
          <i className="fas fa-times"></i>
        </button>
        <div className="text-center">
           <h2 className="text-xs font-black uppercase tracking-[0.2em]">Honest Audit Session</h2>
           <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">AV Technical Appraisal</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error ? (
          <div className="p-10 text-center space-y-6 max-w-sm">
             <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 text-3xl mx-auto animate-bounce"><i className="fas fa-triangle-exclamation"></i></div>
             <p className="text-slate-200 text-xs font-bold leading-relaxed">{error}</p>
             <button onClick={() => { setError(null); startCamera(); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-blue-900/40">Restart Session</button>
          </div>
        ) : isAnalyzing ? (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950 px-10 text-center">
             <div className="w-48 h-48 relative mb-12">
               <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-microscope text-blue-500 text-4xl animate-pulse"></i></div>
             </div>
             <div className="space-y-4">
               <h3 className="text-white text-sm font-black uppercase tracking-[0.3em] animate-pulse">
                 {loadingMessages[analysisStep]}
               </h3>
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((analysisStep + 1) / loadingMessages.length) * 100}%` }}></div>
               </div>
               <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest leading-relaxed">Please do not close the browser</p>
             </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${isRecording ? 'opacity-90 grayscale-0' : 'opacity-40 grayscale'}`} />
            
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full px-10 max-w-xs">
              <button 
                onClick={isRecording ? stopRecording : startRecording} 
                className={`w-full py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 border ${
                  isRecording 
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse' 
                    : 'bg-white text-slate-900 border-white'
                }`}
              >
                <i className={`fas ${isRecording ? 'fa-stop-circle' : 'fa-play-circle'} text-base`}></i>
                <span>{isRecording ? "Finish & Audit" : "Start Appraisal Scan"}</span>
              </button>
              {isRecording && (
                 <p className="text-center text-white text-[9px] font-black uppercase tracking-[0.3em] mt-3 animate-pulse">
                   {recordingTime}s / 25s Capture
                 </p>
              )}
            </div>

            {isRecording && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                <i className="fas fa-microphone text-[10px] text-rose-500 animate-pulse"></i>
                <div className="flex items-end gap-0.5 h-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-rose-500 rounded-full transition-all" style={{ height: `${Math.max(20, (audioLevel / 2) * (1 - Math.abs(2-i)*0.3))}%` }}></div>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className={`w-72 h-72 border-4 border-dashed rounded-full transition-all ${isRecording ? 'border-blue-500 scale-105 opacity-100' : 'border-white/20 opacity-30'}`}></div>
               {isRecording && (
                 <svg className="absolute w-80 h-80 -rotate-90">
                   <circle cx="160" cy="160" r="148" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                   <circle 
                    cx="160" cy="160" r="148" 
                    fill="transparent" stroke="#1A73E8" strokeWidth="6" 
                    strokeDasharray={2 * Math.PI * 148} 
                    strokeDashoffset={2 * Math.PI * 148 * (1 - Math.min(totalRotation / 360, 1))} 
                    strokeLinecap="round" 
                    className="transition-all duration-300" 
                   />
                 </svg>
               )}
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center pointer-events-none">
               <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Audit Tracking</span>
               <div className="text-4xl font-black text-white leading-none">{Math.round(Math.min(totalRotation, 360))}°</div>
               <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 tracking-tighter">Slowly rotate the object 360° for Gemini</p>
            </div>
          </>
        )}
      </div>

      {cameraLoading && (
        <div className="p-10 bg-slate-900 shrink-0 text-center">
           <div className="flex items-center justify-center gap-3 mb-2">
             <i className="fas fa-circle-notch fa-spin text-blue-500"></i>
             <span className="text-white text-[10px] font-black uppercase tracking-widest">Hardware Initialization...</span>
           </div>
           <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Syncing AI Core and AV Sensors</p>
        </div>
      )}
    </div>
  );
};

export default ScanTool;
