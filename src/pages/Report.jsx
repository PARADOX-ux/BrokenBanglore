import { useState, useEffect } from 'react';
import { categories, getWardByArea, incrementStat } from '../data/wardData';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
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
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const loc = { lat, lng };
        setFormData(f => ({ ...f, position: loc }));
        
        // Try to get actual area name (free OSM service)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.city_district || 'Detected Area';
          
          setFormData(f => ({ ...f, area: area }));
          setPickedLocation({ lat, lng, wardName: area });
        } catch (e) {
          setPickedLocation({ lat, lng, wardName: 'GPS Location' });
        }
      }, () => alert('Could not detect location. Try manually entering your area below.'));
    }
  };

  // Mock auto-detecting ward when an area is typed or pin dropped
  const handleAreaChange = (e) => {
    const area = e.target.value;
    const ward = getWardByArea(area);
    setFormData({ ...formData, area, wardData: ward });
  };

  const handleCategorySelect = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
    nextStep();
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
      <h1 className="font-display font-bold text-3xl md:text-5xl text-forest mb-2">Report a Problem</h1>
      <p className="text-forest/70 mb-8 font-medium">We will notify the responsible MLA and Authority immediately.</p>
      
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
                <button 
                  onClick={() => setStep(4)}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-teal-50 border-2 border-dashed border-teal-200 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">📸</span>
                  <div className="text-left">
                    <p className="font-bold text-sm">Add Photo Evidence</p>
                    <p className="text-xs opacity-70">Highly recommended for faster resolution</p>
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


        {/* Step 4: Photo */}
        {step === 4 && (
          <div className="animate-fade-in flex flex-col h-full">
            <h2 className="font-display font-bold text-2xl mb-2">Upload Photo Evidence</h2>
            <p className="text-olive/70 mb-6 text-sm">Reports with photos get fixed 3x faster by the authorities.</p>
            
            <div 
              onClick={() => document.getElementById('fileInput').click()}
              className="border-2 border-dashed border-forest/30 bg-white rounded-xl h-64 flex flex-col items-center justify-center gap-4 hover:border-forest/50 transition-colors cursor-pointer group relative overflow-hidden"
            >
              {formData.photoPreview ? (
                <img src={formData.photoPreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  <div className="w-16 h-16 bg-forest/5 rounded-full flex items-center justify-center text-2xl group-hover:bg-gold transition-colors">
                    📸
                  </div>
                  <div className="text-center">
                    <p className="font-bold">Click to upload or drag & drop</p>
                    <p className="text-sm text-forest/60 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </>
              )}
              <input 
                id="fileInput"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData({...formData, photo: file, photoPreview: URL.createObjectURL(file)});
                  }
                }}
              />
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-forest/70 font-medium">Capture the evidence to force MLA action.</p>
            </div>

            <div className="flex justify-between mt-auto pt-6 border-t border-ash/30">
              <button onClick={prevStep} className="font-bold text-olive/70 hover:text-olive px-4 py-2">Back</button>
              <button
                onClick={() => {
                  incrementStat('reports');
                  incrementStat('citizens');
                  nextStep();
                }}
                className="bg-olive text-white px-8 py-3 rounded-xl font-bold hover:-translate-y-0.5 transition-transform"
              >
                Submit Report 🚀
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success + 5-Channel Escalation */}
        {step === 5 && (() => {
          const wd = formData.wardData;
          const refNo = `BB-${Date.now().toString(36).toUpperCase()}`;
          const issue = formData.title || 'Civic Issue';
          const area = formData.area || 'Bengaluru';
          const mlaName = wd?.mla || 'your MLA';
          const mpName = wd?.mp || 'your MP';
          const ward = wd?.ward || '—';
          const authorityEmail = wd?.authorityEmail || 'commissioner@bbmp.gov.in';
          const mlaEmail = `mla-${(wd?.constituency || 'office').toLowerCase().replace(/\s/g, '-')}@kla.kar.nic.in`;

          const emailSubject = `[Citizen Complaint ${refNo}] ${issue} — Ward ${ward}, ${wd?.constituency || area}`;
          const emailBody = `Dear ${mlaName} / BBMP Ward Commissioner,

I am a citizen of Bengaluru filing a formal civic complaint.

Reference No: ${refNo}
Issue: ${issue}
Category: ${formData.category || 'General'}
Severity: ${formData.severity || 'Medium'}
Location: ${area}${ward ? `, Ward ${ward}` : ''}

This issue has been documented and is publicly visible on BrokenBanglore — a citizen accountability platform. I request acknowledgement within 7 working days and resolution within 30 days, failing which this complaint will be escalated to higher authorities and the media.

View public report: https://brokenbanglore.in/map

Regards,
A Bengaluru Citizen`;

          const waText = `Namaskara,

This is a formal complaint regarding a civic issue in Ward ${ward} (${area}).

Issue: ${issue}
Reference No: ${refNo}
Category: ${formData.category || 'General'}

This report is publicly documented on BrokenBanglore: https://brokenbanglore.in/map

I expect acknowledgement within 7 days. If unresolved in 30 days, this will be escalated to the BBMP Commissioner, media, and Chief Minister's office.

#BrokenBanglore #FixBengaluru`;

          const tweetText = `🔴 CIVIC COMPLAINT ${refNo}

"${issue}" — Ward ${ward}, ${area}

Responsible MLA: ${mlaName}
Responsible MP: ${mpName}

Publicly documented → https://brokenbanglore.in/map

@NammaKarnataka @BBMPgov #BrokenBanglore #FixBengaluru`;

          // Download formal complaint letter as text file (PDF lib too heavy for now)
          const downloadLetter = () => {
            const letter = `FORMAL CITIZEN COMPLAINT\n${'='.repeat(50)}\n\nReference No: ${refNo}\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nTo,\nThe Ward Commissioner / MLA Office\nBBMP ${wd?.authority || 'Ward Office'} Zone\n\nSubject: Complaint regarding ${issue} — Ward ${ward}, ${area}\n\nDear Sir/Madam,\n\n${emailBody}\n\n${'='.repeat(50)}\nFiled via BrokenBanglore | brokenbanglore.in\nPowered by citizens of Bengaluru.`;
            const blob = new Blob([letter], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BrokenBanglore-Complaint-${refNo}.txt`;
            a.click();
          };

          return (
            <div className="animate-fade-in flex flex-col py-4 text-left w-full">
              {/* Success header */}
              <div className="flex items-center gap-4 mb-6 bg-green-50 p-5 rounded-2xl border border-green-200">
                <div className="w-14 h-14 bg-green-100 text-3xl flex items-center justify-center rounded-full shrink-0">✅</div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-[#1a3a2a]">Complaint Registered!</h2>
                  <p className="text-green-700 font-semibold text-sm mt-0.5">Reference: <span className="font-black tracking-wider">{refNo}</span> — Keep this safe for follow-up.</p>
                </div>
              </div>

              {wd && (
                <div className="bg-[#1a3a2a] text-white rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-white/50 text-xs uppercase tracking-widest">Ward</div><div className="font-bold">{ward} • {wd.name || area}</div></div>
                  <div><div className="text-white/50 text-xs uppercase tracking-widest">MLA (State)</div><div className="font-bold">{mlaName} <span className="text-gold text-xs">{wd.party}</span></div></div>
                  <div><div className="text-white/50 text-xs uppercase tracking-widest">MP (Lok Sabha 2024)</div><div className="font-bold">{mpName} <span className="text-gold text-xs">BJP</span></div></div>
                  <div><div className="text-white/50 text-xs uppercase tracking-widest">Authority</div><div className="font-bold">{wd.authority}</div></div>
                  <div className="col-span-2 border-t border-white/10 pt-2"><div className="text-white/50 text-xs uppercase tracking-widest">Filer Information</div><div className="font-bold text-gold">Public Accountability Petitioner (Anonymous ID: {refNo.slice(-4)})</div></div>
                </div>
              )}

              {/* The 5 escalation channels */}
              <h3 className="font-display font-bold text-xl text-[#1a3a2a] mb-1">Now pressure them — all 5 channels.</h3>
              <p className="text-[#1a3a2a]/60 text-sm font-medium mb-4">Each one creates a paper trail they cannot delete. Do all 5 for maximum impact.</p>

              <div className="space-y-3 w-full">

                {/* Channel 1: Email Ward Commissioner */}
                <a
                  href={`mailto:${authorityEmail}?cc=${mlaEmail}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  className="flex items-center gap-4 bg-white border-2 border-forest/20 hover:border-forest hover:shadow-md rounded-2xl p-4 transition-all group w-full"
                >
                  <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-forest group-hover:text-white transition-all">📧</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1a3a2a]">Email BBMP Ward Commissioner</div>
                    <div className="text-xs text-[#1a3a2a]/50 font-medium">Formal complaint email — creates official paper trail. MLA office CC'd.</div>
                  </div>
                  <span className="text-xs font-black text-forest bg-forest/10 px-2 py-1 rounded-full shrink-0">Step 1</span>
                </a>

                {/* Channel 2: WhatsApp to Ward Office */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 bg-white border-2 border-[#25D366]/20 hover:border-[#25D366] hover:shadow-md rounded-2xl p-4 transition-all group w-full"
                >
                  <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-all">📲</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1a3a2a]">WhatsApp to BBMP Ward Office</div>
                    <div className="text-xs text-[#1a3a2a]/50 font-medium">Formal message pre-drafted. Send to your ward commissioner or councillor's WhatsApp.</div>
                  </div>
                  <span className="text-xs font-black text-[#25D366] bg-[#25D366]/10 px-2 py-1 rounded-full shrink-0">Step 2</span>
                </a>

                {/* Channel 3: Tweet MLA + MP */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 bg-white border-2 border-black/10 hover:border-black hover:shadow-md rounded-2xl p-4 transition-all group w-full"
                >
                  <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-black group-hover:text-white transition-all">𝕏</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1a3a2a]">Tweet — Tag MLA + MP publicly</div>
                    <div className="text-xs text-[#1a3a2a]/50 font-medium">Public shaming on social media. Political reputations are on the line.</div>
                  </div>
                  <span className="text-xs font-black text-black bg-black/5 px-2 py-1 rounded-full shrink-0">Step 3</span>
                </a>

                {/* Channel 4: BBMP Jan Spandana (official govt portal) */}
                <a
                  href={`https://ipgrs.karnataka.gov.in/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 bg-white border-2 border-blue-200 hover:border-blue-500 hover:shadow-md rounded-2xl p-4 transition-all group w-full"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all">🏛️</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1a3a2a]">File on Jana Spandana (Official Govt Portal)</div>
                    <div className="text-xs text-[#1a3a2a]/50 font-medium">Cross-file on Karnataka's official grievance portal. Legally binding. Use Ref: <strong>{refNo}</strong></div>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">Step 4</span>
                </a>

                {/* Channel 5: Download formal complaint letter */}
                <button
                  onClick={downloadLetter}
                  className="flex items-center gap-4 bg-white border-2 border-gold/30 hover:border-gold hover:shadow-md rounded-2xl p-4 transition-all group w-full text-left"
                >
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-gold transition-all">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1a3a2a]">Download Formal Complaint Letter</div>
                    <div className="text-xs text-[#1a3a2a]/50 font-medium">Printable complaint letter. Walk-in to the MLA office or ward office with this.</div>
                  </div>
                  <span className="text-xs font-black text-gold bg-gold/10 px-2 py-1 rounded-full shrink-0">Step 5</span>
                </button>
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-bold text-amber-800 mb-1">⏱️ If ignored after 15 days:</p>
                <p className="text-amber-700 font-medium">File an RTI application at <a href="https://rtionline.gov.in/" target="_blank" rel="noreferrer" className="underline font-bold">rtionline.gov.in</a> demanding a written response. Unanswered RTIs are a punishable offence under the RTI Act 2005.</p>
              </div>

              <Link to="/map" className="mt-6 font-bold text-forest hover:text-[#1a3a2a] border-b-2 border-transparent hover:border-forest pb-1 transition-colors self-center">
                View on Live Map →
              </Link>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
