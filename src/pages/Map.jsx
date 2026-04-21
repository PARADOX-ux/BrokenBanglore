import { useState, useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/centroid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categories, wardMLAData, completeMLAList, getMPByConstituency, getMPByZone } from '../data/wardData';
import { getReports, upvoteReport } from '../lib/reportsDb';

// Bengaluru Strict Bounds
// NOTE: MapLibre uses [lng, lat]
const BENGALURU_CENTER = [77.5946, 12.9716];
const BENGALURU_BOUNDS = [
  [77.4000, 12.8000], // South West
  [77.8000, 13.1500]  // North East
];

export default function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPickMode = searchParams.get('pickMode') === 'true';

  const [selectedReport, setSelectedReport] = useState(null);
  const [pickedPin, setPickedPin] = useState(null);        // {lat, lng}
  const [pickedWard, setPickedWard] = useState(null);      // ward data from click
  const [wardReports, setWardReports] = useState([]);
  const [wardReportsLoading, setWardReportsLoading] = useState(false);
  const [hoveredReport, setHoveredReport] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [viewMode, setViewMode] = useState('map');      // 'map' | 'list'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  // Confirm pick — save to localStorage and go back to report
  const confirmPick = () => {
    if (!pickedPin) return;
    localStorage.setItem('bb_picked_location', JSON.stringify({
      lat: pickedPin.lat,
      lng: pickedPin.lng,
      ward: pickedWard?.ward || null,
      wardName: pickedWard?.name || pickedWard?.mla?.area || null,
      mla: pickedWard?.mla?.mla || null,
      party: pickedWard?.mla?.party || null,
      partyColor: pickedWard?.mla?.partyColor || null,
      authority: pickedWard?.mla?.authority || 'BBMP',
    }));
    navigate('/report?step=3&locationPicked=true');
  };

  // Filtered reports based on active dropdowns
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      const severityMatch = severityFilter === 'all' || (report.severity && report.severity.toLowerCase() === severityFilter.toLowerCase());
      const statusMatch = statusFilter === 'all' || (report.status && report.status.toLowerCase() === statusFilter.toLowerCase());
      return severityMatch && statusMatch;
    });
  }, [allReports, severityFilter, statusFilter]);

  // Sync Markers with filtered reports
  useEffect(() => {
    if (!map.current || viewMode !== 'map' || isPickMode) {
      markers.current.forEach(m => m.remove());
      markers.current = [];
      return;
    }

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add new markers
    filteredReports.forEach(report => {
      if (!report.lat || !report.lng) return;

      const el = document.createElement('div');
      el.className = 'custom-marker';
      const bgColor = report.category === 'garbage' ? '#2B9348' : 
                     (report.severity === 'critical' || report.severity === 'emergency' ? '#ef4444' : 
                     (report.severity === 'severe' || report.severity === 'high' ? '#f97316' : '#fbbf24'));
      const size = report.category === 'garbage' ? '18px' : '14px';
      const emoji = report.category === 'garbage' ? '♻️' : '';
      
      el.innerHTML = `<div style="background-color: ${bgColor}; width: ${size}; height: ${size}; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 8px; cursor: pointer;">${emoji}</div>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.lng, report.lat])
        .addTo(map.current);
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleReportClick(report);
      });

      markers.current.push(marker);
    });
  }, [filteredReports, viewMode, isPickMode]);

  // Pick mode pin
  useEffect(() => {
    if (!map.current || !isPickMode) return;
    
    // Static pin for pick mode
    const pinEl = document.createElement('div');
    pinEl.innerHTML = '<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); cursor: move;">📍</div>';
    
    const dragPin = new maplibregl.Marker({ element: pinEl, draggable: false });
    
    if (pickedPin) {
      dragPin.setLngLat([pickedPin.lng, pickedPin.lat]).addTo(map.current);
    }

    return () => dragPin.remove();
  }, [isPickMode, pickedPin]);

  const handleReportClick = (report) => {
    let recoveredWard = null;
    if (report.ward_no) recoveredWard = wardMLAData.find(w => Number(w.ward) === Number(report.ward_no));
    if (!recoveredWard && report.area_name) {
      recoveredWard = wardMLAData.find(w => 
        w.name.toLowerCase().includes(report.area_name.toLowerCase()) || 
        report.area_name.toLowerCase().includes(w.name.toLowerCase())
      );
    }

    const constituency = report.mla_constituency || recoveredWard?.constituency || report.area_name || 'Central';
    const mpInfo = getMPByConstituency(constituency);

    const mlaDetails = {
      mla: report.mla_name || recoveredWard?.mla || 'BBMP Authority',
      party: report.mla_party || recoveredWard?.party || 'BBMP',
      mp: report.mp_name || recoveredWard?.mp || mpInfo.mp,
      mpConstituency: report.mp_constituency || recoveredWard?.mpConstituency || mpInfo.mpConstituency,
      authority: report.authority || recoveredWard?.authority || 'BBMP Authority',
      constituency: constituency
    };

    setSelectedReport({
      ...report,
      id: report.id || report.ref_no,
      title: report.title,
      category: report.category,
      area: report.area_name || recoveredWard?.name || 'Bangalore Civic Audit',
      ward: report.ward_no || recoveredWard?.ward || 'GPS',
      status: report.status,
      description: report.description,
      photo_url: report.photo_url,
      mlaDetails: mlaDetails
    });
    setWardReports([]);
  };

  const handleWardAction = async (wardProps, type = 'click') => {
    const wardNo = wardProps.KGISWardNo || wardProps.ward || 1;
    let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
    if (!mlaData) {
      const zone = wardProps.KGISWardName?.split('(')[1]?.replace(')', '') || 'Central';
      const fallbackMla = completeMLAList.find(m => m.constituency === zone) || completeMLAList[Number(wardNo) % completeMLAList.length];
      mlaData = { ...fallbackMla, ...getMPByZone(zone) };
    }

    if (type === 'hover') {
      const zone = wardProps.KGISWardName ? (wardProps.KGISWardName.split('(')[1]?.replace(')', '') || 'Central') : 'Central';
      setHoveredReport({
        id: `ward-${wardNo}`,
        title: `${wardProps.KGISWardName || wardProps.name} | Ward #${wardNo} | ${zone}`,
        category: "geographical area",
        area: `Ward #${wardNo}`,
        ward: wardNo,
        mlaDetails: mlaData
      });
      // Pre-load reports for comparison while hovering
      getReports({ ward_no: wardNo }).then(setWardReports);
    } else {
      setSelectedReport({
        id: `ward-${wardNo}`,
        title: `${wardProps.KGISWardName || wardProps.name} Overview`,
        category: "geographical area",
        catColor: mlaData.partyColor || "#2B9348",
        area: `BBMP Ward #${wardNo}`,
        ward: wardNo,
        authority: "Bruhat Bengaluru Mahanagara Palike",
        status: "pending",
        mlaDetails: mlaData
      });
      setWardReports([]);
      setWardReportsLoading(true);
      const reports = await getReports({ ward_no: wardNo });
      setWardReports(reports);
      setWardReportsLoading(false);
    }
  };

  useEffect(() => {
    if (map.current) return; // Initialize only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: BENGALURU_CENTER,
      zoom: 12,
      minZoom: 10,
      maxBounds: BENGALURU_BOUNDS
    });

    map.current.on('load', () => {
      // Add Ward GeoJSON Source
      map.current.addSource('bbmp-wards', {
        type: 'geojson',
        data: '/data/bangalore-wards.geojson?v=datameet_243'
      });

      // Ward Fills
      map.current.addLayer({
        id: 'ward-fills',
        type: 'fill',
        source: 'bbmp-wards',
        layout: {},
        paint: {
          'fill-color': '#2B9348',
          'fill-opacity': 0.05
        }
      });

      // Ward Borders
      map.current.addLayer({
        id: 'ward-borders',
        type: 'line',
        source: 'bbmp-wards',
        layout: {},
        paint: {
          'line-color': '#2B9348',
          'line-width': 1,
          'line-opacity': 0.2
        }
      });

      // Ward Highlight Layer
      map.current.addLayer({
        id: 'ward-highlight',
        type: 'fill',
        source: 'bbmp-wards',
        layout: {},
        paint: {
          'fill-color': '#55A630',
          'fill-opacity': 0.15
        },
        filter: ['==', ['get', 'KGISWardNo'], '']
      });

      // Ward Highlight Border
      map.current.addLayer({
          id: 'ward-highlight-border',
          type: 'line',
          source: 'bbmp-wards',
          layout: {},
          paint: {
            'line-color': '#E9C46A',
            'line-width': 2,
            'line-dasharray': [3, 2]
          },
          filter: ['==', ['get', 'KGISWardNo'], '']
      });

      // Hover interactions
      map.current.on('mousemove', 'ward-fills', (e) => {
        if (e.features.length > 0) {
          map.current.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          const wardNo = feature.properties.KGISWardNo;
          map.current.setFilter('ward-highlight', ['==', ['get', 'KGISWardNo'], wardNo]);
          map.current.setFilter('ward-highlight-border', ['==', ['get', 'KGISWardNo'], wardNo]);
          handleWardAction(feature.properties, 'hover');
        }
      });

      map.current.on('mouseleave', 'ward-fills', () => {
        map.current.getCanvas().style.cursor = '';
        map.current.setFilter('ward-highlight', ['==', ['get', 'KGISWardNo'], '']);
        map.current.setFilter('ward-highlight-border', ['==', ['get', 'KGISWardNo'], '']);
        setHoveredReport(null);
      });

      // Click interaction
      map.current.on('click', (e) => {
        // If pick mode, set pin
        if (isPickMode) {
          setPickedPin({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          // Check if we clicked a ward
          const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
          if (features.length > 0) {
            const wardProps = features[0].properties;
            const wardNo = wardProps.KGISWardNo || 1;
            let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
            setPickedWard({ ward: wardNo, name: wardProps.KGISWardName, mla: mlaData });
          } else {
            setPickedWard(null);
          }
          return;
        }

        // Normal mode: check for ward clicks
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
        if (features.length > 0) {
          handleWardAction(features[0].properties, 'click');
        }
      });
    });

    // Handle global report fetch
    getReports().then(data => {
      setAllReports(data || []);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isPickMode]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full relative">
      
      {/* Namma Kasa Style Filter Header */}
      {!isPickMode && (
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col gap-3 pointer-events-none">
          {/* Top Row: Filters and Toggles */}
          <div className="flex justify-between items-center w-full pointer-events-auto">
            <div className="flex gap-2">
              <select 
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-white border border-ash/30 rounded-lg px-3 py-1.5 text-[10px] font-bold text-black outline-none shadow-sm focus:border-forest"
              >
                <option value="all">All Severity</option>
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-ash/30 rounded-lg px-3 py-1.5 text-[10px] font-bold text-black outline-none shadow-sm focus:border-forest"
              >
                <option value="all">All Status</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            <div className="flex bg-white border border-ash/30 rounded-lg overflow-hidden shadow-sm">
              <button 
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-[10px] font-bold border-r border-ash/30 uppercase ${viewMode === 'map' ? 'bg-forest text-gold' : 'text-black hover:bg-ash/10'}`}
              >
                Map
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase ${viewMode === 'list' ? 'bg-forest text-gold' : 'text-black hover:bg-ash/10'}`}
              >
                List
              </button>
            </div>
          </div>

          {/* Bottom Row: Key Stats & Scope */}
          <div className="flex justify-between items-center px-1">
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                  <span className="text-xl md:text-3xl font-black text-white drop-shadow-md">
                     {allReports.filter(r => r.status === 'open' || !r.status || r.status === 'pending').length}
                  </span>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Active</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-xl md:text-3xl font-black text-white drop-shadow-md">
                     {allReports.length}
                  </span>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Reports</span>
               </div>
            </div>
            <div className="bg-gold text-black font-black text-[9px] px-3 py-1 rounded-sm uppercase tracking-tighter animate-pulse flex items-center gap-2 shadow-lg">
               <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
               Bengaluru Maplibregl Engine
            </div>
          </div>
        </div>
      )}

      {/* Pick Mode Banner */}
      {isPickMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] bg-red-600 text-white p-5 rounded-2xl shadow-2xl border-4 border-black flex gap-6 items-center w-[90%] max-w-lg">
          <div className="text-3xl animate-bounce">📍</div>
          <div className="flex-1">
            <div className="font-display font-black text-xl uppercase tracking-tighter leading-none mb-1">Select the Problem Spot</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Tap exactly where the issue is. We log GPS automatically.</div>
          </div>
          <button onClick={() => navigate('/map')} className="bg-black text-white px-3 py-1.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-white/20 transition-transform active:scale-95 shrink-0">Cancel</button>
        </div>
      )}

      {/* Main Content: Conditional Map or List */}
      <div className="flex-1 w-full h-full z-10 bg-black">
        {viewMode === 'map' ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          <div className="w-full h-full p-8 pt-32 overflow-y-auto bg-[#fdfbf6]">
             <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-12 border-b-8 border-black pb-6">
                   <div>
                      <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-black mb-6 tracking-tighter relative z-10 max-w-5xl leading-[0.95]">
                        Bengaluru is Broken. <br className="hidden md:block"/>
                        <span className="text-forest relative inline-block">
                          You are the Fix.
                          <span className="absolute -bottom-4 left-0 w-full h-1 md:h-1.5 bg-gold -z-10"></span>
                        </span>
                      </h1>
                      <p className="text-xs md:text-sm font-bold text-black/50 uppercase tracking-[0.2em]">Live Audit Stream • {filteredReports.length} Reports Logged</p>
                   </div>
                </div>

                {filteredReports.length === 0 ? (
                   <div className="py-20 text-center border-4 border-dashed border-black/10 rounded-3xl">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-xl font-bold text-black/40 uppercase tracking-widest">No reports match your filters.</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredReports.map(report => (
                        <div key={report.id || report.ref_no} className="bg-white border-[4px] border-black rounded-2xl p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[15px_15px_0px_0px_rgba(255,182,0,1)] transition-all cursor-pointer group" onClick={() => { setViewMode('map'); handleReportClick(report); }}>
                           <div className="flex justify-between items-start mb-6">
                              <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 border-black ${report.status === 'resolved' ? 'bg-green-400 text-black' : 'bg-red-500 text-white'}`}>
                                 {report.status || 'open'}
                              </span>
                              <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">#{report.ref_no?.slice(-6) || 'AUDIT'}</span>
                           </div>
                           <div className="flex items-center gap-2 mb-2">
                              {report.category === 'garbage' && (
                                <span className="bg-forest text-gold text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">Namma Kasa</span>
                              )}
                           </div>
                           <h3 className="font-display font-black text-2xl text-black mb-1 leading-tight group-hover:underline underline-offset-4 decoration-4">{report.title}</h3>
                           
                           {/* Location & Representative Context */}
                           <div className="flex flex-col gap-1 mb-6">
                              <div className="text-[10px] font-black text-black/60 uppercase tracking-widest flex items-center gap-2 bg-ash/10 w-fit px-3 py-1 rounded-lg">📍 {report.area_name || 'GPS SPOT'}</div>
                              <div className="flex gap-2">
                                <span className="text-[8px] font-black uppercase text-forest/60 tracking-wider">MLA: {report.mla_name || 'BBMP Authority'}</span>
                                <span className="text-[8px] font-black uppercase text-black/20 tracking-wider">•</span>
                                <span className="text-[8px] font-black uppercase text-black/40 tracking-wider">MP: {report.mp_name || 'Bengaluru'}</span>
                              </div>
                           </div>
                           <div className="mt-auto pt-6 border-t-2 border-black/5 flex items-center justify-between">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-black/40 uppercase tracking-widest">Priority</span>
                                 <span className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${report.severity === 'critical' ? 'bg-red-600 animate-pulse' : 'bg-gold'}`}></span>
                                    {report.severity || 'moderate'}
                                 </span>
                              </div>
                              <button className="bg-black text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-forest transition-colors">Observe Spot →</button>
                           </div>
                        </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Overlays (Card, PickMode Banner, etc.) */}
      {isPickMode ? (
        <div className="absolute bottom-6 left-4 right-4 z-[400] bg-white rounded-2xl shadow-2xl p-4 border border-[#1a3a2a]/10">
          {pickedPin ? (
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center text-xs font-bold text-forest shrink-0">LOC</div>
                <div>
                  <p className="font-bold text-[#1a3a2a] text-sm">
                    {pickedWard?.name ? `Ward ${pickedWard.ward} — ${pickedWard.name}` : 'Location pinned'}
                  </p>
                  <p className="text-xs text-[#1a3a2a]/50">
                    {pickedWard?.mla ? `MLA: ${pickedWard.mla.mla}` : `${pickedPin.lat.toFixed(4)}, ${pickedPin.lng.toFixed(4)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={confirmPick}
                className="w-full bg-forest text-gold py-3 rounded-xl font-bold hover:bg-[#1a3a2a] transition-colors shadow-lg"
              >
                Confirm This Location — Back to Report
              </button>
            </div>
          ) : (
            <p className="text-center text-[#1a3a2a]/60 font-bold text-sm py-2">
              👆 Tap anywhere on the map to drop your pin
            </p>
          )}
        </div>
      ) : (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] hidden md:flex items-center gap-3">
          <a href="/" className="px-5 py-3 bg-white text-forest border border-forest/10 rounded-full font-bold shadow-lg flex items-center justify-center hover:bg-forest/5 transition-transform hover:scale-105">Home</a>
          <a href="/report" className="px-6 py-3 bg-forest text-gold rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-black transition-transform hover:scale-105">Scan QR to Report</a>
        </div>
      )}

      {/* Floating Accountability Card */}
      {(selectedReport || hoveredReport) && (() => {
        const activeReport = selectedReport || hoveredReport;
        return (
          <div 
            className="absolute top-24 bottom-6 right-4 md:right-8 w-full md:w-[350px] bg-white rounded-xl shadow-2xl z-[500] flex flex-col border border-ash/40 overflow-hidden transform transition-all animate-in slide-in-from-right-8 duration-300"
          >
            <div className="flex justify-between items-center p-3 border-b border-forest/10 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full bg-forest ${!selectedReport ? 'animate-pulse' : ''}`}></div>
                <span className="uppercase text-[10px] font-bold tracking-wider text-forest">
                  {activeReport.id?.startsWith('ward-') ? `Ward #${activeReport.ward}` : `Audit ID: ${activeReport.ref_no?.slice(-6) || 'LIVE'}`}
                </span>
              </div>
              <button onClick={() => { setSelectedReport(null); setHoveredReport(null); setWardReports([]); }} className="text-forest/30 hover:text-forest">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-5 border-b border-forest/10">
                  <div className="flex flex-col gap-0.5 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                       <span className="font-display font-black text-[14px] uppercase tracking-tighter text-black">SPOT: {activeReport.area || activeReport.area_name || 'UNSPECIFIED LOCATION'}</span>
                    </div>
                    <span className="font-display font-medium text-[8px] uppercase tracking-[0.2em] text-black/40">Civic Audit Record » ID: {activeReport.ref_no?.slice(-6) || 'LIVE'}</span>
                    <h2 className="font-display font-black text-2xl text-black leading-[0.95] tracking-tighter mt-1 mb-2">
                      {activeReport.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-nav font-black text-[9px] bg-forest text-gold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                        {activeReport.ward ? `WARD #${activeReport.ward}` : 'GPS AUDIT'}
                      </span>
                      {activeReport.mlaDetails?.constituency && (
                        <span className="font-nav font-black text-[9px] bg-black text-white px-2 py-0.5 rounded-sm uppercase tracking-widest">
                          AC: {activeReport.mlaDetails.constituency}
                        </span>
                      )}
                    </div>
                  </div>

                {/* Evidence Photo */}
                {activeReport.photo_url ? (
                  <div className="mb-6 rounded-2xl overflow-hidden border-4 border-black shadow-lg aspect-auto min-h-[150px] bg-black/5">
                    <img 
                      src={activeReport.photo_url} 
                      alt="Evidence" 
                      className="w-full h-full object-contain bg-black" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="mb-6 rounded-2xl border-4 border-dashed border-forest/10 p-8 flex flex-col items-center justify-center text-center opacity-40">
                    <span className="text-3xl mb-2">📷</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest">No photo evidence attached</p>
                  </div>
                )}

                {selectedReport && activeReport.description && (
                  <div className="mb-6 bg-cream/30 p-4 rounded-xl border border-forest/10 italic text-sm text-black/70">
                    "{activeReport.description}"
                  </div>
                )}
                <div className="bg-[#1a3a2a] text-white rounded-[2rem] p-6 mb-6 flex flex-col gap-5 border border-forest shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-100 transition-opacity">
                     <span className="text-4xl">⚖️</span>
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display font-black text-[9px] uppercase tracking-[0.3em] text-white/40 mb-1">Local Accountability Metrics</span>
                    <h4 className="font-display font-black text-xl uppercase tracking-tighter text-gold leading-none">
                      {activeReport.mlaDetails?.mla && activeReport.mlaDetails.mla !== 'In Audit Zone' 
                        ? activeReport.mlaDetails.mla 
                        : 'BBMP Authority'
                      }
                    </h4>
                    <span className="text-[10px] uppercase font-black text-white/50 tracking-widest">{activeReport.mlaDetails?.constituency || activeReport.area} (AC)</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="font-nav font-black text-[9px] uppercase tracking-widest text-white/60">Resolution Score</span>
                       <span className="font-display font-black text-bright text-lg">14%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-bright rounded-full w-[14%] shadow-[0_0_10px_rgba(43,247,172,0.3)]"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-0.5">MP Oversight</div>
                        <div className="text-xs font-bold text-white break-words">
                          {activeReport.mlaDetails?.mp && activeReport.mlaDetails.mp !== 'Bengaluru'
                            ? activeReport.mlaDetails.mp 
                            : 'P. C. Mohan'
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-0.5">Constituency</div>
                        <div className="text-xs font-bold text-white">{activeReport.mlaDetails?.mpConstituency || 'Central'}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/accountability?search=${encodeURIComponent(activeReport.mlaDetails?.mla)}`)}
                      className="w-full bg-gold text-forest py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-2"
                    >
                      Audit Official Record →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-forest/10">
                  <div className="bg-forest/5 rounded-xl p-2.5 text-center border border-forest/10">
                    <div className="font-display font-bold text-2xl text-forest">{activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.length || 0)}</div>
                    <div className="text-[9px] font-bold uppercase text-forest/40">Total</div>
                  </div>
                  <div className="bg-gold/10 rounded-xl p-2.5 text-center border border-gold/20">
                    <div className="font-display font-bold text-2xl text-forest">{activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.filter(r => r.status === 'open').length || 0)}</div>
                    <div className="text-[9px] font-bold uppercase text-forest/40">Open</div>
                  </div>
                  <div className="bg-bright/10 rounded-xl p-2.5 text-center border border-bright/20">
                    <div className="font-display font-bold text-2xl text-bright">{activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.filter(r => r.status === 'resolved').length || 0)}</div>
                    <div className="text-[9px] font-bold uppercase text-bright/60">Fixed</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a3a2a]/50 mb-3">
                    {wardReportsLoading ? 'Loading complaints…' : wardReports.length > 0 ? `${wardReports.length} Complaint${wardReports.length > 1 ? 's' : ''}` : 'No complaints filed yet'}
                  </h3>
                  {!wardReportsLoading && wardReports.length > 0 && (
                    <div className="space-y-2">
                      {wardReports.slice(0, 5).map(report => (
                        <div key={report.id || report.ref_no} className="bg-white border border-[#1a3a2a]/10 rounded-xl p-3 hover:border-forest transition-colors">
                          <div className="flex gap-2 items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-[#1a3a2a] leading-tight line-clamp-2">{report.title}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{report.status === 'resolved' ? '✓ Fixed' : '● Open'}</span>
                            </div>
                            <button onClick={() => upvoteReport(report.id || report.ref_no).then(() => getReports({ ward_no: activeReport.ward }).then(setWardReports))} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl bg-forest/5 hover:bg-forest hover:text-gold text-forest font-bold text-xs transition-all shrink-0"><span>▲</span><span>{report.upvotes || 0}</span></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-forest/10 bg-white flex flex-col gap-2 shrink-0">
              <a href={`/report?ward=${activeReport.ward}`} className="w-full bg-forest hover:bg-[#1a3a2a] text-gold py-3 rounded-lg font-bold text-sm text-center shadow-lg transition-colors">Report a Problem Here</a>
              <div className="text-center text-[9px] text-forest/40 font-bold flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 bg-bright rounded-full"></span> Citizen-verified data</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
