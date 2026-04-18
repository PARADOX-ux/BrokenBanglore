import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { completeMLAList, getStats } from '../data/wardData';

export default function Home() {
  const [selectedZoneMLA, setSelectedZoneMLA] = useState(null);
  const [stats, setStats] = useState({ reports: 0, petitions: 0, citizens: 0, resolved: 0 });

  // Listen for real-time stat updates from any page
  useEffect(() => {
    setStats(getStats());
    const handler = (e) => setStats(e.detail);
    window.addEventListener('bb-stats-update', handler);
    return () => window.removeEventListener('bb-stats-update', handler);
  }, []);

  const zoneLookup = {
    'Mahadevapura': 'Mahadevapura',
    'Bommanahalli': 'Bommanahalli',
    'RR Nagar': 'Rajarajeshwarinagar',
    'Yelahanka': 'Yelahanka',
    'Dasarahalli': 'Dasarahalli',
    'Byatarayanapura': 'Byatarayanapura',
    'Bangalore South': 'Bangalore South',
    'Yeshwanthpur': 'Yeshvanthapura'
  };

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="w-full bg-white px-4 md:px-8 py-20 md:py-32 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1a3a2a 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>

        {/* Urgency pill */}
        <div className="relative z-10 mb-6 inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Your photo. Your ward. Their problem to fix.
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl text-[#1a3a2a] mb-6 tracking-tighter relative z-10 max-w-5xl">
          Bengaluru is broken. <br className="hidden md:block"/>
          <span className="text-forest relative inline-block">
            We're fixing it.
            <span className="absolute -bottom-4 left-0 w-full h-3 md:h-6 bg-gold/60 -rotate-1 -z-10"></span>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#1a3a2a]/80 max-w-2xl mb-12 font-semibold relative z-10">
          Report problems. Sign petitions. Reach your MLA. <br className="hidden md:block" /> Make the government move.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
          <Link to="/report" className="bg-forest text-gold px-8 py-4 rounded-xl font-bold font-display text-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
            📸 Report a Problem →
          </Link>
          <Link to="/map" className="bg-transparent border-2 border-[#1a3a2a] text-[#1a3a2a] px-8 py-4 rounded-xl font-bold font-display text-lg hover:bg-[#1a3a2a] hover:text-white transition-all">
            See What's Broken
          </Link>
        </div>

        {/* Live Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-forest relative z-10 w-full max-w-3xl">
          <div className="flex flex-col items-center">
            <span className="font-display font-bold text-3xl md:text-4xl text-[#1a3a2a]">{stats.reports}</span>
            <span className="text-sm font-bold uppercase tracking-wider text-[#1a3a2a]/70">Reports Filed</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display font-bold text-3xl md:text-4xl text-[#1a3a2a]">{stats.petitions}</span>
            <span className="text-sm font-bold uppercase tracking-wider text-[#1a3a2a]/70">Petitions</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display font-bold text-3xl md:text-4xl text-[#1a3a2a]">{stats.citizens}</span>
            <span className="text-sm font-bold uppercase tracking-wider text-[#1a3a2a]/70">Citizens</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display font-bold text-3xl md:text-4xl text-bright">{stats.resolved}</span>
            <span className="text-sm font-bold uppercase tracking-wider text-[#1a3a2a]/70">Resolved</span>
          </div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <div className="w-full bg-[#1a3a2a] text-gold py-3 overflow-hidden border-y border-gold/20 flex whitespace-nowrap">
        <div className="animate-marquee inline-block font-bold text-sm tracking-widest uppercase">
          🚧 Pothole Crisis &nbsp;·&nbsp; 💧 Water Shortage &nbsp;·&nbsp; 🗑️ Garbage Pileup &nbsp;·&nbsp; ⚡ Power Cuts &nbsp;·&nbsp; 🌊 Lake Pollution &nbsp;·&nbsp; 🚦 Traffic Chaos &nbsp;·&nbsp; 🏗️ Footpath Missing &nbsp;·&nbsp; 🌿 Tree Cutting &nbsp;·&nbsp; 🚧 Pothole Crisis &nbsp;·&nbsp; 💧 Water Shortage &nbsp;·&nbsp; 🗑️ Garbage Pileup &nbsp;·&nbsp; ⚡ Power Cuts &nbsp;·&nbsp; 🌊 Lake Pollution &nbsp;·&nbsp; 🚦 Traffic Chaos &nbsp;·&nbsp; 🏗️ Footpath Missing &nbsp;·&nbsp; 🌿 Tree Cutting
        </div>
      </div>

      {/* How It Works — Better Than NammaKasa */}
      <section className="w-full bg-[#f5f3ea] py-20 px-4 md:px-8 border-b border-forest/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-forest/10 text-forest text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Photo. Pin. Pressure. Done.</div>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-[#1a3a2a]">How to force government action</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-ash/30 shadow-sm hover:-translate-y-2 transition-all">
              <div className="text-4xl mb-4">📸</div>
              <div className="text-xs font-bold text-forest/50 uppercase tracking-widest mb-1">Step 1</div>
              <h3 className="font-bold text-xl text-[#1a3a2a] mb-2">Report Instantly</h3>
              <p className="text-[#1a3a2a]/70 font-medium leading-relaxed text-sm">Take a photo. Share your GPS location. Describe the issue in your own words. No account needed.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ash/30 shadow-sm md:mt-4 hover:-translate-y-2 transition-all">
              <div className="text-4xl mb-4">🗺️</div>
              <div className="text-xs font-bold text-forest/50 uppercase tracking-widest mb-1">Step 2</div>
              <h3 className="font-bold text-xl text-[#1a3a2a] mb-2">Auto Ward Detection</h3>
              <p className="text-[#1a3a2a]/70 font-medium leading-relaxed text-sm">We pinpoint your BBMP ward, your MLA, your MP, and the exact authority responsible — automatically.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ash/30 shadow-sm md:mt-8 hover:-translate-y-2 transition-all">
              <div className="text-4xl mb-4">🔥</div>
              <div className="text-xs font-bold text-forest/50 uppercase tracking-widest mb-1">Step 3</div>
              <h3 className="font-bold text-xl text-[#1a3a2a] mb-2">Rally Citizens</h3>
              <p className="text-[#1a3a2a]/70 font-medium leading-relaxed text-sm">Share instantly on WhatsApp & X. Community upvotes amplify your report. More voices = more pressure.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ash/30 shadow-sm md:mt-12 hover:-translate-y-2 transition-all border-b-4 border-b-gold">
              <div className="text-4xl mb-4">📢</div>
              <div className="text-xs font-bold text-forest/50 uppercase tracking-widest mb-1">Step 4</div>
              <h3 className="font-bold text-xl text-[#1a3a2a] mb-2">Force Action</h3>
              <p className="text-[#1a3a2a]/70 font-medium leading-relaxed text-sm">We auto-tag the MLA on X, draft a WhatsApp message, and generate a formal email to the authority. They can't hide.</p>
            </div>
          </div>

          {/* BrokenBanglore vs NammaKasa */}
          <div className="mt-16 bg-white rounded-3xl p-8 border border-forest/10 shadow-sm">
            <h3 className="font-display font-bold text-2xl text-[#1a3a2a] mb-6 text-center">Why BrokenBanglore is different</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex flex-col gap-2 p-4 bg-forest/5 rounded-2xl">
                <div className="text-2xl mb-1">🌐</div>
                <div className="font-bold text-[#1a3a2a]">Every civic issue. Not just garbage.</div>
                <div className="text-[#1a3a2a]/60 font-medium">Roads, water, power, lakes, traffic — all in one place. NammaKasa only tracks garbage.</div>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-forest/5 rounded-2xl">
                <div className="text-2xl mb-1">⚖️</div>
                <div className="font-bold text-[#1a3a2a]">MLA + MP both held accountable.</div>
                <div className="text-[#1a3a2a]/60 font-medium">We track both your state MLA and Lok Sabha MP — two pressure points, not one.</div>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-forest/5 rounded-2xl">
                <div className="text-2xl mb-1">📊</div>
                <div className="font-bold text-[#1a3a2a]">Public performance dashboard.</div>
                <div className="text-[#1a3a2a]/60 font-medium">Live scores, petitions, and resolution rates for every representative. Total transparency.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accountability Strip */}
      <section className="w-full bg-white py-16 px-4 md:px-8 border-b border-forest/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-display font-bold text-3xl text-[#1a3a2a] mb-2">Government Response Index</h2>
              <p className="text-bright font-semibold">Tracking transparency across Bangalore's wards.</p>
            </div>
            <Link to="/accountability" className="hidden md:inline-flex bg-forest text-gold px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#1a3a2a] transition-colors shadow-sm">
              View Full Leaderboard →
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {[
              { name: "S. Raghu", party: "BJP", color: "#f97316", ward: 52, zone: "East", rate: 0 },
              { name: "Satish Reddy M", party: "BJP", color: "#f97316", ward: 150, zone: "South", rate: 0 },
              { name: "Ramalinga Reddy", party: "INC", color: "#2563eb", ward: 68, zone: "South", rate: 0 },
              { name: "Manjula S.", party: "BJP", color: "#f97316", ward: 99, zone: "East", rate: 0 },
              { name: "Suresha B S", party: "INC", color: "#2563eb", ward: 165, zone: "North", rate: 0 },
            ].map(mla => (
              <div key={mla.ward} className="min-w-[280px] bg-white rounded-2xl p-6 border border-forest/10 shadow-sm snap-start shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-strong/10 text-[#1a3a2a] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Ward {mla.ward}</div>
                  <div className="text-[10px] font-bold text-bright uppercase">{mla.zone} Zone</div>
                </div>
                <h3 className="font-display font-bold text-xl mb-1 text-[#1a3a2a]">{mla.name}</h3>
                <div className="flex items-center gap-1.5 mb-5">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: mla.color}}></span>
                  <span className="text-[10px] font-bold text-[#1a3a2a]/60 uppercase">{mla.party} MLA</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-[#1a3a2a]/70">RESOLUTION RATE</span>
                      <span className="text-red-600">{mla.rate}%</span>
                    </div>
                    <div className="w-full bg-forest/5 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{width: `${mla.rate}%`}}></div>
                    </div>
                  </div>
                  <Link to="/accountability" className="w-full py-2 bg-white border border-forest/20 rounded-lg text-xs font-bold text-[#1a3a2a] hover:bg-forest/5 transition-colors block text-center">
                    View Citizen Audit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Every Ward — FULLY VISIBLE on dark green bg */}
      <section className="w-full py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#1a3a2a] rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-block bg-gold/20 text-gold text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">243 Wards Mapped</div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white">Every Ward. No Exceptions.</h2>
              <p className="text-white/80 max-w-xl mb-8 font-semibold">We've mapped all 243 BBMP wards. Find yours, see your MLA and MP, and hold them accountable today.</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {['Mahadevapura', 'Bommanahalli', 'RR Nagar', 'Yelahanka', 'Dasarahalli', 'Byatarayanapura', 'Bangalore South', 'Yeshwanthpur'].map(zone => (
                  <div
                    key={zone}
                    onClick={() => setSelectedZoneMLA(completeMLAList.find(m => m.constituency === zoneLookup[zone]))}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 rounded-2xl hover:bg-white hover:-translate-y-1 hover:shadow-2xl transition-all cursor-pointer group flex flex-col relative overflow-hidden"
                  >
                    <div className="font-bold text-base md:text-lg mb-1 relative z-10 group-hover:text-[#1a3a2a] text-white transition-colors">{zone}</div>
                    <div className="text-[10px] md:text-xs uppercase font-bold tracking-widest relative z-10 text-gold group-hover:text-[#1a3a2a]/60 transition-colors mt-auto pt-4 flex justify-between items-center">
                      <span>0 Reports</span>
                      <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#1a3a2a]">➔</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedZoneMLA && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setSelectedZoneMLA(null)}>
                  <div className="bg-white text-forest p-6 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedZoneMLA(null)} className="absolute top-4 right-4 text-[#1a3a2a]/40 hover:text-red-500 hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all">✕</button>

                    <div className="flex flex-col items-center mb-6 mt-2">
                      <div className="relative">
                        <img
                          src={selectedZoneMLA.photo}
                          alt={selectedZoneMLA.mla}
                          className="w-28 h-28 rounded-full object-cover shadow-xl bg-ash/20 border-4"
                          style={{borderColor: selectedZoneMLA.partyColor}}
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedZoneMLA.mla)}&background=${selectedZoneMLA.partyColor.replace('#', '')}&color=fff&size=200`; }}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md">
                          <div className="w-4 h-4 rounded-full" style={{backgroundColor: selectedZoneMLA.partyColor}}></div>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <h3 className="font-display text-2xl font-bold leading-tight uppercase tracking-tight text-[#1a3a2a]">{selectedZoneMLA.mla}</h3>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold mt-1.5 px-3 py-1 rounded-full bg-ash/20 w-max mx-auto border border-ash/30 text-[#1a3a2a]">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: selectedZoneMLA.partyColor}}></div>
                          {selectedZoneMLA.party} MLA
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 bg-forest/5 rounded-2xl p-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-[#1a3a2a]/50">Constituency (AC)</div>
                        <div className="font-bold text-[#1a3a2a]">{selectedZoneMLA.constituency} <span className="opacity-50 text-sm">· AC {selectedZoneMLA.constNo}</span></div>
                      </div>
                      <div className="border-t border-forest/10 pt-3">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-[#1a3a2a]/50">MP (Lok Sabha 2024)</div>
                        <div className="font-bold text-[#1a3a2a]">{selectedZoneMLA.mp || 'P. C. Mohan'}</div>
                        <div className="text-xs text-[#1a3a2a]/60 font-semibold">{selectedZoneMLA.mpConstituency} · {selectedZoneMLA.mpParty || 'BJP'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <div className="text-[10px] uppercase font-bold text-red-700/60 tracking-wider">Open Issues</div>
                          <div className="font-bold text-2xl text-red-600 font-display mt-1">{stats.reports}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                          <div className="text-[10px] uppercase font-bold text-green-700/60 tracking-wider">Resolved</div>
                          <div className="font-bold text-2xl text-green-600 font-display mt-1">{stats.resolved}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link to="/map" className="w-full bg-[#1a3a2a] text-gold py-3.5 rounded-2xl font-bold flex justify-center items-center hover:bg-black transition-colors shadow">
                        📍 Investigate Local Wards
                      </Link>
                      <Link to="/report" className="w-full bg-red-50 border-2 border-red-200 text-red-700 py-3.5 rounded-2xl font-bold flex justify-center items-center hover:bg-red-100 transition-colors">
                        📸 Report a Problem Here
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <Link to="/accountability" className="mt-10 bg-gold text-[#1a3a2a] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform inline-block hover:shadow-lg">
                Enter the Full Ward Directory →
              </Link>
            </div>

            {/* BG decorations */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-bright rounded-full blur-3xl opacity-10"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold rounded-full blur-3xl opacity-5"></div>
          </div>
        </div>
      </section>

      {/* Problem Categories */}
      <section className="w-full py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-[#1a3a2a] mb-4 text-center">What's broken near you?</h2>
          <p className="text-center text-[#1a3a2a]/60 font-semibold mb-10">Tap a category to view and report issues in your ward.</p>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { id: "roads", label: "Roads & Potholes", emoji: "🚧", count: 0, color: "#2B9348" },
              { id: "water", label: "Water Supply", emoji: "💧", count: 0, color: "#55A630" },
              { id: "garbage", label: "Garbage & Waste", emoji: "🗑️", count: 0, color: "#80B918" },
              { id: "power", label: "Power Cuts", emoji: "⚡", count: 0, color: "#E9C46A" },
              { id: "environment", label: "Lakes & Environs", emoji: "🌊", count: 0, color: "#2B9348" },
              { id: "traffic", label: "Traffic Chaos", emoji: "🚦", count: 0, color: "#55A630" },
            ].map(cat => (
              <Link to={`/report`} key={cat.id} className="bg-white rounded-2xl p-6 border border-[#1a3a2a]/15 hover:border-[#1a3a2a] hover:shadow-lg transition-all group flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{backgroundColor: cat.color}}></div>
                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                <h3 className="font-bold text-lg text-[#1a3a2a] m-0">{cat.label}</h3>
                <span className="text-sm font-semibold text-[#1a3a2a]/60 mt-2 bg-[#1a3a2a]/5 px-3 py-1 rounded-full">{cat.count} Reports</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 md:px-8 border-t border-[#1a3a2a]/10 bg-[#f5f3ea]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/3">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-[#1a3a2a] mb-6">Real problems.<br/>Real time.</h2>
            <p className="text-[#1a3a2a]/80 text-lg mb-8 font-semibold">Citizens are reporting issues across Bangalore. Every pin dropped is an email to an MLA.</p>
            <Link to="/map" className="bg-[#1a3a2a] text-white px-6 py-4 rounded-xl font-bold inline-flex items-center gap-2 transition-colors hover:bg-black">
              View Live Map 📍
            </Link>
          </div>

          <div className="lg:w-2/3 flex flex-col gap-4">
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-[#1a3a2a]/20 flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-4">✨</span>
              <h3 className="font-bold text-xl text-[#1a3a2a]/60">No recent reports yet.</h3>
              <p className="text-sm text-[#1a3a2a]/40 font-semibold mt-2">Be the first to voice your ward's concerns.</p>
              <Link to="/report" className="mt-6 bg-forest text-gold px-6 py-3 rounded-xl font-bold hover:bg-[#1a3a2a] transition-colors">
                File the First Report →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
