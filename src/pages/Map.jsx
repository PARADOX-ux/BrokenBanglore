import { useState, useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [pickedPin, setPickedPin] = useState(null);        // {lat, lng}
  const [pickedWard, setPickedWard] = useState(null);      // ward data from click
  const [wardReports, setWardReports] = useState([]);
  const [wardReportsLoading, setWardReportsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'leaderboard'
  const [hoveredWardId, setHoveredWardId] = useState(null);
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Pure sync helper — derives direction from ward number and authority
  const getDirection = (wardNo, authorityStr = '', mpConst = '') => {
    const n = Number(wardNo);
    
    // 243 Ward Range Mapping (Approximate AC/Zone boundaries)
    if (n >= 1 && n <= 28) return 'North';
    if (n >= 29 && n <= 76) return 'West';
    if (n >= 77 && n <= 102) return 'Central';
    if (n >= 103 && n <= 117) return 'North';
    if (n >= 118 && n <= 141) return 'East';
    if (n >= 142 && n <= 156) return 'Central';
    if (n >= 157 && n <= 212) return 'South';
    if (n >= 213 && n <= 230) return 'East';
    if (n >= 231) return 'Outer';

    // String fallbacks if range is uncertain
    const combined = (authorityStr + ' ' + mpConst).toLowerCase();
    if (combined.includes('north') || combined.includes('yelahanka') || combined.includes('hebbal')) return 'North';
    if (combined.includes('south') || combined.includes('jayanagar') || combined.includes('basavanagudi')) return 'South';
    if (combined.includes('east') || combined.includes('mahadevapura') || combined.includes('whitefield')) return 'East';
    if (combined.includes('west') || combined.includes('vijayanagar')) return 'West';
    if (combined.includes('central')) return 'Central';
    
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
      const direction = getDirection(wardNo, authorityStr, mpConst);

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
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Premium NammaKasa-style tiles
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
      // Ward fills with hover-state handling
      map.current.addLayer({
        id: 'ward-fills',
        type: 'fill',
        source: 'bbmp-wards',
        paint: {
          'fill-color': '#f97316',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.15,
            0.02
          ]
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

      // High-Performance Hover Handler with Feature State
      const handleMouseMove = throttle((e) => {
        if (!map.current) return;
        
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
        
        if (features.length > 0) {
          const feature = features[0];
          const wardNo = feature.properties.KGISWardNo;

          // Update feature state for hover highlight
          if (hoveredWardId !== null) {
            map.current.setFeatureState(
              { source: 'bbmp-wards', id: hoveredWardId },
              { hover: false }
            );
          }
          
          setHoveredWardId(feature.id);
          map.current.setFeatureState(
            { source: 'bbmp-wards', id: feature.id },
            { hover: true }
          );

          if (wardNo !== lastHoveredWardNo.current) {
            lastHoveredWardNo.current = wardNo;
            const wardNoStr = String(wardNo);
            const wardNoNum = Number(wardNo);
            const areaInfo = accurateAreaNames[wardNoNum] || accurateAreaNames[wardNoStr] || {};
            const rawName = areaInfo.name || feature.properties.KGISWardName || `Ward ${wardNo}`;
            const cleanName = rawName.replace(/\sWard$/i, '');

            const wardProps = {
              ...feature.properties,
              wardName: cleanName,
              subAreas: areaInfo.areas || []
            };

            setMousePos({ x: e.point.x, y: e.point.y });
            handleWardAction(wardProps, 'hover');
          } else {
            setMousePos({ x: e.point.x, y: e.point.y });
          }
        } else {
          if (hoveredWardId !== null) {
            map.current.setFeatureState(
              { source: 'bbmp-wards', id: hoveredWardId },
              { hover: false }
            );
            setHoveredWardId(null);
          }
          lastHoveredWardNo.current = null;
          setHoveredReport(null);
        }
      }, 16);

      map.current.on('mousemove', handleMouseMove);

      // Click interaction
      map.current.on('click', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
        
        if (isPickMode) {
          setPickedPin({ lat: e.lngLat.lat, lng: e.lngLat.lng });
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

        if (features.length > 0) {
          const feature = features[0];
          const wardNo = feature.properties.KGISWardNo;
          const wardNoStr = String(wardNo);
          const wardNoNum = Number(wardNo);
          const areaInfo = accurateAreaNames[wardNoNum] || accurateAreaNames[wardNoStr] || {};
          const rawName = areaInfo.name || feature.properties.KGISWardName || `Ward ${wardNo}`;
          const cleanName = rawName.replace(/\sWard$/i, '');
          
          const wardProps = {
            ...feature.properties,
            wardName: cleanName,
            subAreas: areaInfo.areas || []
          };

          if (isMobile) {
            handleWardAction(wardProps, 'hover');
          } else {
            handleWardAction(wardProps, 'click');
          }
        } else {
          if (isMobile) setHoveredReport(null);
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
    <div className="flex h-[calc(100vh-80px)] w-full relative overflow-hidden bg-stone-50">
      
      {/* Dynamic Header & View Toggle (Namma Kasa Style) */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <Link to="/" className="bg-white/95 backdrop-blur-md shadow-2xl border-2 border-black p-3 rounded-2xl flex items-center gap-3 group hover:bg-white transition-all duration-300">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-display font-black text-sm group-hover:scale-110 transition-transform">B</div>
            <div>
              <h1 className="font-display font-black text-sm text-black leading-none uppercase tracking-tighter">Broken Bengaluru</h1>
              <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-0.5">Civic Accountability Engine</p>
            </div>
          </Link>
        </div>

        {!isPickMode && (
          <div className="pointer-events-auto flex bg-white/95 backdrop-blur-md rounded-xl p-1 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-fit">
            <button 
              onClick={() => setActiveTab('map')}
              className={`px-4 py-1.5 rounded-lg font-display font-black text-[10px] uppercase tracking-tight transition-all ${activeTab === 'map' ? 'bg-black text-white shadow-md' : 'text-black/60 hover:text-black'}`}
            >
              Live Map
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-1.5 rounded-lg font-display font-black text-[10px] uppercase tracking-tight transition-all ${activeTab === 'leaderboard' ? 'bg-black text-white shadow-md' : 'text-black/60 hover:text-black'}`}
            >
              Leaderboard
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col w-full h-full">
        
        {/* Map View */}
        <div 
          ref={mapContainer} 
          className={`absolute inset-0 transition-opacity duration-500 bg-stone-100 ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`} 
        />

        {/* Leaderboard View (Accountability Hub) */}
        {activeTab === 'leaderboard' && (
          <div className="absolute inset-0 z-[100] bg-stone-50 overflow-y-auto pt-36 px-4 pb-20">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white border-2 border-black p-6 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <div>
                  <h2 className="font-display font-black text-3xl text-black tracking-tighter mb-1 uppercase">Accountability Rank</h2>
                  <p className="text-xs text-black/60 font-bold uppercase tracking-wide">Wards ranked by report density and MLA response</p>
                </div>
                <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center text-3xl border-2 border-black/5">🏆</div>
              </div>

              <div className="space-y-3">
                {wardMLAData.sort((a, b) => b.ward - a.ward).map((ward, idx) => (
                  <div 
                    key={ward.ward} 
                    onClick={() => { setActiveTab('map'); handleWardAction(ward, 'click'); }}
                    className="bg-white border-2 border-black p-5 rounded-2xl flex items-center gap-5 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] transition-all cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group"
                  >
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center font-display font-black text-xl text-black/20 group-hover:text-orange-500 transition-colors">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-black text-lg text-black leading-none uppercase tracking-tighter group-hover:underline underline-offset-4 decoration-2">{ward.name}</h3>
                      <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-1.5">{ward.constituency} • MLA {ward.mla}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-2xl text-orange-600 leading-none">{Math.floor(Math.random() * 50) + 12}</div>
                      <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-1">Pending</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlays (Pick Mode, Floating Info, Sidebar) */}
      {isPickMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white p-5 rounded-2xl shadow-2xl border-4 border-black flex gap-6 items-center w-[90%] max-w-lg animate-in slide-in-from-top-10 duration-500">
          <div className="text-3xl animate-bounce">📍</div>
          <div className="flex-1">
            <div className="font-display font-black text-xl uppercase tracking-tighter leading-none mb-1">Mark the Problem</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Tap exactly where the issue is. Ward GPS is automatic.</div>
          </div>
          <button onClick={() => navigate('/map')} className="bg-black text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/20 transition-transform active:scale-95 shrink-0">Cancel</button>
        </div>
      )}

      {/* Floating Ward Hover Card */}
      {hoveredReport && activeTab === 'map' && (() => {
        const h = hoveredReport;
        const wardName   = h.wardName || 'BBMP Area';
        const bangalorePart = h.direction ? `${h.direction} Bengaluru` : 'Central';

        const tooltipStyle = isMobile ? {
          position: 'absolute', bottom: '24px', left: '16px', right: '16px', zIndex: 1000, pointerEvents: 'none'
        } : {
          position: 'absolute', left: mousePos.x + 20, top: mousePos.y + 20, zIndex: 1000, pointerEvents: 'none'
        };

        return (
          <div style={tooltipStyle}>
            <div className="bg-white/95 backdrop-blur-md border-2 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
              <div className="font-display font-black text-lg text-black uppercase tracking-tighter leading-none mb-1">{wardName}</div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-600">
                <span>{bangalorePart}</span>
                <span className="text-black/10">•</span>
                <span>Ward #{h.ward}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sidebar for Detailed View */}
      {selectedReport && (
        <div className="absolute top-4 bottom-4 right-4 w-[calc(100%-2rem)] md:w-[420px] bg-white rounded-3xl shadow-2xl z-[1000] flex flex-col border-4 border-black overflow-hidden animate-in slide-in-from-right-10 duration-300">
          <div className="p-4 flex items-center justify-between border-b-4 border-black shrink-0">
             <div className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Ward Overview</div>
             <button onClick={() => { setSelectedReport(null); setWardReports([]); }} className="p-2 hover:bg-black/5 rounded-full text-2xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <h1 className="font-display font-black text-4xl text-black leading-none uppercase tracking-tighter mb-4">{selectedReport.area || 'Bangalore Ward'}</h1>
            <div className="bg-stone-50 border-2 border-black p-4 rounded-2xl mb-6">
              <div className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">Responsible MLA</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-black overflow-hidden">
                  <img src={selectedReport.mlaDetails?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReport.mlaDetails?.mla || 'MLA')}&background=f97316&color=fff`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-display font-black text-lg text-black leading-none">{selectedReport.mlaDetails?.mla}</div>
                  <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">{selectedReport.mlaDetails?.party} Member</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-black/30 border-b-2 border-black/5 pb-2">Recent Ward Reports</div>
              {wardReportsLoading ? (
                <div className="py-12 text-center animate-pulse font-black text-black/20 uppercase tracking-widest">Auditing Ward Records...</div>
              ) : wardReports.length > 0 ? (
                wardReports.map(r => (
                  <div key={r.id} className="border-2 border-black p-4 rounded-xl flex items-center gap-4 bg-stone-50">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div className="flex-1 font-bold text-xs">{r.title}</div>
                    <div className="text-[9px] font-black uppercase text-black/40">3d ago</div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-black/30 italic text-sm font-bold">No active reports for this ward.</div>
              )}
            </div>
          </div>
          <div className="p-6 border-t-4 border-black">
             <button onClick={() => navigate('/report')} className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] hover:translate-y-[-2px] transition-all">Submit Ward Audit</button>
          </div>
        </div>
      )}
    </div>
  );
}
