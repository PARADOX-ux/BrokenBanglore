import { useState, useEffect, useRef } from 'react';
import { categories, getWardByArea } from '../data/wardData';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { submitReport } from '../lib/reportsDb';

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [formData, setFormData] = useState({
    category: null,
    title: '',
    description: '',
    severity: 'medium',
    position: null,
    area: '',
    address: '',
    wardData: null,
    photo: null,
    photoPreview: null,
  });

  // On mount: if we came back from Map pick mode, read the saved location
  useEffect(() => {
    const startStep = searchParams.get('step');
    const locationPicked = searchParams.get('locationPicked');
    if (startStep) setStep(Number(startStep));

    if (locationPicked === 'true') {
      const saved = localStorage.getItem('bb_picked_location');
      if (saved) {
        const loc = JSON.parse(saved);
        setPickedLocation(loc);
        setFormData(f => ({
          ...f,
          position: { lat: loc.lat, lng: loc.lng },
          area: loc.wardName || f.area,
          wardData: loc.ward ? {
            ward: loc.ward,
            name: loc.wardName,
            mla: loc.mla,
            party: loc.party,
            partyColor: loc.partyColor,
            authority: loc.authority || 'BBMP',
          } : f.wardData,
        }));
        localStorage.removeItem('bb_picked_location');
      }
    }
  }, []);

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Auto-detect GPS location with Reverse Geocoding
  const detectLocation = async () => {
    if (navigator.geolocation) {
      setFormData(f => ({ ...f, area: 'Detecting...', wardData: null }));
      setPickedLocation({ lat: 0, lng: 0, wardName: 'Detecting location...' });

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const loc = { lat, lng };
        setFormData(f => ({ ...f, position: loc }));
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          
          if (data && data.address) {
            const area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.city_district || data.address.subdistrict || 'Detected Area';
            const ward = getWardByArea(area);
            
            setFormData(f => ({ ...f, area: area, wardData: ward }));
            setPickedLocation({ lat, lng, wardName: area });
          } else {
            setPickedLocation({ lat, lng, wardName: 'GPS Location' });
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
          setPickedLocation({ lat, lng, wardName: 'GPS Location' });
        }
      }, (err) => {
        let msg = 'Could not detect location.';
        if (err.code === 1) msg = 'Location access denied. Please enable GPS and try again.';
        if (err.code === 3) msg = 'GPS timeout. Try picking on the map instead.';
        alert(msg);
        setPickedLocation(null);
        setFormData(f => ({ ...f, area: '' }));
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Mock auto-detecting ward when an area is typed or pin dropped
  const handleAreaChange = (e) => {
    const area = e.target.value;
    const ward = getWardByArea(area);
    const newPos = (ward && ward.lat) ? { lat: ward.lat, lng: ward.lng } : formData.position;
    setFormData({ ...formData, area, wardData: ward, position: newPos });
  };

  const handleCategorySelect = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    nextStep();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setUseCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please allow permissions or upload a file instead.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], "evidence.jpg", { type: "image/jpeg" });
        setFormData({ ...formData, photo: file, photoPreview: URL.createObjectURL(file) });
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3, 4, 5].map((s) => (
        <div 
          key={s} 
          className={`h-2 flex-1 rounded-sm ${s <= step ? 'bg-gold' : 'bg-ash/40'}`} 
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 min-h-[calc(100vh-80px)] flex flex-col pt-24 md:pt-12">
      <h1 className="font-display font-black text-3xl md:text-5xl text-black mb-2 uppercase tracking-tighter">Report a Problem</h1>
      <p className="text-black/60 mb-8 font-black uppercase text-xs tracking-widest italic">We will notify the responsible MLA and Authority immediately.</p>
      
      {step < 5 && renderStepIndicator()}

      <div className="flex-1 bg-cream/50 rounded-2xl p-6 md:p-8 border border-white/20 shadow-sm relative overflow-hidden">
        
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-2xl mb-6">What needs fixing?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="bg-white hover:bg-tea border border-ash/30 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md hover:-translate-y-1"
                >
                  <span className="text-4xl">{cat.emoji}</span>
                  <span className="font-bold text-olive text-sm text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="animate-fade-in flex flex-col h-full">
            <h2 className="font-display font-bold text-2xl mb-6 flex items-center justify-between">
              Give us the details
              <button className="text-sm bg-white px-3 py-1 rounded-full text-forest/60" onClick={() => setStep(1)}>Change Category</button>
            </h2>
            
            <div className="space-y-6 flex-1">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block font-bold mb-2 text-forest">Headline</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Giant pothole on 100ft road" 
                    className="w-full bg-white border border-forest/20 rounded-lg px-4 py-3 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/10"
                  />
                </div>
                
                {/* Bigger, more obvious Camera Button */}
                {/* Bigger, more obvious Camera Button */}
                <button 
                  onClick={() => {
                    startCamera();
                    setStep(4);
                  }}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-forest text-gold rounded-2xl border-4 border-black hover:bg-black transition-all group shadow-xl"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">📸</span>
                  <div className="text-left">
                    <p className="font-black text-lg leading-none uppercase tracking-tight">Open Camera</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Capture live evidence for faster resolution</p>
                  </div>
                </button>
              </div>

              <div>
                <label className="block font-bold mb-2 text-forest">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  placeholder="How long has it been there? Is it dangerous?" 
                  className="w-full bg-white border border-forest/20 rounded-lg px-4 py-3 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/10"
                />
              </div>

              <div>
                <label className="block font-bold mb-3 text-forest">Severity</label>
                <div className="flex flex-wrap gap-3">
                  {['Low', 'Medium', 'High', 'Emergency'].map(lvl => (
                    <button 
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({...formData, severity: lvl.toLowerCase()})}
                      className={`px-6 py-2 rounded-full font-bold text-sm border-2 transition-all ${
                        formData.severity === lvl.toLowerCase() 
                          ? 'bg-forest text-gold border-forest shadow-md' 
                          : 'bg-white text-forest border-forest'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t border-ash/30">
              <button onClick={prevStep} className="font-bold text-forest/70 hover:text-forest px-4 py-2">Back</button>
              <button 
                onClick={nextStep} 
                className="bg-gold text-forest px-8 py-3 rounded-xl font-bold hover:-translate-y-0.5 transition-transform"
                disabled={!formData.title}
              >
                Next: Location →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location & Ward Detection */}
        {step === 3 && (
          <div className="animate-fade-in flex flex-col h-full">
            <h2 className="font-display font-bold text-2xl mb-2">Pin the location</h2>
            <p className="text-olive/70 mb-5 text-sm">We'll automatically detect your Ward, MLA, and authority to send them a formal complaint.</p>

            {/* Location picked confirmation */}
            {pickedLocation ? (
              <div className="bg-white border-2 border-forest/30 rounded-2xl p-4 mb-5 animate-fade-in shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-forest text-gold rounded-xl flex items-center justify-center text-lg shrink-0">📍</div>
                  <div>
                    <div className="font-bold text-forest text-sm">Location Pinned ✓</div>
                    <div className="text-xs text-olive/60">
                      {pickedLocation.wardName || `${pickedLocation.lat?.toFixed(4)}, ${pickedLocation.lng?.toFixed(4)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => { setPickedLocation(null); setFormData(f => ({...f, position: null, wardData: null, area: ''})); }}
                    className="ml-auto text-xs font-bold text-red-400 hover:text-red-600"
                  >Change ✕</button>
                </div>
                {formData.wardData && (
                  <div className="border-t border-ash/20 pt-2 mt-2 flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1 font-bold text-forest">
                      🏘️ Ward {formData.wardData.ward}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: formData.wardData.partyColor}}></span>
                      <span className="font-bold">{formData.wardData.mla}</span>
                      <span className="text-olive/50">({formData.wardData.party})</span>
                    </span>
                    <span className="text-olive/60">🏢 {formData.wardData.authority}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                {/* Primary option: open site map */}
                <button
                  onClick={() => navigate('/map?pickMode=true')}
                  className="w-full bg-[#1a3a2a] text-white rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition-all shadow-lg group border border-gold/20"
                >
                  <div className="w-14 h-14 bg-gold/20 rounded-xl flex items-center justify-center text-3xl shrink-0 group-hover:bg-gold/30 transition-colors">🗺️</div>
                  <div className="text-left">
                    <div className="font-display font-bold text-lg leading-tight">Open Site Map</div>
                    <div className="text-white/60 text-sm mt-0.5">Tap your neighborhood on our full ward map. Auto-detects MLA + authority.</div>
                  </div>
                  <span className="ml-auto text-white/30 text-2xl">→</span>
                </button>

                {/* GPS option */}
                <button
                  onClick={detectLocation}
                  className="w-full border-2 border-forest/20 bg-white rounded-2xl p-4 flex items-center gap-4 hover:border-forest transition-all group"
                >
                  <div className="w-12 h-12 bg-forest/5 rounded-xl flex items-center justify-center text-2xl shrink-0">📡</div>
                  <div className="text-left">
                    <div className="font-bold text-forest text-sm">Use My GPS Location</div>
                    <div className="text-olive/50 text-xs mt-0.5">Auto-detect based on your device's location</div>
                  </div>
                </button>
              </div>
            )}

            {/* Manual area text fallback (always visible) */}
            <div>
              <label className="block font-bold mb-2 text-forest text-sm">Or type your area name</label>
              <input
                type="text"
                value={formData.area}
                onChange={handleAreaChange}
                placeholder="e.g. Indiranagar, HSR Layout, Koramangala..."
                className="w-full bg-white border border-ash/50 rounded-xl px-4 py-3 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 text-sm"
              />
              <p className="text-xs mt-1 text-olive/50 font-medium">Tip: Type "Indiranagar", "HSR Layout" or "Whitefield" to test ward auto-detection.</p>
            </div>

            {/* Auto-detected Ward Card (from text input) */}
            {formData.wardData && !pickedLocation && (
              <div className="bg-white border-2 border-gold/50 rounded-xl p-4 flex flex-col gap-2 mt-3 animate-fade-in shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-tea text-olive px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Auto-Detected</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="font-bold text-lg">Ward {formData.wardData.ward} — {formData.wardData.name}</div>
                  <div className="flex items-center gap-2 bg-ash/20 px-3 py-1 rounded-full w-max">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: formData.wardData.partyColor}}></span>
                    <span className="text-sm font-bold">{formData.wardData.mla} ({formData.wardData.party})</span>
                  </div>
                </div>
                <div className="text-sm text-olive/70 mt-1">🏢 Authority: <strong>{formData.wardData.authority}</strong></div>
              </div>
            )}

            <div className="flex justify-between mt-auto pt-6">
              <button onClick={prevStep} className="font-bold text-olive/70 hover:text-olive px-4 py-2">Back</button>
              <button
                onClick={nextStep}
                className="bg-gold text-olive px-8 py-3 rounded-xl font-bold hover:-translate-y-0.5 transition-transform disabled:opacity-40"
                disabled={!formData.area && !pickedLocation}
              >
                Next: Evidence →
              </button>
            </div>
          </div>
        )}


        {/* Step 4: Direct Camera / Evidence */}
        {step === 4 && (
          <div className="animate-fade-in flex flex-col h-full items-center">
            <h2 className="font-display font-black text-3xl mb-1 text-center uppercase tracking-tight">Direct Evidence</h2>
            <p className="text-olive/70 mb-8 text-center text-sm font-bold italic">Capture the reality. Evidence forces action.</p>

            <div className="w-full aspect-square md:aspect-video bg-black rounded-[2rem] overflow-hidden border-4 border-black relative shadow-2xl mb-8 group">
              {useCamera ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-[20px] border-white/10 pointer-events-none"></div>
                  
                  {/* Camera Controls */}
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12">
                    <button onClick={stopCamera} className="bg-black/50 text-white w-12 h-12 rounded-full border-2 border-white/20 hover:bg-black/80">✕</button>
                    <button 
                      onClick={capturePhoto}
                      className="w-24 h-24 bg-white rounded-full border-[10px] border-forest/20 flex items-center justify-center shadow-2xl active:scale-95 transition-all"
                    >
                      <div className="w-12 h-12 bg-red-600 rounded-full"></div>
                    </button>
                    <div className="w-12 h-12"></div>
                  </div>
                </>
              ) : formData.photoPreview ? (
                <div className="relative h-full">
                  <img src={formData.photoPreview} alt="Evidence" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all gap-4">
                    <button onClick={startCamera} className="bg-gold text-forest px-8 py-3 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl">Retake Live</button>
                    <label className="bg-white text-forest px-8 py-3 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl cursor-pointer">
                      Pick Local
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setFormData({...formData, photo: file, photoPreview: URL.createObjectURL(file)});
                      }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[#fdfbf6]">
                  <div className="w-24 h-24 bg-forest/5 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-sm">📸</div>
                  <button 
                    onClick={startCamera}
                    className="w-full max-w-sm bg-forest text-gold px-8 py-6 rounded-3xl font-black uppercase text-lg tracking-widest shadow-2xl hover:scale-105 transition-transform mb-4 border-4 border-black"
                  >
                    Open Live Camera
                  </button>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-4">OR USE EXISTING EVIDENCE</p>
                  <label className="text-forest underline font-black text-sm cursor-pointer hover:text-black transition-colors">
                    Upload from Gallery
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setFormData({...formData, photo: file, photoPreview: URL.createObjectURL(file)});
                    }} />
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-between w-full mt-auto pt-8 border-t-2 border-black/10">
              <button 
                onClick={() => { stopCamera(); prevStep(); }} 
                className="font-black text-olive/50 hover:text-black uppercase tracking-widest text-xs"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  stopCamera();
                  const finalPos = formData.position || (formData.wardData?.lat ? { lat: formData.wardData.lat, lng: formData.wardData.lng } : null);
                  
                  if (!finalPos) {
                    alert("Please select a location on the map or type a valid area name so we can place your report.");
                    setStep(3);
                    return;
                  }

                  const { data, refNo, error } = await submitReport({
                    category: formData.category,
                    title: formData.title,
                    description: formData.description,
                    severity: formData.severity,
                    lat: finalPos.lat,
                    lng: finalPos.lng,
                    area_name: formData.area,
                    ward_no: formData.wardData?.ward,
                    photo: formData.photo,
                    photoPreview: formData.photoPreview,
                  });

                  if (error) {
                    alert("Submission failed. Please check your internet or try again.");
                    console.error(error);
                  } else {
                    nextStep();
                  }
                }}
                className="bg-forest text-gold px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:shadow-2xl transition-all disabled:opacity-20 border-4 border-black"
                disabled={!formData.photo}
              >
                Submit Evidence 🚀
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Accountability Timeline (Refined) */}
        {step === 5 && (() => {
          const wd = formData.wardData;
          const refNo = `BB-${Date.now().toString(36).toUpperCase()}`;
          const issue = formData.title || 'Civic Issue';
          const area = formData.area || 'Bengaluru';
          const mlaName = wd?.mla || 'your MLA';
          const ward = wd?.ward || '—';
          const mlaEmail = `mla-${(wd?.constituency || 'office').toLowerCase().replace(/\s/g, '-')}@kla.kar.nic.in`;

          const emailSubject = `[URGENT: RESOLVE IN 7 DAYS] ${issue} — Ward ${ward}, ${area}`;
          const emailBody = `Formal Citizen Notice: ${refNo}\n\nThis issue has been documented on BrokenBengaluru. It is now part of the Public Action Audit.\n\nEscalation Warning:\n- Day 3: Public Twitter/Email Blast\n- Day 7: BBMP Commissioner Notice\n- Day 15: Formal RTI Filing\n\nResolve this now.`;

          return (
            <div className="animate-fade-in flex flex-col py-2 text-left w-full h-full">
              <div className="bg-forest/5 border-4 border-black/5 rounded-[2.5rem] p-8 mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none"
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                </div>
                <div className="text-6xl mb-4">📢</div>
                <h2 className="font-display font-black text-4xl text-black uppercase tracking-tighter mb-2 leading-none">Report Filed</h2>
                <p className="text-olive/50 font-black text-xs uppercase tracking-[0.3em] mb-4">REF: {refNo}</p>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping"></span>
                  Live on Public Map
                </div>
              </div>

              {/* Accountability Clock / Pipeline */}
              <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-display font-black text-2xl text-black uppercase tracking-tight mb-8 flex items-center gap-3">
                  <span className="text-3xl">⏱️</span> ACCOUNTABILITY PIPELINE
                </h3>
                
                <div className="space-y-6 relative ml-4">
                  <div className="absolute left-[15px] top-2 bottom-2 w-1 bg-black/10"></div>
                  
                  {/* Day 0 */}
                  <div className="flex gap-6 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-forest text-gold flex items-center justify-center text-xs font-black shrink-0 shadow-lg border-2 border-black group">
                      <div className="absolute inset-0 bg-gold rounded-full scale-0 group-hover:scale-100 opacity-20 transition-transform"></div>
                      0
                    </div>
                    <div className="pt-1">
                      <p className="font-black text-sm uppercase tracking-tight text-forest">REPORT PUBLISHED</p>
                      <p className="text-[11px] text-black/50 font-bold uppercase mt-1">Live Evidence Logged. Mirror notice sent to {mlaName}.</p>
                    </div>
                  </div>

                  {/* Day 3 */}
                  <div className="flex gap-6 relative z-10 group">
                    <div className="w-8 h-8 rounded-full bg-white text-forest flex items-center justify-center text-xs font-black shrink-0 border-2 border-black shadow-sm group-hover:bg-gold group-hover:text-black transition-all">3</div>
                    <div className="pt-1">
                      <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                        EMAIL & TWITTER BLAST ⚡
                      </p>
                      <p className="text-[11px] text-black/40 font-bold uppercase mt-1">Automated bot-tweet to @{mlaName.replace(/\s/g, '')}. Official email goes to Ward Office.</p>
                    </div>
                  </div>

                  {/* Day 7 */}
                  <div className="flex gap-6 relative z-10 group">
                    <div className="w-8 h-8 rounded-full bg-white text-forest flex items-center justify-center text-xs font-black shrink-0 border-2 border-black shadow-sm group-hover:bg-gold transition-all">7</div>
                    <div className="pt-1">
                      <p className="font-black text-sm uppercase tracking-tight">COMMISSIONER ESCALATION</p>
                      <p className="text-[11px] text-black/40 font-bold uppercase mt-1">Direct formal petition pushed to Zonal Deputy Commissioner.</p>
                    </div>
                  </div>

                  {/* Day 15 */}
                  <div className="flex gap-6 relative z-10 group">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-black shrink-0 border-4 border-black group-hover:bg-red-600 group-hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(220,38,38,0.2)]">15</div>
                    <div className="pt-1">
                      <p className="font-black text-sm uppercase tracking-tight text-red-600">RTI FILING: CITIZEN AUDIT ⚖️</p>
                      <p className="text-[11px] text-red-800/40 font-bold uppercase mt-1">We demand to see why you were ignored. RTI drafted automatically.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-10">
                <a 
                   href={`mailto:${mlaEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                   className="flex-1 bg-black text-white px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest text-center hover:bg-forest transition-colors flex items-center justify-center gap-3"
                >
                  📧 Formal Notice
                </a>
                
                {wd?.twitter && (
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`.${wd.twitter} @BBMPCOMM Reference ${refNo}: Reported a ${formData.category} issue in ${formData.area} (Ward ${wd.ward}). Please investigate and resolve. #BrokenBengaluru #FixBengaluru`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#1DA1F2] text-white px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest text-center hover:bg-blue-600 transition-colors flex items-center justify-center gap-3 shadow-xl"
                  >
                    ⚡ Social Pressure
                  </a>
                )}

                <Link to="/map" className="flex-1 bg-forest text-gold px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest text-center shadow-xl hover:scale-105 transition-transform border-4 border-black">
                  View Map Data
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
