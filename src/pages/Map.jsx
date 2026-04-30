import { useState, useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categories, wardMLAData, completeMLAList, getMPByConstituency, getMPByZone, accurateAreaNames } from '../data/wardData';

// Performance Throttle
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};
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
  const lastHoveredWardNo = useRef(null);
  const wardGeoJson = useRef(null);

  // Pre-load GeoJSON for robust spatial querying
  useEffect(() => {
    fetch('/data/bangalore-wards.geojson?v=datameet_243')
      .then(r => r.json())
      .then(data => { wardGeoJson.current = data; })
      .catch(err => console.error("Failed to load ward GeoJSON:", err));
  }, []);

  const [hoveredReport, setHoveredReport] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [viewMode, setViewMode] = useState('map');      // 'map' | 'list'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [is3D, setIs3D] = useState(false); 
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Track mouse for tooltip following

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

  // Pure sync helper — derives direction from authority/mpConstituency
  const getDirection = (authorityStr = '', mpConst = '') => {
    if (/north/i.test(authorityStr) || /yelahanka/i.test(authorityStr)) return 'North';
    if (/south/i.test(authorityStr)) return 'South';
    if (/east/i.test(authorityStr)) return 'East';
    if (/west/i.test(authorityStr)) return 'West';
    if (/mahadevapura/i.test(authorityStr)) return 'East';
    if (/byatarayanapura/i.test(authorityStr)) return 'North';
    if (/dasarahalli/i.test(authorityStr)) return 'North';
    if (/bommanahalli/i.test(authorityStr)) return 'South';
    if (/bangalore north/i.test(mpConst)) return 'North';
    if (/bangalore south/i.test(mpConst)) return 'South';
    if (/bangalore central/i.test(mpConst)) return 'Central';
    if (/bangalore rural/i.test(mpConst)) return 'Outer';
    return 'Central';
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
      const authorityStr = mlaData?.authority || '';
      const mpConst = mlaData?.mpConstituency || '';
      const direction = getDirection(authorityStr, mpConst);

      setHoveredReport({
        id: `ward-${wardNo}`,
        wardName: wardProps.wardName || wardProps.KGISWardName || wardProps.name,
        ward: wardNo,
        direction,
        constituency: mlaData?.constituency || '',
        authority: authorityStr,
        mlaDetails: mlaData,
        subAreas: wardProps.subAreas || []
      });
      // NOTE: do NOT call getReports here — it fires on every mouse pixel and kills performance
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
      style: 'https://tiles.openfreemap.org/styles/dark', // High fidelity Open Source tiles
      center: BENGALURU_CENTER,
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      minZoom: 10,
      maxBounds: BENGALURU_BOUNDS,
      antialias: true
    });

    map.current.on('load', () => {
      // DEBUG: View available sources to ensure correct ID
      console.log('Map Sources:', map.current.getStyle().sources);

      // 3D Building Extrusion (Correction: source name is 'openmaptiles')
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'openmaptiles', 
        'source-layer': 'building',
        'type': 'fill-extrusion',
        'minzoom': 13,
        'paint': {
          'fill-extrusion-color': '#2a3a4a',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            13, 0,
            14, ['coalesce', ['get', 'render_height'], ['get', 'height'], 20]
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            13, 0,
            14, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]
          ],
          'fill-extrusion-opacity': 0.8
        }
      });

      // Add Ward GeoJSON Source
      map.current.addSource('bbmp-wards', {
        type: 'geojson',
        data: '/data/bangalore-wards.geojson?v=datameet_243'
      });

      // Ward fill — transparent but present so MapLibre hit-tests it on mousemove.
      // IMPORTANT: fill-opacity must be > 0 (even 0.001) for queryRenderedFeatures to work reliably.
      map.current.addLayer({
        id: 'ward-fills',
        type: 'fill',
        source: 'bbmp-wards',
        paint: {
          'fill-color': '#4ADE80',
          'fill-opacity': 0.001   // near-invisible but guarantees hit-testing
        }
      });

      // Ward Highlight Layer — flat fill (NOT fill-extrusion) so it never blocks mouse events
      // even when the map is in 3D mode. Shown only on hovered ward via filter.
      map.current.addLayer({
        id: 'ward-highlight',
        type: 'fill',
        source: 'bbmp-wards',
        paint: {
          'fill-color': '#E9C46A',
          'fill-opacity': 0.18
        },
        filter: ['==', ['get', 'KGISWardNo'], '']
      });

      // Ward Borders (Subtle Emerald Glow)
      map.current.addLayer({
        id: 'ward-borders',
        type: 'line',
        source: 'bbmp-wards',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#4ADE80', // Brighter, lighter emerald
          'line-width': 0.8,
          'line-opacity': 0.15 
        }
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

      // Dim Infrastructure (The "Whitish/Grey" lines)
      const currentLayers = map.current.getStyle().layers;
      currentLayers.forEach(layer => {
        try {
          if (layer.id.includes('road') || layer.id.includes('highway') || layer.id.includes('transportation') || layer.id.includes('boundary')) {
            if (layer.type === 'line') {
              map.current.setPaintProperty(layer.id, 'line-opacity', 0.1);
            }
          }
          if (layer.id.includes('building')) {
            if (layer.type === 'fill') {
              map.current.setPaintProperty(layer.id, 'fill-opacity', 0.5);
            } else if (layer.type === 'fill-extrusion') {
              map.current.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.5);
            }
          }
        } catch (e) {
          console.warn(`Could not set paint property for layer ${layer.id}:`, e);
        }
      });

      // High-Performance Hover Handler
      const handleMouseMove = throttle((e) => {
        if (!map.current) return;
        
        // 1. Native Hit-Testing (Fastest)
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
        let feature = features[0];

        // 2. Spatial Fallback (Turf) — only if native misses or we are in a complex 3D state
        if (!feature && wardGeoJson.current) {
          const pt = [e.lngLat.lng, e.lngLat.lat];
          const point = turf.point(pt);
          feature = wardGeoJson.current.features.find(f => turf.booleanPointInPolygon(point, f));
        }

        if (feature) {
          map.current.getCanvas().style.cursor = 'pointer';
          const wardNo = feature.properties.KGISWardNo;

          if (wardNo !== lastHoveredWardNo.current) {
            lastHoveredWardNo.current = wardNo;
            const wardNoStr = String(wardNo);
            const wardNoNum = Number(wardNo);
            
            map.current.setFilter('ward-highlight', ['==', ['get', 'KGISWardNo'], wardNoStr]);
            map.current.setFilter('ward-highlight-border', ['==', ['get', 'KGISWardNo'], wardNoStr]);

            // Enhanced area names from our accurate JSON (Handle both string and number keys)
            const areaInfo = accurateAreaNames[wardNoNum] || accurateAreaNames[wardNoStr] || {};
            const wardProps = {
              ...feature.properties,
              wardName: areaInfo.name || feature.properties.KGISWardName || `Ward ${wardNo}`,
              subAreas: areaInfo.areas || []
            };

            // Update hover card position
            setMousePos({ x: e.point.x, y: e.point.y });
            handleWardAction(wardProps, 'hover');
          } else {
            // Smoothly track mouse within the same ward
            setMousePos({ x: e.point.x, y: e.point.y });
          }
        } else {
          if (lastHoveredWardNo.current !== null) {
            lastHoveredWardNo.current = null;
            map.current.getCanvas().style.cursor = '';
            map.current.setFilter('ward-highlight', ['==', ['get', 'KGISWardNo'], '']);
            map.current.setFilter('ward-highlight-border', ['==', ['get', 'KGISWardNo'], '']);
            setHoveredReport(null);
          }
        }
      }, 16); // 16ms = ~60fps for buttery smooth tracking like Namma Kasa

      map.current.on('mousemove', handleMouseMove);

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
        const pt = [e.lngLat.lng, e.lngLat.lat];
        const point = turf.point(pt);
        const feature = wardGeoJson.current?.features.find(f => turf.booleanPointInPolygon(point, f));

        if (feature) {
          const wardNo = feature.properties.KGISWardNo;
          const areaInfo = accurateAreaNames[wardNo] || {};
          const wardProps = {
            ...feature.properties,
            wardName: areaInfo.name || feature.properties.KGISWardName,
            subAreas: areaInfo.areas || []
          };
          handleWardAction(wardProps, 'click');
        } else {
          // Clicked background: Clear everything
          setSelectedReport(null);
          setHoveredReport(null);
          setWardReports([]);
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

  // Handle 2D/3D Toggle Effect
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (is3D) {
      map.current.easeTo({
        pitch: 55,
        bearing: -15,
        duration: 1000
      });
      // Show 3D building extrusions
      if (map.current.getLayer('3d-buildings')) {
        map.current.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.8);
      }
    } else {
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
      // Hide 3D building extrusions
      if (map.current.getLayer('3d-buildings')) {
        map.current.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0);
      }
    }
    // ward-highlight is a flat fill layer — hover works in BOTH 2D and 3D modes
  }, [is3D]);

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

            {/* 2D/3D View Toggle */}
            <div className="flex bg-white border border-black rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
               <button 
                 onClick={() => setIs3D(false)}
                 className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-r border-black hover:bg-black/5 transition-colors ${!is3D ? 'bg-black text-white' : 'text-black'}`}
               >
                 2D
               </button>
               <button 
                 onClick={() => setIs3D(true)}
                 className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 transition-colors ${is3D ? 'bg-black text-white' : 'text-black'}`}
               >
                 3D
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

      {/* Floating Ward Hover Card — nammakasa.in style */}
      {hoveredReport && (() => {
        const h = hoveredReport;
        if (selectedReport && window.innerWidth < 768) return null;

        const wardName   = h.wardName || 'BBMP Area';
        const wardNo     = h.ward;
        const direction  = h.direction || '';
        const mainArea   = h.constituency || h.mlaDetails?.constituency || '';
        // Sub-constituency / broader zone label
        const zoneLabel  = (h.authority || '')
          .replace(/^BBMP\s*/i, '').replace(/\s*Zone\s*$/i, '').trim();
        const showZone   = zoneLabel && zoneLabel.toLowerCase() !== mainArea.toLowerCase();
        const reportCount = wardReports.length;

        // Mouse-following logic: offset from cursor to prevent blocking
        const tooltipStyle = {
          position: 'absolute',
          left: mousePos.x + 20,
          top: mousePos.y + 20,
          zIndex: 1000,
          pointerEvents: 'none',
          transform: 'translate(0, 0)',
          transition: 'transform 0.1s ease-out'
        };

        // For mobile/small screens, keep it fixed at bottom to avoid overlap
        const isMobile = window.innerWidth < 768;
        const finalStyle = isMobile ? {
          position: 'absolute',
          bottom: '24px',
          left: '16px',
          right: '16px',
          zIndex: 1000,
          pointerEvents: 'none'
        } : tooltipStyle;

        return (
          <div style={finalStyle}>
            <div
              className="animate-in fade-in zoom-in-95 duration-200"
              style={{
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.05)',
                borderLeft: '6px solid #4ADE80',
                padding: '16px 20px',
                minWidth: '240px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {/* Ward name */}
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#000', lineHeight: 1.1, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                {wardName}
              </div>
              
              {/* Ward # · Direction */}
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Ward #{wardNo}{direction ? ` · ${direction}` : ''}
              </div>

              {/* Stats Row */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' }}>Reports</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: reportCount > 0 ? '#ef4444' : '#22c55e' }}>{reportCount}</span>
                </div>
                <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' }}>Status</span>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#f97316', marginTop: '3px' }}>MONITORED</span>
                </div>
              </div>

              {/* Constituency (main area) */}
              {mainArea && (
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 900, 
                  color: '#2B9348', 
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase', 
                  marginTop: '4px', 
                  paddingTop: '8px', 
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2B9348' }}></div>
                  {mainArea}
                </div>
              )}
              
              {/* Sub-areas pill list */}
              {h.subAreas && h.subAreas.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {h.subAreas.slice(0, 3).map((area, i) => (
                    <span key={i} style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(0,0,0,0.5)', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '100px' }}>{area}</span>
                  ))}
                  {h.subAreas.length > 3 && <span style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(0,0,0,0.3)' }}>+{h.subAreas.length - 3} more</span>}
                </div>
              )}

              {/* Action Hint */}
              <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(0,0,0,0.2)', textTransform: 'uppercase', textAlign: 'center', marginTop: '8px', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '6px' }}>
                Click to View Accountability
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULL ACCOUNTABILITY SIDEBAR (Only for selected reports or clicks) */}
      {selectedReport && (() => {
        const activeReport = selectedReport;
        const isWardOverview = activeReport.id?.startsWith('ward-');

        // IF IT'S WARD INFO (Clicked empty area), show the right sidebar but simplified if needed
        // (Keeping the user request for "separate area info" from the previous turn)
        
        return (
          <div 
            className="absolute top-4 bottom-4 right-4 w-[calc(100%-2rem)] md:w-[420px] bg-[#fdfdfd] rounded-2xl shadow-2xl z-[500] flex flex-col border border-black/10 overflow-hidden transform transition-all animate-in slide-in-from-right-8 duration-300"
          >
            {/* Header / Badges */}
            <div className="p-4 flex items-center justify-between border-b border-black/5 shrink-0">
               <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${activeReport.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gold/10 text-gold border-gold/20'}`}>
                    {activeReport.severity || (isWardOverview ? 'AREA OVERVIEW' : 'MODERATE')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-ash/10 text-black/60 border-black/5">
                    {activeReport.status || (isWardOverview ? 'NAVIGATING' : 'UNRESOLVED')}
                  </span>
               </div>
               <div className="flex items-center gap-3">
                  <button className="text-black/30 hover:text-black transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button>
                  <button onClick={() => { setSelectedReport(null); setHoveredReport(null); setWardReports([]); }} className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-black/40">✕</button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Location Info */}
                <h1 className="font-display font-black text-2xl text-black leading-tight tracking-tighter mb-1">{activeReport.area || 'Pulikeshinagar'}</h1>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/40 mb-6">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   <span>{activeReport.location_note || `Near ${activeReport.area || 'Ward'} Center`}</span>
                </div>

                {/* Evidence Image */}
                <div className="relative rounded-2xl overflow-hidden border border-black/5 shadow-lg mb-6 group bg-black/5">
                   {activeReport.photo_url ? (
                      <img src={activeReport.photo_url} alt="Evidence" className="w-full h-80 object-cover" />
                   ) : (
                      <div className="w-full h-48 flex flex-col items-center justify-center opacity-30 italic text-xs font-bold bg-[#f8f8f8]">
                         <span className="text-3xl mb-2">📷</span>
                         No Photo Evidence
                      </div>
                   )}
                   <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border border-black/5 hover:bg-white transition-all">
                      <span className="text-orange-500 text-lg">👍</span>
                      I've seen this
                   </button>
                </div>

                {/* Reports Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                   <div className="bg-white border border-black/5 p-4 rounded-2xl text-center shadow-sm">
                      <div className="text-2xl font-display font-black text-orange-600 leading-none mb-1">1</div>
                      <div className="text-[8px] font-black uppercase text-black/30 tracking-widest">Reports</div>
                   </div>
                   <div className="bg-white border border-black/5 p-4 rounded-2xl text-center shadow-sm">
                      <div className="text-2xl font-display font-black text-orange-600 leading-none mb-1">3</div>
                      <div className="text-[8px] font-black uppercase text-black/30 tracking-widest">Days ago</div>
                   </div>
                   <div className="bg-white border border-black/5 p-4 rounded-2xl text-center shadow-sm">
                      <div className="text-[10px] font-display font-black text-blue-600 leading-tight mb-0.5">{activeReport.category || 'Maintenance'}</div>
                      <div className="text-[8px] font-black uppercase text-black/30 tracking-widest">Issue Type</div>
                   </div>
                </div>

                {/* Accountability Hierarchy Section */}
                <div className="mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-6 border-b border-black/5 pb-2">Accountability Hierarchy</h3>
                  
                  <div className="flex flex-col items-center">
                    {/* Your Ward Indicator */}
                    <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm relative">
                       Your Ward
                       <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-200"></div>
                       <div className="block text-[8px] opacity-70 mt-0.5 text-center">Ward #{activeReport.ward}</div>
                    </div>

                    {/* Authority Node */}
                    <div className="flex justify-center gap-12 w-full mb-8 mt-2 relative">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-0.5 bg-blue-100 -z-10 mt-[-1rem]"></div>
                       
                       <div className="flex flex-col items-center gap-2 group">
                          <div className="w-14 h-14 rounded-full bg-white border-2 border-blue-500 shadow-lg flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                             <img src="https://brokenbanglore.in/bbmp_logo.png" alt="BSWML" className="w-full h-full object-contain" onError={e => e.target.src = '🏛️'} />
                          </div>
                          <div className="text-center">
                             <div className="text-[10px] font-black text-black leading-none mb-0.5">BSWML</div>
                             <div className="text-[7px] font-black text-black/30 uppercase tracking-widest">Garbage Authority</div>
                          </div>
                          <div className="absolute bottom-[-1.5rem] w-0.5 h-6 bg-blue-100"></div>
                       </div>

                       <div className="flex flex-col items-center gap-2 opacity-30">
                          <div className="w-14 h-14 rounded-full bg-white border-2 border-ash/20 shadow-md flex items-center justify-center text-xl">⚠️</div>
                          <div className="text-center">
                             <div className="text-[10px] font-black text-black leading-none mb-0.5">Corporator</div>
                             <div className="text-[7px] font-black text-black/30 uppercase tracking-widest">Vacant since 2015</div>
                          </div>
                       </div>
                    </div>

                    {/* Hierarchy Nodes */}
                    <div className="space-y-12 w-full flex flex-col items-center mt-6">
                       {[
                         { id: 'SC', label: 'Special Commissioner', sub: 'BBMP HQ - City-wide SWM Head' },
                         { id: 'ZC', label: 'Zonal Commissioner', sub: 'IAS Officer - East Zone' },
                         { id: 'JHI', label: 'JHI & AEE', sub: 'Ward SWM staff - Monitors collection' }
                       ].map((node, idx, arr) => (
                         <div key={node.id} className="flex flex-col items-center gap-2 relative">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center font-black text-blue-600 text-sm shadow-sm">{node.id}</div>
                            <div className="text-center">
                               <div className="text-[10px] font-black text-black leading-none mb-0.5">{node.label}</div>
                               <div className="text-[7px] font-black text-black/30 uppercase tracking-widest">{node.sub}</div>
                            </div>
                            {idx < arr.length - 1 && <div className="absolute bottom-[-2.5rem] w-0.5 h-10 bg-blue-100"></div>}
                         </div>
                       ))}
                    </div>

                    {/* Elected Representatives Divider */}
                    <div className="w-full h-px bg-dashed border-b-2 border-black/5 border-dashed my-10"></div>
                    
                    {/* MLA / MP Cards */}
                    <div className="grid grid-cols-2 gap-8 w-full px-4">
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 shadow-md">
                             <img src={activeReport.mlaDetails?.photo} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-center">
                             <div className="text-[11px] font-black text-black leading-none mb-0.5">{activeReport.mlaDetails?.mla}</div>
                             <div className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">{activeReport.mlaDetails?.party} — MLA</div>
                          </div>
                       </div>
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-100 shadow-md">
                             <img src={completeMLAList.find(m => m.constituency?.includes('Yelahanka'))?.photo} alt="" className="w-full h-full object-cover" onError={e => e.target.src = 'https://ui-avatars.com/api/?name=MP&background=f97316&color=fff'} />
                          </div>
                          <div className="text-center">
                             <div className="text-[11px] font-black text-black leading-none mb-0.5">{activeReport.mlaDetails?.mp}</div>
                             <div className="text-[8px] font-bold text-orange-600 uppercase tracking-wider">{activeReport.mlaDetails?.mpParty || 'BJP'} — MP</div>
                          </div>
                       </div>
                    </div>
                    
                    <p className="text-[8px] text-black/20 font-bold uppercase tracking-widest text-center mt-8 px-8">Tap any card for contact options — Corporator elections expected mid-2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-black/5 bg-white flex flex-col gap-3">
               <div className="text-center text-[10px] font-bold text-black/30 mb-2">Reported <span className="text-black font-black">3d ago</span> — 1 citizen(s) reported</div>
               <button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl shadow-green-500/10 transition-all active:scale-95">File BBMP Complaint</button>
               <button className="w-full bg-ash/10 hover:bg-ash/20 text-black/60 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  It is Cleaned Up — Verify
               </button>
               <div className="flex items-center justify-center gap-2 mt-2 opacity-50">
                  <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full"></div>
                  <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">All reports are anonymous</span>
               </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
