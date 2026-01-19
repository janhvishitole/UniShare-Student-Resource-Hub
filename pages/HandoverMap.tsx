
import React, { useEffect, useState } from 'react';
import { getHandoverZones } from '../services/geminiService';
import { BVDU_COORDINATES } from '../constants';

const HandoverMap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ text: string; grounding: any[] } | null>(null);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const result = await getHandoverZones(BVDU_COORDINATES.latitude, BVDU_COORDINATES.longitude);
        setData(result as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchZones();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Safe Handover Zones</h2>
        <p className="text-slate-500 text-sm">Verified public spots at BVDUCOEP for safe item trading.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-64 bg-slate-200 relative">
          {/* Mock Map View as we rely on grounding links */}
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/600')] bg-cover opacity-60"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
              <i className="fas fa-location-dot text-blue-600 text-xl animate-bounce"></i>
              <span className="font-bold text-slate-800">BVDU Campus, Pune</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm font-medium">Fetching safe zones from Google Maps...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="prose prose-slate prose-sm max-w-none text-slate-600">
                {data?.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              {data?.grounding && data.grounding.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Google Maps References</h3>
                  <div className="flex flex-col gap-2">
                    {data.grounding.map((chunk: any, i: number) => {
                      if (chunk.maps) {
                        return (
                          <a 
                            key={i} 
                            href={chunk.maps.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 border border-slate-100 transition-colors"
                          >
                            <i className="fas fa-map-marker-alt text-blue-600"></i>
                            <span className="text-sm font-bold text-slate-700">{chunk.maps.title || 'View on Maps'}</span>
                            <i className="fas fa-external-link-alt ml-auto text-slate-300 text-xs"></i>
                          </a>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-4">
                <i className="fas fa-shield-alt text-amber-500 text-xl mt-1"></i>
                <div>
                  <h4 className="text-amber-800 font-bold text-sm">Safety Tip</h4>
                  <p className="text-amber-700 text-xs leading-relaxed">Always meet during daylight hours and preferably near the Central Library or the Main Canteen for maximum security.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandoverMap;
