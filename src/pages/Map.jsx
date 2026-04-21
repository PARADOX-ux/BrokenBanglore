import { useState, useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categories, wardMLAData, completeMLAList, getMPByConstituency, getMPByZone } from '../data/wardData';
import { getReports } from '../lib/reportsDb';

const BENGALURU_CENTER = [77.5946, 12.9716];
const BENGALURU_BOUNDS = [
  [77.4000, 12.8000], 
  [77.8000, 13.1500]
];

export default function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPickMode = searchParams.get('pickMode') === 'true';

  const [selectedReport, setSelectedReport] = useState(null);
  const [pickedPin, setPickedPin] = useState(null);
  const [pickedWard, setPickedWard] = useState(null);
  const [hoveredReport, setHoveredReport] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [viewMode, setViewMode] = useState('map'); 
  const [is3D, setIs3D] = useState(false); // Default to 2D for performance

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const hoveredWardIdRef = useRef(null);

  useEffect(() => {
    getReports().then(setAllReports);
  }, []);

  const handleWardAction = (wardProps, type = 'click') => {
    const wardNo = wardProps.KGISWardNo || wardProps.ward || 1;
    const rawName = wardProps.KGISWardName || wardProps.name || 'Unknown Area';
    
    let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
    if (!mlaData) {
      const zone = rawName.split('(')[1]?.replace(')', '') || 'Central';
      mlaData = { ...completeMLAList[0], ...getMPByZone(zone), areaName: rawName };
    }

    if (type === 'hover') {
      setHoveredReport({ id: `ward-${wardNo}`, wardName: rawName, ward: wardNo, mlaDetails: mlaData });
    } else {
      setSelectedReport({ 
        id: `ward-${wardNo}`, 
        title: `${rawName} Area Overview`, 
        area_name: rawName, 
        ward_no: wardNo, 
        mlaDetails: mlaData,
        category: 'Civic Audit',
        status: 'Scanning'
      });
    }
  };

  useEffect(() => {
    if (map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: BENGALURU_CENTER,
      zoom: 11.5,
      pitch: 0,
      maxBounds: BENGALURU_BOUNDS,
      antialias: true
    });

    map.current.on('load', () => {
      map.current.addSource('bbmp-wards', { type: 'geojson', data: '/data/bangalore-wards.geojson' });
      
      map.current.addLayer({
        id: 'ward-fills', type: 'fill', source: 'bbmp-wards',
        paint: { 'fill-color': '#4ADE80', 'fill-opacity': 0.12 }
      });

      map.current.addLayer({
        id: 'ward-highlight', type: 'fill', source: 'bbmp-wards',
        paint: { 'fill-color': '#4ADE80', 'fill-opacity': 0.35 },
        filter: ['==', ['get', 'KGISWardNo'], '']
      });

      map.current.addLayer({
        id: 'ward-borders', type: 'line', source: 'bbmp-wards',
        paint: { 'line-color': '#4ADE80', 'line-width': 1.5, 'line-opacity': 0.3 }
      });

      map.current.on('mousemove', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
        if (features.length > 0) {
          const wardId = features[0].properties.KGISWardNo;
          if (hoveredWardIdRef.current !== wardId) {
            hoveredWardIdRef.current = wardId;
            map.current.getCanvas().style.cursor = 'pointer';
            map.current.setFilter('ward-highlight', ['==', ['get', 'KGISWardNo'], wardId]);
            handleWardAction(features[0].properties, 'hover');
          }
        } else {
          if (hoveredWardIdRef.current !== null) {
            hoveredWardIdRef.current = null;
            map.current.getCanvas().style.cursor = '';
            map.current.setFilter('ward-highlight', ['==', ['get', 'KGISWardNo'], '']);
            setHoveredReport(null);
          }
        }
      });

      map.current.on('click', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
        if (isPickMode) {
          setPickedPin({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          if (features.length > 0) {
            const props = features[0].properties;
            setPickedWard({ ward: props.KGISWardNo, name: props.KGISWardName, mla: wardMLAData.find(m => Number(m.ward) === Number(props.KGISWardNo)) });
          }
        } else if (features.length > 0) {
          handleWardAction(features[0].properties, 'click');
        } else {
          setSelectedReport(null);
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isPickMode]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    markers.current.forEach(m => m.remove());
    markers.current = [];

    if (viewMode === 'map' && !isPickMode) {
      allReports.forEach(report => {
        if (!report.lat || !report.lng) return;
        const el = document.createElement('div');
        el.className = 'w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg cursor-pointer hover:scale-125 transition-transform';
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([report.lng, report.lat])
          .addTo(map.current);
        el.onclick = (e) => {
          e.stopPropagation();
          const recoveredWard = wardMLAData.find(w => Number(w.ward) === Number(report.ward_no));
          const mlaDetails = {
            mla: report.mla_name || recoveredWard?.mla || 'Authority',
            party: report.mla_party || recoveredWard?.party || 'BBMP',
            photo: recoveredWard?.photo || ''
          };
          setSelectedReport({ ...report, mlaDetails });
        };
        markers.current.push(marker);
      });
    }
  }, [allReports, viewMode, isPickMode]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-black overflow-hidden font-sans relative">
      
      {/* MAP LAYER */}
      <div 
        ref={mapContainer} 
        style={{ display: viewMode === 'map' ? 'block' : 'none' }}
        className="absolute inset-0 z-0"
      />

      {/* TOP OVERLAY: View Controls */}
      <div className="absolute top-6 left-6 right-6 z-[100] flex justify-between pointer-events-none">
        <div className="flex gap-3 pointer-events-auto">
          <div className="flex bg-white rounded-2xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setViewMode('map')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest border-r-2 border-black ${viewMode === 'map' ? 'bg-black text-white' : 'bg-white text-black'}`}>Map View</button>
            <button onClick={() => setViewMode('list')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-black'}`}>List View</button>
          </div>
        </div>
        <div className="bg-black text-white px-4 py-2 rounded-xl border border-white/20 text-[10px] font-bold tracking-widest pointer-events-auto">
          LIVE AUDIT ENGINE
        </div>
      </div>

      {/* LIST VIEW (Full Screen Over-layer) */}
      {viewMode === 'list' && (
        <div className="absolute inset-0 z-50 bg-[#f8f8f8] overflow-y-auto p-10 pt-24">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-6xl font-black tracking-tighter mb-10 uppercase border-b-8 border-black pb-4">Issue Ledger</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allReports.map(report => (
                <div key={report.id} onClick={() => { setSelectedReport(report); setViewMode('map'); }} className="bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="text-[10px] font-black text-red-500 uppercase mb-2">#{report.status || 'REPORTED'}</div>
                  <h3 className="text-2xl font-black leading-none mb-4">{report.title}</h3>
                  <div className="text-[11px] font-bold text-black/40 uppercase">📍 {report.area_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HOVER CARD (Namma Kasa Style) */}
      {hoveredReport && viewMode === 'map' && !selectedReport && (
        <div className="fixed bottom-24 left-8 z-[1000] pointer-events-none">
          <div className="bg-white p-8 rounded-[2rem] border-[10px] border-black shadow-[0_40px_80px_rgba(0,0,0,0.4)] min-w-[300px]">
            <div className="text-[10px] font-black text-[#2B9348] uppercase tracking-[0.3em] mb-4">Ward Infrastructure Scan</div>
            <div className="text-3xl font-black text-black leading-none uppercase mb-2">{hoveredReport.wardName.split('(')[0]}</div>
            <div className="text-[12px] font-black text-black/30 mb-6 pb-4 border-b-2 border-black/5">Ward No. {hoveredReport.ward}</div>
            <div className="text-[11px] font-bold text-black/10 uppercase tracking-[0.5em] mb-1">{hoveredReport.mlaDetails?.zone || 'Bengaluru Zone'}</div>
            <div className="text-xl font-black text-[#1a5b3a] uppercase tracking-wider">{hoveredReport.mlaDetails?.constituency} Area</div>
          </div>
        </div>
      )}

      {/* SIDEBAR: Report Evidence & Accountability */}
      {selectedReport && (
        <div className="absolute top-6 bottom-6 right-6 w-[calc(100%-3rem)] md:w-[420px] bg-white z-[200] border-4 border-black rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-right-10">
          <div className="p-8 pb-4 flex justify-between items-center bg-white">
            <span className="text-[9px] font-black bg-black text-white px-3 py-1.5 rounded-full uppercase">Civic Audit</span>
            <button onClick={() => setSelectedReport(null)} className="text-2xl font-black">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 pt-0">
            <h1 className="text-4xl font-black leading-[0.85] mb-6 uppercase tracking-tighter">{selectedReport.title || selectedReport.area_name}</h1>
            <div className="text-[11px] font-black text-black/30 uppercase mb-8">📍 {selectedReport.area_name} • Ward {selectedReport.ward_no}</div>
            
            {/* EVIDENCE PHOTO */}
            <div className="w-full h-64 bg-black/5 rounded-[2rem] border-4 border-black overflow-hidden mb-8 relative">
              {selectedReport.photo_url ? (
                <img src={selectedReport.photo_url} alt="Evidence" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                  <span className="text-4xl mb-2">📸</span>
                  <span className="text-[10px] font-black uppercase">No Visual Evidence</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <div className="text-[10px] font-black text-black/20 uppercase tracking-widest mb-4 border-b-2 border-black/5 pb-2">Description</div>
              <p className="text-sm font-bold text-black/60 italic leading-relaxed">"{selectedReport.description || 'Verified civic problem area.'}"</p>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-black text-black/20 uppercase tracking-widest mb-4">Accountability Chain</div>
              <div className="bg-[#f0fff4] p-6 rounded-3xl border-2 border-black flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl border-2 border-black overflow-hidden flex items-center justify-center">
                  {selectedReport.mlaDetails?.photo ? <img src={selectedReport.mlaDetails.photo} className="w-full h-full object-cover" /> : '👤'}
                </div>
                <div>
                  <div className="text-[9px] font-black text-green-700 uppercase">Local MLA</div>
                  <div className="text-lg font-black">{selectedReport.mlaDetails?.mla || 'Authority Official'}</div>
                  <div className="text-[9px] font-bold text-black/40 uppercase">{selectedReport.mlaDetails?.party} Member</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 border-t-4 border-black flex flex-col gap-3 bg-white">
            <button className="w-full bg-[#1a5b3a] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">Escalate Case →</button>
            <div className="flex gap-3">
              <button className="flex-1 bg-white text-black py-4 rounded-xl border-2 border-black text-[9px] font-black uppercase">WhatsApp MLA</button>
              <button className="flex-1 bg-white text-black py-4 rounded-xl border-2 border-black text-[9px] font-black uppercase">Tweet MP</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV: Audit Hub */}
      {!isPickMode && viewMode === 'map' && (
        <div className="absolute bottom-10 left-10 z-[500] flex gap-3 pointer-events-auto">
          <a href="/" className="px-6 py-4 bg-white border-4 border-black rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">Home</a>
          <a href="/report" className="px-8 py-4 bg-[#2B9348] text-white border-4 border-black rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex items-center gap-3">
            <span className="text-xl">📢</span> Audit Spot
          </a>
        </div>
      )}

      {/* PICK MODE FOOTER */}
      {isPickMode && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-white p-8 rounded-[2.5rem] border-4 border-black shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex gap-8 items-center min-w-[500px]">
          <div className="flex-1">
             <div className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em] mb-2">GPS Match</div>
             <div className="text-2xl font-black uppercase tracking-tighter">{pickedWard?.name ? `WARD ${pickedWard.ward} • ${pickedWard.name}` : 'Drop Marker on Problem Location'}</div>
          </div>
          {pickedPin && (
            <button onClick={() => { localStorage.setItem('bb_picked_location', JSON.stringify({ ...pickedPin, ward: pickedWard })); navigate('/report?step=3&locationPicked=true'); }} className="bg-[#22c55e] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">Confirm Spot</button>
          )}
        </div>
      )}
    </div>
  );
}
