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
  const [mapLoaded, setMapLoaded] = useState(false); // Fix for white screen
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
  const isPickModeRef = useRef(isPickMode);

  useEffect(() => {
    isPickModeRef.current = isPickMode;
  }, [isPickMode]);

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
  // High-performance Marker Rendering using GeoJSON Layer (Handles 3000+ points smoothly)
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || viewMode !== 'map' || isPickModeRef.current) {
      if (map.current && map.current.getLayer('reports-layer')) {
        map.current.setLayoutProperty('reports-layer', 'visibility', 'none');
      }
      return;
    }

    const sourceId = 'reports-points';
    const layerId = 'reports-layer';

    // Format reports as GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: filteredReports.map((r, i) => {
        let lng = r.lng;
        let lat = r.lat;
        if (!lng || !lat) {
          lng = 77.5946 + (Math.random() - 0.5) * 0.3;
          lat = 12.9716 + (Math.random() - 0.5) * 0.3;
          r.lng = lng;
          r.lat = lat;
        }
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: { ...r, id: r.id || i }
        };
      })
    };

    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(geojson);
      map.current.setLayoutProperty(layerId, 'visibility', 'visible');
    } else {
      map.current.addSource(sourceId, { type: 'geojson', data: geojson });
      
      map.current.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 6,
            15, 14
          ],
          'circle-color': '#ffffff',
          'circle-stroke-width': 3,
          'circle-stroke-color': [
            'match',
            ['get', 'severity'],
            'critical', '#ffcc00', // Gold for contrast
            'emergency', '#ffcc00',
            'severe', '#E9C46A',
            'high', '#E9C46A',
            '#ffffff'
          ],
          'circle-opacity': 1,
          'circle-pitch-alignment': 'map'
        }
      });

      // Handle Point Click
      map.current.on('click', layerId, (e) => {
        const report = e.features[0].properties;
        handleReportClick(report);
      });

      // Pointer Cursor on Hover
      map.current.on('mouseenter', layerId, () => { map.current.getCanvas().style.cursor = 'pointer'; });
      map.current.on('mouseleave', layerId, () => { map.current.getCanvas().style.cursor = ''; });
    }
  }, [filteredReports, viewMode, isPickMode, mapLoaded]); // Added mapLoaded to fix missing markers

  // Recalculate Choropleth when reports load
  useEffect(() => {
    if (!mapLoaded || !map.current || !map.current.getSource('bbmp-wards')) return;
    
    const counts = {};
    allReports.forEach(r => {
      if (r.ward_no) counts[r.ward_no] = (counts[r.ward_no] || 0) + 1;
    });

    if (Object.keys(counts).length === 0) {
      for (let i = 1; i <= 243; i++) {
        counts[i] = Math.floor(Math.random() * 50) + 5;
      }
    }

    Object.entries(counts).forEach(([wardNo, count]) => {
      try {
        // MapLibre feature state IDs must match the promoteId type (Number in this GeoJSON)
        map.current.setFeatureState(
          { source: 'bbmp-wards', id: Number(wardNo) },
          { reportCount: count }
        );
      } catch (e) {
        console.error('Error setting feature state for ward:', wardNo, e);
      }
    });
  }, [allReports, mapLoaded]);

  // Resize map when tab switches to fix blank canvas
  useEffect(() => {
    if (activeTab === 'map' && map.current) {
      setTimeout(() => map.current.resize(), 100);
    }
  }, [activeTab]);

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
      if (reports && reports.length > 0) {
        setWardReports(reports);
      } else {
        const dummyReports = [
          { id: 'd1', title: 'Pothole on Main Road', severity: 'high', status: 'open' },
          { id: 'd2', title: 'Street light not working', severity: 'medium', status: 'open' },
          { id: 'd3', title: 'Garbage pile-up near park', severity: 'low', status: 'open' }
        ];
        setWardReports(dummyReports);
      }
      setWardReportsLoading(false);
    }
  };

  useEffect(() => {
    if (map.current) return; // Initialize only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Premium Dark-Mode Tactical style
      center: BENGALURU_CENTER,
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      minZoom: 10,
      maxBounds: BENGALURU_BOUNDS,
      antialias: true
    });

    map.current.on('load', () => {
      console.log('Map style loaded successfully');
      setMapLoaded(true);
      setTimeout(() => { 
        if (map.current) {
          map.current.resize();
          map.current.triggerRepaint();
        }
      }, 300); // Give it slightly more time to ensure container is fully painted
      
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
            
            const geoName = feature.properties.KGISWardName;
            const areaInfo = accurateAreaNames[wardNoNum] || accurateAreaNames[wardNoStr] || {};
            const rawName = geoName || areaInfo.name || `Ward ${wardNo}`;
            const cleanName = rawName.replace(/\sWard$/i, '').trim();

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
        if (map.current.getLayer('reports-layer')) {
          const reportFeatures = map.current.queryRenderedFeatures(e.point, { layers: ['reports-layer'] });
          if (reportFeatures.length > 0) return; 
        }
        
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['ward-fills'] });
        
        if (isPickModeRef.current) {
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
  }, []);

  // Sync Ward Layers (Re-apply on style load or map init)
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const addWardLayers = () => {
      const m = map.current;
      if (!m.getSource('bbmp-wards')) {
        m.addSource('bbmp-wards', {
          type: 'geojson',
          data: '/data/bangalore-wards.geojson?v=datameet_243',
          promoteId: 'KGISWardNo'
        });
      }

      if (!m.getLayer('ward-fills')) {
        m.addLayer({
          id: 'ward-fills',
          type: 'fill',
          source: 'bbmp-wards',
          paint: {
            'fill-color': [
              'case',
              ['>', ['coalesce', ['feature-state', 'reportCount'], 0], 50], '#1a472a', // Forest
              ['>', ['coalesce', ['feature-state', 'reportCount'], 0], 20], '#2d6a4f', // Deep Green
              ['>', ['coalesce', ['feature-state', 'reportCount'], 0], 5], '#40916c',  // Sea Green
              ['>', ['coalesce', ['feature-state', 'reportCount'], 0], 0], '#52b788',  // Mint
              '#11261d' // Subtle Forest Green fallback (instead of pitch black)
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.8,
              0.4
            ]
          }
        });
      }

      if (!m.getLayer('ward-borders')) {
        m.addLayer({
          id: 'ward-borders',
          type: 'line',
          source: 'bbmp-wards',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#fbbf24', // Amber highlight
              '#166534'  // Dark green border
            ],
            'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 0.5]
          }
        });
      }
    };

    if (map.current.isStyleLoaded()) {
      addWardLayers();
    } else {
      map.current.on('style.load', addWardLayers);
    }
    
    // Final resize trigger
    const timer = setTimeout(() => {
      if (map.current) {
        map.current.resize();
        map.current.triggerRepaint();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [mapLoaded]);



  // Handle global report fetch - Decoupled from map initialization
  useEffect(() => {
    getReports().then(data => {
      console.log(`Fetched ${data?.length || 0} reports from database.`);
      setAllReports(data || []);
    });
  }, []);

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
    <div className="flex h-[calc(100vh-80px)] w-full relative overflow-hidden bg-[#0a0a0a]">
      
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
          className={`absolute inset-0 transition-opacity duration-500 bg-[#05110a] ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`} 
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
                    onClick={() => { 
                      setActiveTab('map'); 
                      handleWardAction(ward, 'click');
                      
                      // Fly to the ward if possible
                      if (wardGeoJson.current && map.current) {
                        const feature = wardGeoJson.current.features.find(f => Number(f.properties.KGISWardNo) === Number(ward.ward));
                        if (feature) {
                          const centroid = turf.centroid(feature);
                          map.current.flyTo({ center: centroid.geometry.coordinates, zoom: 13.5, essential: true });
                        }
                      }
                    }}
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
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600">
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
          {String(selectedReport.id).startsWith('ward-') ? (
            <>
              {/* WARD OVERVIEW UI */}
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
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">{selectedReport.mlaDetails?.party} Member</div>
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
            </>
          ) : (
            <>
              {/* ISSUE REPORT CARD UI (Namma Kasa Style) */}
              <div className="p-4 flex items-center justify-between border-b-4 border-black shrink-0">
                 <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${selectedReport.status === 'resolved' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                    {selectedReport.status || 'Pending'}
                 </div>
                 <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-black/5 rounded-full text-2xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {selectedReport.photo_url ? (
                  <div className="w-full h-48 border-b-4 border-black bg-stone-200">
                    <img src={selectedReport.photo_url} alt="Issue evidence" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-32 border-b-4 border-black bg-stone-200 flex items-center justify-center">
                    <span className="font-black text-black/20 uppercase tracking-widest">No Photo Evidence</span>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">{selectedReport.category || 'Issue'}</div>
                  <h1 className="font-display font-black text-3xl text-black leading-none uppercase tracking-tighter mb-4">{selectedReport.title || 'Untitled Report'}</h1>
                  
                  <div className="bg-stone-50 border-2 border-black p-4 rounded-2xl mb-6">
                    <p className="text-sm font-bold text-black/70 mb-4">{selectedReport.description || 'No description provided.'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-black/10">
                      <div>
                        <div className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Location</div>
                        <div className="font-bold text-xs">{selectedReport.area} (Ward {selectedReport.ward})</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Upvotes</div>
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span className="text-orange-500">↑</span> {selectedReport.upvotes || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black p-4 rounded-2xl">
                    <div className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">Assigned To</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-200 border-2 border-black overflow-hidden flex-shrink-0">
                        <img src={selectedReport.mlaDetails?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReport.mlaDetails?.mla || 'Official')}&background=000&color=fff`} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-display font-black text-sm text-black leading-none">{selectedReport.mlaDetails?.mla || selectedReport.authority || 'Unknown'}</div>
                        <div className="text-[9px] font-bold text-black/60 uppercase tracking-widest mt-1">{selectedReport.mlaDetails?.party ? `${selectedReport.mlaDetails.party} MLA` : 'Responsible Authority'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t-4 border-black">
                 <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=Look at this unresolved issue in ${selectedReport.area}! @BBMPCOMM @CMofKarnataka&url=${window.location.href}`)} className="w-full bg-[#1DA1F2] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                   Escalate on X
                 </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
