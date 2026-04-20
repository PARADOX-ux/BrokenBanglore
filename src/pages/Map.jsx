import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON, Popup } from 'react-leaflet';
import * as turf from '@turf/centroid';
import L from 'leaflet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categories, sampleReports, wardMLAData, completeMLAList, getMPByConstituency, getMPByZone } from '../data/wardData';
import { getReports, upvoteReport } from '../lib/reportsDb';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Bengaluru Strict Bounds
const BENGALURU_CENTER = [12.9716, 77.5946];
const BENGALURU_BOUNDS = [
  [12.8000, 77.4000], // South West - Tighter
  [13.1500, 77.8000]  // North East - Tighter
];

// Captures bare-map clicks (not on ward polygons) for pick mode
function MapClickPicker({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng); }
  });
  return null;
}

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
// Purged custom icons to remove dots/pins logic completely
// Dots and Pins logic removed for pure Ward Area interaction.




// Reverted to original subtle green styling
const wardStyle = {
  fillColor: '#2B9348',
  fillOpacity: 0.05,
  weight: 1,
  opacity: 0.2,
  color: '#2B9348',
};

export default function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPickMode = searchParams.get('pickMode') === 'true';

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [pickedPin, setPickedPin] = useState(null);        // lat/lng picked in pick mode
  const [pickedWard, setPickedWard] = useState(null);      // ward data from click
  const [wardReports, setWardReports] = useState([]);
  const [wardReportsLoading, setWardReportsLoading] = useState(false);
  const [hoveredData, setHoveredData] = useState(null);
  const [hoveredReport, setHoveredReport] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [reportCounts, setReportCounts] = useState({}); // Pre-calculated counts for coloring
  const [viewMode, setViewMode] = useState('map');      // 'map' | 'list'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const geoJsonRef = useRef(null);

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

  // Pick mode: clicking a ward also sets the pin
  const handlePickModeWardClick = (e, wardProps) => {
    const center = e.target.getBounds().getCenter();
    const wardNo = wardProps.KGISWardNo || wardProps.ward || 1;
    let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
    if (!mlaData) {
      mlaData = completeMLAList[Number(wardNo) % completeMLAList.length] || completeMLAList[0];
    }
    setPickedPin({ lat: center.lat, lng: center.lng });
    setPickedWard({ ward: wardNo, name: wardProps.KGISWardName || wardProps.name, mla: mlaData });
  };

  // Normal mode: ward click → load reports for ward
  const handleNormalWardClick = async (e, wardProps) => {
    const wardNo = wardProps.KGISWardNo || wardProps.ward || 1;
    let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
    if (!mlaData) {
      const baseMla = completeMLAList[Number(wardNo) % completeMLAList.length] || completeMLAList[0];
      mlaData = { ...baseMla, ...getMPByConstituency(baseMla.constituency) };
    }
    setSelectedReport({
      id: `ward-${wardNo}`,
      title: `${wardProps.KGISWardName || wardProps.name} Ward`,
      category: 'geographical area',
      catColor: mlaData.partyColor || '#2B9348',
      area: `BBMP Ward #${wardNo}`,
      ward: wardNo,
      authority: 'Bruhat Bengaluru Mahanagara Palike',
      status: 'pending',
      mlaDetails: {
        ...mlaData,
        mla: mlaData.mla || mlaData.name || 'BBMP Ward Officer'
      },
    });
    setWardReports([]);
    setWardReportsLoading(true);
    const reports = await getReports({ ward_no: wardNo });
    setWardReports(reports);
    setWardReportsLoading(false);
  };

  const handleReportClick = (report) => {
    // Attempt metadata recovery if database fields are missing
    let recoveredWard = null;
    
    // 1. Precise lookup by Ward Number
    if (report.ward_no) {
      recoveredWard = wardMLAData.find(w => Number(w.ward) === Number(report.ward_no));
    }

    // 2. Fuzzy lookup by Area Name (if no ward match)
    if (!recoveredWard && report.area_name) {
      recoveredWard = wardMLAData.find(w => 
        w.name.toLowerCase().includes(report.area_name.toLowerCase()) || 
        report.area_name.toLowerCase().includes(w.name.toLowerCase()) ||
        w.constituency.toLowerCase().includes(report.area_name.toLowerCase())
      );
    }

    // 3. Last resort: Lookup by description mentions
    if (!recoveredWard && report.description) {
      recoveredWard = wardMLAData.find(w => report.description.toLowerCase().includes(w.name.toLowerCase()));
    }

    // 4. Parliamentary Mapping (The Core Fix)
    const constituency = report.mla_constituency || recoveredWard?.constituency || report.area_name || 'Bengaluru';
    const mpData = getMPByConstituency(constituency);

    const mlaDetails = {
      mla: report.mla_name || recoveredWard?.mla || 'In Audit Zone',
      party: report.mla_party || recoveredWard?.party || 'BBMP',
      mp: report.mp_name || recoveredWard?.mp || mpData.mp,
      mpConstituency: report.mp_constituency || recoveredWard?.mpConstituency || mpData.mpConstituency,
      authority: report.authority || recoveredWard?.authority || 'BBMP'
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


  useEffect(() => {
    fetch('/data/bangalore-wards.geojson?v=datameet_243')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error("Could not load wards GeoJSON", err));

    // Fetch all global reports to show markers and calculate counts
    getReports().then(data => {
      const reports = data || [];
      setAllReports(reports);
      
      const counts = {};
      reports.forEach(r => {
        if (r.ward_no) {
          counts[r.ward_no] = (counts[r.ward_no] || 0) + 1;
        }
      });
      setReportCounts(counts);
    });
  }, []);

  // Filtered reports based on active dropdowns
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      const severityMatch = severityFilter === 'all' || (report.severity && report.severity.toLowerCase() === severityFilter.toLowerCase());
      const statusMatch = statusFilter === 'all' || (report.status && report.status.toLowerCase() === statusFilter.toLowerCase());
      return severityMatch && statusMatch;
    });
  }, [allReports, severityFilter, statusFilter]);

  // NammaKasa Area Interaction Handlers
  // Fix map hover interaction
  const highlightWard = (e) => {
    const layer = e.target;
    layer.setStyle({
      fillColor: '#55A630',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '3, 6',
      color: '#E9C46A',
    });
    
    // Removed bringToFront to prevent event bubbling issues that cause 'stuck' highlights
    
    const wardProps = layer.feature.properties;
    const wardNo = wardProps.KGISWardNo || wardProps.ward || 1;
    
    // Deterministic fallback system - if ward isn't explicitly defined, grab a stable MLA from the main list based on Modulo
    let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
    if (!mlaData) {
      const zone = wardProps.KGISWardName?.split('(')[1]?.replace(')', '') || 'Central';
      const fallbackMla = completeMLAList.find(m => m.constituency === zone) || completeMLAList[Number(wardNo) % completeMLAList.length];
      mlaData = { ...fallbackMla, ...getMPByZone(zone) };
    }
    
    setHoveredData({ 
      area: wardProps.KGISWardName || wardProps.name, 
      ward: wardNo,
      mla: mlaData
    });

    const zone = wardProps.KGISWardName ? (wardProps.KGISWardName.split('(')[1]?.replace(')', '') || 'Central') : 'Central';

    setHoveredReport({
      id: `ward-${wardNo}`,
      title: `${wardProps.KGISWardName || wardProps.name} | Ward #${wardNo} | ${zone}`,
      category: "geographical area",
      area: `Ward #${wardNo}`,
      ward: wardNo,
      mlaDetails: mlaData
    });

    // Dynamically load reports for comparison while hovering
    getReports({ ward_no: wardNo }).then(setWardReports);
  };

  const resetWard = (e) => {
    const layer = e.target;
    if (geoJsonRef.current) {
       geoJsonRef.current.resetStyle(layer);
    }
    layer.setStyle(wardStyle);
    setHoveredData(null);
    setHoveredReport(null);
  };

  const handleWardClick = async (e) => {
    const wardProps = e.target.feature.properties;
    const wardNo = wardProps.KGISWardNo || wardProps.ward || 1;
    
    let mlaData = wardMLAData.find(m => Number(m.ward) === Number(wardNo));
    if (!mlaData) {
      const zone = wardProps.KGISWardName?.split('(')[1]?.replace(')', '') || 'Central';
      const fallbackMla = completeMLAList.find(m => m.constituency === zone) || completeMLAList[Number(wardNo) % completeMLAList.length];
      mlaData = { ...fallbackMla, ...getMPByZone(zone) };
    }
    
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

    // Load reports for this ward asynchronously
    setWardReports([]);
    setWardReportsLoading(true);
    const reports = await getReports({ ward_no: wardNo });
    setWardReports(reports);
    setWardReportsLoading(false);
  };

  const onEachWard = (feature, layer) => {
    layer.on({
      mouseover: highlightWard,
      mouseout: resetWard,
      click: (e) => {
        const wardProps = e.target.feature.properties;
        if (isPickMode) {
          handlePickModeWardClick(e, wardProps);
        } else {
          handleNormalWardClick(e, wardProps);
        }
      }
    });
  };

  // Cache the GeoJSON layer to prevent React state changes (like hovering) from causing Leaflet to re-mount the multipolygons and flicker interactions.
  const geoJsonLayer = useMemo(() => {
    if (!geoJsonData) return null;
    return (
      <GeoJSON 
         ref={geoJsonRef}
         data={geoJsonData} 
         style={wardStyle}
         onEachFeature={onEachWard}
      />
    );
  }, [geoJsonData]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full relative">
      
      {/* Namma Kasa Style Filter Header */}
      {!isPickMode && (
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col gap-3 pointer-events-none">
          {/* Top Row: Filters and Toggles (pointer-events-auto to keep them interactive) */}
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
               Bengaluru Only Map
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
          <button onClick={() => setIsPickMode(false)} className="bg-black text-white px-3 py-1.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-white/20 transition-transform active:scale-95 shrink-0">Cancel</button>
        </div>
      )}

      {/* Main Content: Conditional Map or List */}
      <div className="flex-1 w-full h-full z-10 bg-black">
        {viewMode === 'map' ? (
          <MapContainer 
            center={BENGALURU_CENTER} 
            zoom={12} 
            minZoom={11}
            maxBounds={BENGALURU_BOUNDS}
            maxBoundsViscosity={1.0}
            attributionControl={false}
            style={{ height: '100%', width: '100%', background: '#F8F9FA' }}
            className="z-0"
            zoomControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {geoJsonLayer}
            
            {/* Render real markers for filtered reports */}
            {!isPickMode && filteredReports.map(report => (
              <Marker 
                key={report.id || report.ref_no} 
                position={[report.lat, report.lng]}
                eventHandlers={{ click: () => handleReportClick(report) }}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="background-color: ${report.category === 'garbage' ? '#2B9348' : report.severity === 'critical' || report.severity === 'emergency' ? '#ef4444' : report.severity === 'severe' || report.severity === 'high' ? '#f97316' : '#fbbf24'}; width: ${report.category === 'garbage' ? '18px' : '14px'}; height: ${report.category === 'garbage' ? '18px' : '14px'}; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 8px;">${report.category === 'garbage' ? '♻️' : ''}</div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              />
            ))}

            {isPickMode && (
              <MapClickPicker onPick={(latlng) => {
                setPickedPin(latlng);
                setPickedWard(null);
              }} />
            )}
            {isPickMode && pickedPin && <Marker position={[pickedPin.lat, pickedPin.lng]} />}
          </MapContainer>
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
                        <div key={report.id || report.ref_no} className="bg-white border-[4px] border-black rounded-2xl p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[15px_15px_0px_0px_rgba(255,182,0,1)] transition-all cursor-pointer group" onClick={() => { setViewMode('map'); navigate(`/map?ward=${report.ward_no}`); }}>
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
                           <h3 className="font-display font-black text-2xl text-black mb-4 leading-tight group-hover:underline underline-offset-4 decoration-4">{report.title}</h3>
                           {report.area_name && <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mb-6 flex items-center gap-2 bg-ash/10 w-fit px-3 py-1 rounded-lg">📍 {report.area_name}</p>}
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
            onMouseEnter={() => { if (!selectedReport && hoveredReport) setHoveredReport(hoveredReport); }}
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
              {/* Stacked Information Hierarchy */}
              <div className="flex flex-col gap-0.5 mb-4">
                <span className="font-display font-medium text-[10px] uppercase tracking-[0.2em] text-black/40">Civic Audit Details</span>
                <h2 className="font-display font-bold text-lg text-black leading-none tracking-tighter">
                  {activeReport.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="font-nav font-black text-[10px] bg-forest text-gold px-2 py-0.5 rounded-md uppercase tracking-widest">
                    {activeReport.ward ? `Ward #${activeReport.ward}` : 'GPS Assigned Location'}
                  </span>
                  {activeReport.mlaDetails?.constituency && (
                    <span className="font-nav font-bold text-[10px] bg-black text-white px-2 py-0.5 rounded-md uppercase tracking-widest">
                      AC: {activeReport.mlaDetails.constituency}
                    </span>
                  )}
                  <span className="font-nav font-bold text-[10px] text-black/30 uppercase tracking-[0.1em]">
                    Type: {activeReport.category || 'General Audit'}
                  </span>
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

                {/* Full Description for selected reports */}
                {selectedReport && activeReport.description && (
                  <div className="mb-6 bg-cream/30 p-4 rounded-xl border border-forest/10 italic text-sm text-black/70">
                    "{activeReport.description}"
                  </div>
                )}
                <div className="bg-[#1a3a2a] text-white rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-xs border-b border-forest/10">
                  <button 
                    onClick={() => navigate(`/accountability?search=${encodeURIComponent(activeReport.mlaDetails?.mla)}`)}
                    className="text-left hover:bg-white/10 p-1 rounded transition-colors group"
                  >
                    <div className="text-white/40 uppercase tracking-widest text-[9px] group-hover:text-gold transition-colors">MLA (State) →</div>
                    <div className="font-bold text-sm leading-tight break-words text-white group-hover:text-gold">
                      {activeReport.mlaDetails?.mla && activeReport.mlaDetails.mla !== 'In Audit Zone' 
                        ? activeReport.mlaDetails.mla 
                        : (wardMLAData.find(w => Number(w.ward) === Number(activeReport.ward))?.mla || 'BBMP Authority')
                      }
                    </div>
                    <div className="text-white/50 text-[9px] uppercase font-black">{activeReport.mlaDetails?.party || 'KLA'}</div>
                  </button>
                  <button 
                    onClick={() => navigate(`/accountability?search=${encodeURIComponent(activeReport.mlaDetails?.mp)}`)}
                    className="text-left hover:bg-white/10 p-1 rounded transition-colors group"
                  >
                    <div className="text-white/40 uppercase tracking-widest text-[9px] group-hover:text-gold transition-colors">MP (Lok Sabha) →</div>
                    <div className="font-bold text-sm leading-tight break-words text-white group-hover:text-gold">
                      {activeReport.mlaDetails?.mp && activeReport.mlaDetails.mp !== 'Bengaluru'
                        ? activeReport.mlaDetails.mp 
                        : (getMPByConstituency(activeReport.mlaDetails?.constituency || activeReport.area || '').mp)
                      }
                    </div>
                    <div className="text-white/50 text-[9px] uppercase font-black">{activeReport.mlaDetails?.mpConstituency}</div>
                  </button>
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
