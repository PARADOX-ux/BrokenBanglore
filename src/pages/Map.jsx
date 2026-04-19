import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON, Popup } from 'react-leaflet';
import * as turf from '@turf/centroid';
import L from 'leaflet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categories, sampleReports, wardMLAData, completeMLAList, getMPByConstituency } from '../data/wardData';
import { getReports, upvoteReport } from '../lib/reportsDb';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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




// NammaKasa-style color scale: Red, Light Red, Creamish White
const getWardColor = (count) => {
  if (count >= 15) return '#7f1d1d'; // Crimson/Maroon
  if (count >= 10) return '#b91c1c'; // Dark Red
  if (count >= 5)  return '#ef4444'; // Red
  if (count >= 1)  return '#fecaca'; // Light Red
  return '#fdfbf6';                  // Creamish White (Default/Clean)
};

const wardStyle = (feature, reportCounts = {}) => {
  const wardNo = feature.properties.KGISWardNo || feature.properties.ward || 1;
  const count = reportCounts[wardNo] || 0;
  
  return {
    fillColor: getWardColor(count),
    fillOpacity: count > 0 ? 0.7 : 0.4,
    weight: 1,
    opacity: 0.3,
    color: '#0a1f14',
  };
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
      mlaDetails: mlaData,
    });
    setWardReports([]);
    setWardReportsLoading(true);
    const reports = await getReports({ ward_no: wardNo });
    setWardReports(reports);
    setWardReportsLoading(false);
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
      
      // Aggregate counts for ward coloring
      const counts = {};
      reports.forEach(r => {
        if (r.ward_no) {
          counts[r.ward_no] = (counts[r.ward_no] || 0) + 1;
        }
      });
      setReportCounts(counts);
    });
  }, []);

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
      const fallbackIdx = Number(wardNo) % completeMLAList.length;
      mlaData = completeMLAList[fallbackIdx] || completeMLAList[0];
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
      const fallbackIdx = Number(wardNo) % completeMLAList.length;
      const baseMla = completeMLAList[fallbackIdx] || completeMLAList[0];
      const mpInfo = getMPByConstituency(baseMla.constituency);
      mlaData = { ...baseMla, ...mpInfo };
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
         style={(feature) => wardStyle(feature, reportCounts)}
         onEachFeature={onEachWard}
      />
    );
  }, [geoJsonData, reportCounts]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full relative">
      
      {/* Pick Mode Banner (replacing filter bar) */}
      {isPickMode ? (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] bg-red-600 text-white p-5 rounded-2xl shadow-2xl border-4 border-black flex gap-6 items-center w-[90%] max-w-lg">
          <div className="text-3xl animate-bounce">📍</div>
          <div className="flex-1">
            <div className="font-display font-black text-xl uppercase tracking-tighter leading-none mb-1">Select the Problem Spot</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Tap exactly where the issue is. We log GPS automatically.</div>
          </div>
          <button onClick={() => setIsPickMode(false)} className="bg-black text-white px-3 py-1.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-white/20 transition-transform active:scale-95 shrink-0">Cancel</button>
        </div>
      ) : (
        <div className="absolute top-4 left-4 right-4 z-[400] bg-white border-2 md:border-4 border-black rounded-lg md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 md:p-3 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full md:w-auto bg-black text-white text-[9px] md:text-[11px] font-black outline-none cursor-pointer px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl uppercase tracking-widest border-2 border-black"
            >
              <option value="all">ALL AUDITS</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label.toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-4 md:gap-6 items-center flex-wrap pt-2 md:pt-0 md:pl-6 border-t-2 md:border-t-0 md:border-l-4 border-black/10 text-[9px] md:text-[10px] font-black text-black uppercase tracking-widest w-full md:w-auto">
            <div className="flex items-center gap-2 bg-[#0a1f14] text-gold px-2 md:px-3 py-1 md:py-1.5 rounded-lg border-2 border-black">
              <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-white animate-pulse"></span> 
              <span>243 <span className="hidden md:inline">Wards</span> Mapped</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 inline-block w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-red-600"></span>
              <span className="opacity-40">FEED:</span>
              <span>{allReports.filter(r => r.status === 'open').length} ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Layer */}
      <div className="flex-1 w-full h-full z-10">
        <MapContainer
            center={[12.9716, 77.5946]}
            zoom={10.2}
            minZoom={9}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />


          {geoJsonLayer}
          
          {/* NammaKasa Style: Ward-Level Count Bubbles */}
          {geoJsonData && geoJsonData.features.map((feature, idx) => {
            const wardNo = feature.properties.KGISWardNo || feature.properties.ward || 1;
            const count = reportCounts[wardNo] || 0;
            if (count === 0) return null;
            
            // Calculate center using turf
            const c = turf.default(feature);
            const pos = [c.geometry.coordinates[1], c.geometry.coordinates[0]];

            return (
              <Marker 
                key={`bubble-${wardNo}-${idx}`}
                position={pos}
                icon={L.divIcon({
                  className: 'count-bubble',
                  html: `
                    <div style="
                      background-color: ${getWardColor(count)}; 
                      width: ${32 + Math.min(count * 2, 30)}px; 
                      height: ${32 + Math.min(count * 2, 30)}px; 
                      border: 3px solid white; 
                      border-radius: 50%; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      color: white; 
                      font-weight: 900; 
                      font-size: ${12 + (count > 9 ? 4 : 0)}px;
                      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                      cursor: pointer;
                    ">
                      ${count}
                    </div>
                  `,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
                })}
              />
            );
          })}
          
          {/* Render real markers for all global reports: Subtle dots deep in the background */}
          {!isPickMode && allReports.map(report => (
            <Marker 
              key={report.id || report.ref_no} 
              position={[report.lat, report.lng]}
              icon={L.divIcon({
                className: 'custom-div-icon opacity-30',
                html: `<div style="background-color: ${report.severity === 'emergency' ? '#ef4444' : report.severity === 'high' ? '#f97316' : '#fbbf24'}; width: 8px; height: 8px; border: 1.5px solid white; border-radius: 50%;"></div>`,
                iconSize: [8, 8],
                iconAnchor: [4, 4]
              })}
            />
          ))}

          {/* Pick mode: capture bare-map clicks + show dropped pin */}
          {isPickMode && (
            <MapClickPicker onPick={(latlng) => {
              setPickedPin(latlng);
              setPickedWard(null); // bare map click, no ward data
            }} />
          )}
          {isPickMode && pickedPin && (
            <Marker position={[pickedPin.lat, pickedPin.lng]} />
          )}

        </MapContainer>
      </div>

      {/* In pick mode: Bottom confirm card; in normal mode: bottom nav buttons */}
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
         <a href="/" className="px-5 py-3 bg-white text-forest border border-forest/10 rounded-full font-bold shadow-lg flex items-center justify-center hover:bg-forest/5 transition-transform hover:scale-105">
           Home
         </a>
         <a href="/report" className="px-6 py-3 bg-forest text-gold rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-black transition-transform hover:scale-105">
           Scan QR to Report
         </a>
      </div>
      )}

      {/* Removed Bottom Left Audit Box as requested */}

      {/* The nammakasa-style Floating Accountability Card */}
      {(selectedReport || hoveredReport) && (() => {
        const activeReport = selectedReport || hoveredReport;
        return (
        <div 
          className="absolute bottom-10 left-4 md:left-8 w-[calc(100%-32px)] md:w-[320px] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[500] flex flex-col border-2 border-black overflow-hidden transform transition-all animate-in slide-in-from-bottom-8 duration-300"
          onMouseEnter={() => {
            // Keep the hover report active if mouse is over the card
            if (!selectedReport && hoveredReport) setHoveredReport(hoveredReport);
          }}
        >
          
          {/* Card Header */}
          <div className="flex justify-between items-center p-3 border-b border-forest/10 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full bg-forest ${!selectedReport ? 'animate-pulse' : ''}`}></div>
              <span className="uppercase text-[10px] font-bold tracking-wider text-forest">
                {selectedReport ? 'Selected' : 'Peeking'} Ward #{activeReport.ward}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedReport(null); setHoveredReport(null); setWardReports([]); }} className="text-forest/30 hover:text-forest">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <div className="p-5">
              {/* Ward name: NammaKasa Format */}
              <h2 className="font-display font-black text-sm uppercase tracking-widest text-[#1a3a2a] mb-1 leading-tight">{activeReport.title}</h2>
              
              {/* MLA + MP info */}
              <div className="bg-[#1a3a2a] text-white rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-white/40 uppercase tracking-widest text-[9px]">MLA (State)</div>
                  <div className="font-bold text-sm leading-tight break-words">{activeReport.mlaDetails?.mla || '—'}</div>
                  <div className="text-white/50 text-[9px] uppercase font-black">{activeReport.mlaDetails?.party}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase tracking-widest text-[9px]">MP (Lok Sabha)</div>
                  <div className="font-bold text-sm leading-tight break-words">{activeReport.mlaDetails?.mp || '—'}</div>
                  <div className="text-white/50 text-[9px] uppercase font-black">{activeReport.mlaDetails?.mpConstituency}</div>
                </div>
              </div>

              {/* Report count summary */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-forest/5 rounded-xl p-2.5 text-center border border-forest/10">
                  <div className="font-display font-bold text-2xl text-forest">
                    {activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.length || 0)}
                  </div>
                  <div className="text-[9px] font-bold uppercase text-forest/40">Total</div>
                </div>
                <div className="bg-gold/10 rounded-xl p-2.5 text-center border border-gold/20">
                  <div className="font-display font-bold text-2xl text-forest">
                    {activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.filter(r => r.status === 'open').length || 0)}
                  </div>
                  <div className="text-[9px] font-bold uppercase text-forest/40">Open</div>
                </div>
                <div className="bg-bright/10 rounded-xl p-2.5 text-center border border-bright/20">
                  <div className="font-display font-bold text-2xl text-bright">
                    {activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.filter(r => r.status === 'resolved').length || 0)}
                  </div>
                  <div className="text-[9px] font-bold uppercase text-bright/60">Fixed</div>
                </div>
              </div>

              {/* Reports list */}
              <div className="mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a3a2a]/50 mb-3">
                  {wardReportsLoading ? 'Loading complaints…' : wardReports.length > 0 ? `${wardReports.length} Complaint${wardReports.length > 1 ? 's' : ''} in this ward` : 'No complaints filed yet'}
                </h3>

                {wardReportsLoading && (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-16 bg-ash/20 rounded-xl animate-pulse" />)}
                  </div>
                )}

                {!wardReportsLoading && wardReports.length === 0 && (
                  <div className="bg-forest/5 border-2 border-dashed border-forest/15 rounded-xl p-5 text-center">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-xs font-bold text-[#1a3a2a]/50">No complaints yet in this ward.</p>
                    <p className="text-[10px] text-[#1a3a2a]/30 mt-1">Be the first to report an issue.</p>
                  </div>
                )}

                {!wardReportsLoading && wardReports.length > 0 && (
                  <div className="space-y-2">
                    {wardReports.slice(0, 5).map(report => (
                      <div key={report.id || report.ref_no} className="bg-white border border-[#1a3a2a]/10 rounded-xl p-3 hover:border-forest transition-colors">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[9px] font-bold bg-forest/10 text-forest px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                {report.category || 'General'}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {report.status === 'resolved' ? '✓ Fixed' : '● Open'}
                              </span>
                            </div>
                            <p className="font-bold text-xs text-[#1a3a2a] leading-tight line-clamp-2">
                              {report.title}
                            </p>
                            {report.area_name && <p className="text-[9px] text-[#1a3a2a]/40 font-medium mt-0.5">📍 {report.area_name}</p>}
                          </div>
                          <button
                            onClick={() => upvoteReport(report.id || report.ref_no).then(() => getReports({ ward_no: activeReport.ward }).then(setWardReports))}
                            className="w-10 h-10 flex flex-col items-center justify-center rounded-xl bg-forest/5 hover:bg-forest hover:text-gold text-forest font-bold text-xs transition-all shrink-0"
                          >
                            <span>▲</span>
                            <span>{report.upvotes || 0}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {wardReports.length > 5 && (
                      <p className="text-xs text-center text-[#1a3a2a]/40 font-bold py-1">
                        +{wardReports.length - 5} more complaints in this ward
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-forest/10 bg-white flex flex-col gap-2 shrink-0">
            <a
              href={`/report?ward=${activeReport.ward}`}
              className="w-full bg-forest hover:bg-[#1a3a2a] text-gold py-3 rounded-lg font-bold text-sm text-center shadow-lg transition-colors"
            >
              Report a Problem Here
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Ward ${activeReport.ward} has ${wardReports.length} unresolved civic complaints. ${activeReport.mlaDetails?.mla} (MLA) and ${activeReport.mlaDetails?.mp} (MP) — please act. @NammaKarnataka @BBMPgov #BrokenBengaluru`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-black/5 hover:bg-black hover:text-white text-[#1a3a2a] py-2.5 rounded-lg font-bold text-sm text-center transition-colors border border-black/10"
            >
              Tweet MLA + MP about this Ward
            </a>
            <div className="text-center text-[9px] text-forest/40 font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-bright rounded-full"></span> Citizen-verified data
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
