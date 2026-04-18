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
  fillColor: '#2B9348',
  fillOpacity: 0.03,
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

    if (selectedReport) {
      handleWardClick(e);
    }
  };

  const resetWard = (e) => {
    const layer = e.target;
    if (geoJsonRef.current) {
       geoJsonRef.current.resetStyle(layer);
    }
    // Force reset to ensure it NEVER gets stuck, even if the ref logic fails
    layer.setStyle(wardStyle);
    setHoveredData(null);
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
        <div className="absolute top-4 left-4 right-4 z-[400] bg-[#1a3a2a] text-white rounded-2xl shadow-2xl p-3 flex items-center gap-3 border border-gold/30">
          <span className="text-2xl">📍</span>
          <div className="flex-1">
            <div className="font-bold text-sm">Pick Mode — Tap your problem location</div>
            <div className="text-white/60 text-xs">Click any ward or tap the map to drop a pin</div>
          </div>
          <a href="/report" className="text-white/40 hover:text-white font-bold text-sm">Cancel ✕</a>
        </div>
      ) : (
        <div className="absolute top-4 left-4 z-[400] bg-black/60 backdrop-blur-md rounded-lg shadow-2xl p-2.5 flex gap-4 border border-white/10">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer p-1"
          >
            <option value="all" className="bg-black text-white">All Issues</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-black text-white">{cat.label}</option>
            ))}
          </select>
          <div className="hidden md:flex gap-4 items-center pl-4 border-l border-white/20 text-xs font-bold text-white/80">
            <div><span className="text-red-400">{allReports.filter(r => r.status === 'open').length}</span> Active</div>
            <div><span className="text-green-400">{allReports.filter(r => r.status === 'resolved').length}</span> Resolved</div>
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
          
          {/* Render real markers for all global reports */}
          {!isPickMode && allReports.map(report => (
            <Marker 
              key={report.id || report.ref_no} 
              position={[report.lat, report.lng]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${categories.find(c => c.id === report.category)?.color || '#2B9348'}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              })}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className="text-[10px] font-bold uppercase text-forest/50 mb-1">{report.category}</div>
                  <div className="font-bold text-xs mb-1">{report.title}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {report.status === 'resolved' ? 'Fixed' : 'Open'}
                    </span>
                    <button 
                      onClick={() => navigate(`/map?ward=${report.ward_no}`)}
                      className="text-[9px] font-bold text-forest hover:underline"
                    >View Ward →</button>
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

      {/* NammaKasa-style Ward Stats Card (Bottom Left) */}
      {hoveredData ? (
        <div className="absolute bottom-6 left-6 z-[400] bg-white p-4 rounded-xl shadow-xl border-l-[6px] border-forest border-y border-r border-forest/10 w-64 animate-in slide-in-from-left-4 duration-200 pointer-events-none">
           <div className="font-display font-bold text-xl text-forest mb-0.5">{hoveredData.area}</div>
           <div className="text-xs font-bold text-forest/60 mb-3">Ward #{hoveredData.ward}</div>
           
           <div className="flex gap-4 border-t border-forest/5 pt-3">
              <div>
                 <div className="text-sm font-bold text-forest">0</div>
                 <div className="text-[9px] font-bold uppercase text-forest/40">Reports</div>
              </div>
              <div>
                 <div className="text-sm font-bold text-forest">Open</div>
                 <div className="text-[9px] font-bold uppercase text-forest/40">Status</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-forest/5 px-2 py-1 rounded-md">
                 <div className="w-2 h-2 rounded-full" style={{backgroundColor: hoveredData.mla?.partyColor}}></div>
                 <span className="text-[10px] font-bold text-forest">{hoveredData.mla?.party}</span>
              </div>
           </div>
        </div>
      ) : (
        <div className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-forest/10 w-64 pointer-events-none">
           <div className="text-[10px] font-bold uppercase tracking-widest text-forest/40 mb-1">Explore Map</div>
           <p className="text-xs font-medium text-forest/70">Hover over markers to view ward-level accountability data.</p>
        </div>
      )}

      {/* The nammakasa-style Floating Accountability Card */}
      {selectedReport && (
        <div className="absolute top-20 bottom-4 right-4 md:right-8 w-full max-w-[320px] bg-white rounded-xl shadow-2xl z-[500] flex flex-col border border-ash/40 overflow-hidden transform transition-all animate-in slide-in-from-right-8 duration-300">
          
          {/* Card Header */}
          <div className="flex justify-between items-center p-3 border-b border-forest/10 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-forest animate-pulse"></div>
              <span className="uppercase text-[10px] font-bold tracking-wider text-forest">
                BBMP Ward #{selectedReport.ward}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedReport(null); setWardReports([]); }} className="text-forest/30 hover:text-forest">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              {/* Ward name */}
              <h2 className="font-display font-bold text-xl text-[#1a3a2a] mb-1 leading-tight">{selectedReport.title}</h2>
              
              {/* MLA + MP info */}
              <div className="bg-[#1a3a2a] text-white rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-white/40 uppercase tracking-widest text-[9px]">MLA (State)</div>
                  <div className="font-bold truncate">{selectedReport.mlaDetails?.mla || '—'}</div>
                  <div className="text-white/50 text-[9px]">{selectedReport.mlaDetails?.party}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase tracking-widest text-[9px]">MP (Lok Sabha)</div>
                  <div className="font-bold truncate">{selectedReport.mlaDetails?.mp || '—'}</div>
                  <div className="text-white/50 text-[9px]">{selectedReport.mlaDetails?.mpConstituency}</div>
                </div>
              </div>

              {/* Report count summary */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-forest/5 rounded-xl p-2.5 text-center border border-forest/10">
                  <div className="font-display font-bold text-2xl text-forest">
                    {wardReportsLoading ? '…' : wardReports.length}
                  </div>
                  <div className="text-[9px] font-bold uppercase text-forest/40">Total</div>
                </div>
                <div className="bg-gold/10 rounded-xl p-2.5 text-center border border-gold/20">
                  <div className="font-display font-bold text-2xl text-forest">
                    {wardReportsLoading ? '…' : wardReports.filter(r => r.status === 'open').length}
                  </div>
                  <div className="text-[9px] font-bold uppercase text-forest/40">Open</div>
                </div>
                <div className="bg-bright/10 rounded-xl p-2.5 text-center border border-bright/20">
                  <div className="font-display font-bold text-2xl text-bright">
                    {wardReportsLoading ? '…' : wardReports.filter(r => r.status === 'resolved').length}
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
                            onClick={() => upvoteReport(report.id || report.ref_no).then(() => getReports({ ward_no: selectedReport.ward }).then(setWardReports))}
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
              href={`/report?ward=${selectedReport.ward}`}
              className="w-full bg-forest hover:bg-[#1a3a2a] text-gold py-3 rounded-lg font-bold text-sm text-center shadow-lg transition-colors"
            >
              Report a Problem Here
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Ward ${selectedReport.ward} has ${wardReports.length} unresolved civic complaints. ${selectedReport.mlaDetails?.mla} (MLA) and ${selectedReport.mlaDetails?.mp} (MP) — please act. @NammaKarnataka @BBMPgov #BrokenBanglore`)}`}
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
      )}
    </div>
  );
}
