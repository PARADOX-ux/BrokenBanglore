import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON, Popup } from 'react-leaflet';
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




// Extracted globally so reference never changes, preventing React Leaflet redraws
const wardStyle = {
  fillColor: '#07170f',
  fillOpacity: 0.05,
  weight: 1.5,
  opacity: 0.1,
  color: '#07170f',
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

    // Fetch all global reports to show markers
    getReports().then(data => {
      setAllReports(data || []);
    });
  }, []);

  // NammaKasa Area Interaction Handlers
  // Fix map hover interaction
  const highlightWard = (e) => {
    const layer = e.target;
    layer.setStyle({
      fillColor: '#38b000',
      fillOpacity: 0.2,
      weight: 3,
      dashArray: '',
      color: '#f4d35e',
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

    setHoveredReport({
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
         style={wardStyle}
         onEachFeature={onEachWard}
      />
    );
  }, [geoJsonData]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full relative">
      
      {/* Pick Mode Banner (replacing filter bar) */}
      {isPickMode ? (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] glass-dark text-white p-6 rounded-3xl shadow-2xl border border-white/10 flex gap-6 items-center w-[95%] max-w-lg">
          <div className="text-3xl animate-bounce">📍</div>
          <div className="flex-1">
            <div className="font-display font-black text-xl uppercase tracking-tighter leading-none mb-1">Select the Problem Spot</div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Tap exactly where the issue is.</div>
          </div>
          <button onClick={() => setIsPickMode(false)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0">Cancel</button>
        </div>
      ) : (
        <div className="absolute top-8 left-8 right-8 z-[400] glass rounded-3xl premium-shadow p-3 flex flex-col md:flex-row gap-4 items-center">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full md:w-auto bg-forest text-gold text-[11px] font-black outline-none cursor-pointer px-6 py-3 rounded-2xl uppercase tracking-[0.2em] shadow-lg"
            >
              <option value="all">SITUATION REPORT: ALL</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label.toUpperCase()}</option>
              ))}
            </select>
          
          <div className="flex gap-8 items-center flex-wrap pt-2 md:pt-0 md:pl-8 border-t md:border-t-0 md:border-l border-forest/10 text-[10px] font-black text-forest uppercase tracking-[0.2em] w-full md:w-auto">
            <div className="flex items-center gap-3 bg-forest text-gold px-4 py-2 rounded-xl shadow-lg shadow-forest/10">
              <span className="w-2 h-2 rounded-full bg-bright animate-pulse"></span> 
              <span>AUDITING 243 WARDS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-bright inline-block w-2.5 h-2.5 rounded-full bg-bright"></span>
              <span className="opacity-40">FEED:</span>
              <span>{allReports.filter(r => r.status === 'open').length} ACTIVE NODES</span>
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
          
          {/* Render real markers for all global reports with safe coordinate checks */}
          {!isPickMode && allReports.filter(r => r.lat && r.lng).map(report => (
            <Marker 
              key={report.id || report.ref_no} 
              position={[report.lat, report.lng]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${report.severity === 'emergency' ? '#ef4444' : report.severity === 'high' ? '#f97316' : '#fbbf24'}; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              })}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className="text-[10px] font-bold uppercase text-forest/50 mb-1">{report.category}</div>
                  <div className="font-bold text-xs mb-1">{report.title}</div>
                  {report.photo && (
                    <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-ash/20 border border-ash/30">
                      <img src={report.photo} alt="evidence" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {report.status === 'resolved' ? 'Fixed' : 'Open'}
                    </span>
                  </div>
                  {(() => {
                    const mla = wardMLAData.find(m => Number(m.ward) === Number(report.ward_no));
                    return mla && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ash/20">
                        <img src={mla.photo} className="w-6 h-6 rounded-full object-cover" alt="mla" />
                        <span className="text-[9px] font-bold text-forest">{mla.mla} (MLA)</span>
                      </div>
                    );
                  })()}
                  <div className="mt-2 text-center">
                    <button 
                      onClick={() => navigate(`/map?ward=${report.ward_no}`)}
                      className="text-[9px] font-bold text-forest hover:underline bg-forest/5 px-3 py-1 rounded-full w-full"
                    >View Full Ward Audit →</button>
                  </div>
                </div>
              </Popup>
            </Marker>
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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-md">
          {pickedPin ? (
            <div className="glass p-6 rounded-[2.5rem] premium-shadow border border-white flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-forest rounded-2xl flex items-center justify-center text-gold shadow-lg shrink-0">📍</div>
                <div>
                  <p className="font-display font-black text-forest text-lg uppercase tracking-tighter leading-tight">
                    {pickedWard?.name ? `Ward ${pickedWard.ward}: ${pickedWard.name}` : 'Strategic Pinned Point'}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-forest/40">
                    {pickedWard?.mla ? `Jurisdiction: ${pickedWard.mla.mla}` : `${pickedPin.lat.toFixed(6)}, ${pickedPin.lng.toFixed(6)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={confirmPick}
                className="w-full bg-bright text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-transform shadow-2xl shadow-bright/20"
              >
                Confirm Intelligence Point
              </button>
            </div>
          ) : (
            <div className="glass p-6 rounded-full text-center premium-shadow border border-white">
              <p className="text-forest/60 font-black uppercase tracking-[0.2em] text-[10px]">
                Target the problem area on visual map
              </p>
            </div>
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
          className="absolute top-24 bottom-8 right-8 left-8 md:left-auto max-w-none md:max-w-[400px] glass rounded-[2.5rem] premium-shadow z-[500] flex flex-col border border-white overflow-hidden transform transition-all animate-in slide-in-from-right-12 duration-500"
          onMouseEnter={() => {
            // Keep the hover report active if mouse is over the card
            if (!selectedReport && hoveredReport) setHoveredReport(hoveredReport);
          }}
        >
          
          {/* Card Header */}
          <div className="flex justify-between items-center px-8 py-4 border-b border-forest/5 bg-white/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full bg-bright shadow-[0_0_10px_rgba(56,176,0,1)] ${!selectedReport ? 'animate-pulse' : ''}`}></div>
              <span className="uppercase text-[10px] font-black tracking-[0.2em] text-forest/40">
                {selectedReport ? 'Intelligence Area' : 'Rapid Scan'} #{activeReport.ward}
              </span>
            </div>
            <button onClick={() => { setSelectedReport(null); setHoveredReport(null); setWardReports([]); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-forest/5 text-forest/20 hover:text-forest transition-colors text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Ward name */}
              <h2 className="font-display font-black text-3xl text-forest mb-2 leading-none uppercase tracking-tighter">{activeReport.title}</h2>
              
              {/* MLA + MP info */}
              <div className="bg-forest rounded-3xl p-6 mb-8 grid grid-cols-2 gap-4 text-xs shadow-2xl shadow-forest/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-12 -mt-12"></div>
                <div>
                  <div className="text-white/30 uppercase tracking-[0.2em] text-[8px] mb-1 font-black">MLA (KLA)</div>
                  <div className="font-display font-black text-gold text-base leading-tight break-words">{activeReport.mlaDetails?.mla || '—'}</div>
                  <div className="text-white/40 text-[9px] uppercase font-black tracking-widest mt-1">{activeReport.mlaDetails?.party}</div>
                </div>
                <div>
                  <div className="text-white/30 uppercase tracking-[0.2em] text-[8px] mb-1 font-black">MP (LS)</div>
                  <div className="font-display font-black text-white text-base leading-tight break-words">{activeReport.mlaDetails?.mp || '—'}</div>
                  <div className="text-white/40 text-[9px] uppercase font-black tracking-widest mt-1">{activeReport.mlaDetails?.mpConstituency}</div>
                </div>
              </div>

              {/* Report count summary */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-ash/5 rounded-2xl p-4 text-center border border-ash/10">
                  <div className="font-display font-black text-3xl text-forest leading-none">
                    {activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.length || 0)}
                  </div>
                  <div className="text-[8px] font-black uppercase text-forest/30 tracking-widest mt-2">Nodes</div>
                </div>
                <div className="bg-gold/5 rounded-2xl p-4 text-center border border-gold/20">
                  <div className="font-display font-black text-3xl text-forest leading-none text-gold">
                    {activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.filter(r => r.status === 'open').length || 0)}
                  </div>
                  <div className="text-[8px] font-black uppercase text-gold tracking-widest mt-2">Alerts</div>
                </div>
                <div className="bg-bright/5 rounded-2xl p-4 text-center border border-bright/20">
                  <div className="font-display font-black text-3xl text-bright leading-none">
                    {activeReport.id.startsWith('ward-') && !selectedReport ? '…' : (wardReports.filter(r => r.status === 'resolved').length || 0)}
                  </div>
                  <div className="text-[8px] font-black uppercase text-bright tracking-widest mt-2">Secured</div>
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
          <div className="p-8 border-t border-forest/5 bg-white/50 flex flex-col gap-3 shrink-0">
            <a
              href={`/report?ward=${activeReport.ward}`}
              className="w-full bg-bright hover:bg-forest text-white py-5 rounded-2xl font-black text-xs text-center uppercase tracking-[0.3em] shadow-xl shadow-bright/20 transition-all hover:scale-[1.02]"
            >
              Initiate Ward Audit
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Ward ${activeReport.ward} has ${wardReports.length} unresolved civic complaints. ${activeReport.mlaDetails?.mla} (MLA) and ${activeReport.mlaDetails?.mp} (MP) — please act. @NammaKarnataka @BBMPgov #BrokenBengaluru`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-forest/5 hover:bg-forest hover:text-gold text-forest py-4 rounded-2xl font-black text-[10px] text-center uppercase tracking-[0.2em] transition-all border border-forest/10"
            >
              Broadcast Failure to MLA
            </a>
            <div className="text-center text-[8px] text-forest/30 font-black flex items-center justify-center gap-2 uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 bg-bright rounded-full animate-pulse"></span> Encrypted Civic Intelligence
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
