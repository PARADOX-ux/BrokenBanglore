import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import * as anime from 'animejs';
import { completeMLAList, getStats } from '../data/wardData';

export default function Home() {
  const [selectedZoneMLA, setSelectedZoneMLA] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ reports: 0, petitions: 0, citizens: 0, resolved: 0 });
  const gridRef = useRef(null);

  useEffect(() => {
    setStats(getStats());
    
    // Fetch real reports for MLA stats
    import('../lib/reportsDb').then(m => {
      m.getReports().then(setReports);
    });

    const handler = (e) => setStats(e.detail);
    window.addEventListener('bb-stats-update', handler);

    // Anime.js: Staggered reveal for MLA grid
    if (gridRef.current) {
      anime.animate('.mla-card', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(20, {start: 500}), // Delay start for hero
        ease: 'outExpo',
        duration: 800
      });
    }

    return () => window.removeEventListener('bb-stats-update', handler);
  }, []);

  // Anime.js: Counter animation when MLA is selected
  useEffect(() => {
    if (selectedZoneMLA) {
      const statsElements = document.querySelectorAll('.mla-stat-value');
      statsElements.forEach(el => {
        const targetValue = parseInt(el.getAttribute('data-value') || '0');
        const obj = { val: 0 };
        anime.animate(obj, {
          val: targetValue,
          round: 1,
          ease: 'outExpo',
          duration: 1000,
          onRender: () => {
            el.innerHTML = obj.val + (el.classList.contains('is-percent') ? '%' : '');
          }
        });
      });
    }
  }, [selectedZoneMLA]);

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

  const quotes = [
    { text: "Bengaluru doesn't need more promises, it needs accountability.", author: "Public Audit 2024" },
    { text: "Your silence is their comfort. Your report is their deadline.", author: "Citizen Command" },
    { text: "If we don't fix it, our children will pay for it.", author: "Voice of Bengaluru" },
    { text: "Pressure works. Public data works. BrokenBengaluru works.", author: "Community Lead" }
  ];

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-[#fdfbf6] text-black">
      {/* Hero Section */}
      <section className="w-full min-h-[90vh] flex flex-col items-center justify-center text-center relative overflow-hidden px-4 md:px-8">
        {/* Cinematic Background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[2s] hover:scale-105"
          style={{ backgroundImage: `url('/bengaluru_premium_urban_fix_1776580119899.png')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-forest/60 via-forest/40 to-cream"></div>
        </div>

        <div className="relative z-10 space-y-8 max-w-6xl">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full text-xs md:text-sm font-black text-gold uppercase tracking-[0.3em] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="w-2 h-2 bg-bright rounded-full animate-pulse"></span>
            Real-time Civic Accountability
          </div>

          <h1 className="font-display font-black text-5xl md:text-8xl lg:text-9xl text-white mb-6 tracking-tighter leading-[0.85] uppercase">
            RECLAIM <br className="hidden md:block"/> 
            <span className="text-gold italic">BENGALURU</span>
          </h1>

          <p className="text-xl md:text-3xl text-white/90 font-bold max-w-3xl mx-auto mb-12 leading-tight">
            The platform that turns your reports into <br className="hidden md:block"/> mandatory government action.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link to="/report" className="bg-bright text-white px-12 py-6 rounded-2xl font-black text-lg hover:bg-white hover:text-bright transition-all shadow-2xl shadow-bright/40 text-center uppercase tracking-widest group">
              Submit Report <span className="inline-block group-hover:translate-x-2 transition-transform">→</span>
            </Link>
            <Link to="/map" className="glass text-white px-12 py-6 rounded-2xl font-black text-lg hover:bg-white hover:text-forest transition-all text-center uppercase tracking-widest">
              Live Audit Map
            </Link>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 hidden md:flex gap-12 text-white/60 font-black text-[10px] uppercase tracking-[0.4em]">
           <div>Resolved: <span className="text-gold">1,204</span></div>
           <div>Reports: <span className="text-bright">4,892</span></div>
           <div>Wards Audit: <span className="text-white">100%</span></div>
        </div>
      </section>

      {/* Audit Hub - Structured Grid */}
      <section className="w-full pt-12 md:pt-20 pb-20 px-4 md:px-8 bg-black/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row bg-white rounded-3xl md:rounded-[40px] overflow-hidden shadow-2xl border-4 border-black">
          
          {/* Left Panel: High Energy Citizen Voice */}
          <div className="md:w-[320px] bg-forest p-6 md:p-10 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="animate-in slide-in-from-left duration-500">
              <div className="flex flex-col gap-2 mb-10">
                <span className="bg-gold text-black px-4 py-2 font-display font-black text-5xl leading-none w-fit shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-2 uppercase tracking-tighter">WE SEE</span>
                <span className="bg-white text-forest px-4 py-2 font-display font-black text-5xl leading-none w-fit shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-3 uppercase tracking-tighter">YOU.</span>
              </div>
              
              <div className="space-y-6">
                <p className="text-xl md:text-2xl font-black text-white leading-[1.1] uppercase tracking-tight">
                  No more <span className="text-gold">Broken Roads</span><br/>
                  No more <span className="text-gold">Garbage</span><br/>
                  No more <span className="text-gold">Dark Streets</span>
                </p>
                
                <div className="h-1 w-full bg-white/10 rounded-full">
                  <div className="h-full bg-gold w-3/4 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 space-y-4">
              <div className="flex flex-col gap-3">
                 <div className="bg-white/10 border-2 border-dashed border-white/20 p-4 rounded-2xl">
                    <p className="text-xs font-black text-gold uppercase tracking-[0.2em] mb-1">Our Goal:</p>
                    <p className="text-lg font-black text-white uppercase leading-tight">FIX EVERYTHING NOW</p>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 text-white">
                    <span className="bg-black text-white px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest italic shadow-lg">Good Water</span>
                    <span className="bg-bright text-white px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest italic shadow-lg">Clean Parks</span>
                    <span className="bg-gold text-black px-3 py-1.5 rounded-lg border border-black text-[9px] font-black uppercase tracking-widest italic shadow-lg">Safe Walks</span>
                 </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Message To Government:</p>
                 <div className="bg-white p-4 rounded-xl border-4 border-black text-black text-xs font-bold uppercase tracking-tighter leading-tight flex items-center gap-3 shadow-[8px_8px_0px_0px_rgba(212,175,55,1)]">
                    <span className="text-2xl animate-bounce">📢</span>
                    WE ARE ALL <br/> WATCHING YOU.
                 </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Clean Interactive Grid */}
          <div className="flex-1 p-8 md:p-12 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <h3 className="font-display font-black text-3xl md:text-5xl text-black uppercase tracking-tighter leading-tight">ACCOUNTABILITY <br className="hidden md:block"/> HUB</h3>
                <p className="text-black/40 font-bold text-xs uppercase tracking-widest mt-4">Pick a zone. See who is working — or ignoring you.</p>
              </div>
              <Link to="/accountability" className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-forest transition-all hover:scale-105 shadow-xl shrink-0">Full Audit →</Link>
            </div>

            <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 h-[350px] md:h-[450px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar bg-ash/5 p-4 rounded-[2.5rem] border border-ash/20">
              {completeMLAList.map((mla) => {
                const isSelected = selectedZoneMLA?.constituency === mla.constituency;
                return (
                  <button
                    key={mla.constNo}
                    onClick={() => setSelectedZoneMLA(mla)}
                    className={`mla-card p-4 rounded-3xl border transition-all text-left flex flex-col justify-between min-h-0 md:min-h-[220px] group relative overflow-hidden opacity-0 ${isSelected ? 'border-forest bg-forest text-gold shadow-2xl' : 'border-ash/50 bg-white hover:border-bright hover:shadow-xl'}`}
                  >
                    <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl overflow-hidden mb-3 border-2 transition-transform duration-500 group-hover:scale-110 shrink-0 ${isSelected ? 'border-gold' : 'border-ash/20'}`}>
                      <img src={mla.photo} alt={mla.mla} className={`w-full h-full object-cover transition-all ${isSelected ? '' : 'grayscale group-hover:grayscale-0'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] mb-1 truncate ${isSelected ? 'text-gold/60' : 'text-forest/30'}`}>{mla.constituency}</div>
                      <div className={`font-display font-black text-xs md:text-base uppercase leading-tight transition-colors ${isSelected ? 'text-gold' : 'text-forest group-hover:text-bright'}`}>
                          {mla.mla}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                       <span className={`text-[8px] font-black px-3 py-1 rounded-full border ${isSelected ? 'border-gold/20 bg-gold/10 text-gold' : 'border-forest/10 bg-forest/5 text-forest/60'}`}>
                         {mla.party}
                       </span>
                       {isSelected && <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_rgba(244,211,94,1)]"></div>}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedZoneMLA ? (
              <div className="mt-8 bg-forest rounded-[2.5rem] p-6 md:p-10 border border-white/10 flex flex-col md:flex-row items-center gap-8 animate-in zoom-in-95 duration-500 premium-shadow">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shrink-0 border-4 border-gold bg-black shadow-2xl">
                  <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-display font-black text-2xl md:text-4xl text-gold mb-1 uppercase tracking-tighter leading-none">{selectedZoneMLA.mla}</h4>
                  <div className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-6 mt-2">{selectedZoneMLA.constituency} • {selectedZoneMLA.party}</div>
                  <div className="flex gap-12 justify-center md:justify-start">
                    {(() => {
                      const mlaReports = reports.filter(r => Number(r.ward_no) === Number(selectedZoneMLA.ward));
                      const total = mlaReports.length;
                      const fixed = mlaReports.filter(r => r.status === 'resolved').length;
                      const score = total > 0 ? Math.round((fixed / total) * 100) : 0;
                      
                      return (
                        <>
                          <div>
                            <div className="text-3xl font-display font-black text-white">
                              <span className="mla-stat-value" data-value={fixed}>{fixed}</span>/<span className="mla-stat-value" data-value={total}>{total}</span>
                            </div>
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Resolutions</div>
                          </div>
                          <div>
                            <div className="text-3xl font-display font-black text-bright">
                              <span className="mla-stat-value is-percent" data-value={score}>{score}%</span>
                            </div>
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Efficiency</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <Link to="/map" className="w-full md:w-auto bg-gold text-forest px-12 py-6 rounded-2xl font-extrabold text-sm hover:scale-105 transition-transform shadow-2xl uppercase tracking-[0.2em]">
                  View Ward Map
                </Link>
              </div>
            ) : (
              <div className="mt-8 bg-ash/5 border-2 border-dashed border-ash/20 rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl text-2xl">🏛️</div>
                 <p className="text-forest/40 font-black uppercase tracking-[0.3em] text-[10px]">Select an MLA intelligence node</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* THE DEMANDS - Simple & Powerful */}
      <section className="w-full py-32 px-4 md:px-8 bg-forest relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gold/20"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-block bg-gold/10 border border-gold/30 text-gold px-8 py-4 rounded-2xl font-display font-black text-2xl md:text-5xl uppercase tracking-tighter mb-16 rotate-1 premium-shadow">
            The Citizen Mandate
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="glass-dark p-10 rounded-[2.5rem] border-white/5 group hover:border-gold/30 transition-all duration-500">
               <div className="text-4xl font-black uppercase tracking-tighter text-gold mb-4 group-hover:scale-110 transition-transform origin-left">01. INFRASTRUCTURE</div>
               <p className="text-sm md:text-lg font-bold text-white/70 leading-relaxed uppercase tracking-wide">Pothole-free connectivity. Smooth arterial roads. Accessible sidewalks for every citizen.</p>
            </div>
            <div className="glass-dark p-10 rounded-[2.5rem] border-white/5 group hover:border-gold/30 transition-all duration-500">
               <div className="text-4xl font-black uppercase tracking-tighter text-white mb-4 group-hover:scale-110 transition-transform origin-left">02. ECOLOGY</div>
               <p className="text-sm md:text-lg font-bold text-white/70 leading-relaxed uppercase tracking-wide">Resilient garbage management. Revived lake ecosystems. 100% waste segregation adherence.</p>
            </div>
            <div className="glass-dark p-10 rounded-[2.5rem] border-white/5 group hover:border-gold/30 transition-all duration-500">
               <div className="text-4xl font-black uppercase tracking-tighter text-gold mb-4 group-hover:scale-110 transition-transform origin-left">03. SAFETY</div>
               <p className="text-sm md:text-lg font-bold text-white/70 leading-relaxed uppercase tracking-wide">100% street lighting coverage. Safe urban corridors for women and children at all hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL THE GOVT - Simple Action */}
      <section className="w-full py-32 px-4 md:px-8 bg-cream border-y border-ash/20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-5xl md:text-8xl font-display font-black text-forest uppercase tracking-tighter mb-8 italic">
            FORCE ACTION.
          </div>
          <p className="text-xl md:text-2xl font-bold text-forest/60 mb-12 max-w-2xl mx-auto leading-tight uppercase tracking-widest">Reach the authorities directly. <br/> Accountability is a right, not a favor.</p>
          <div className="flex flex-wrap gap-6 justify-center">
             <a href="https://bbmp.gov.in" target="_blank" rel="noreferrer" className="bg-forest text-gold px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-bright hover:text-white transition-all shadow-2xl shadow-forest/20">BBMP Connect</a>
             <a href="https://bwssb.karnataka.gov.in" target="_blank" rel="noreferrer" className="bg-forest text-gold px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-bright hover:text-white transition-all shadow-2xl shadow-forest/20">BWSSB Direct</a>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="w-full py-20 px-8 bg-forest text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="flex flex-col gap-4">
             <div className="font-display font-black text-3xl text-white uppercase tracking-tighter">BROKEN <span className="text-gold">BENGALURU</span></div>
             <p className="max-w-xs text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
               A high-fidelity civic accountability framework for the citizens of Bengaluru. 
               Verification through distributed intelligence.
             </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 font-black uppercase tracking-[0.2em] text-[10px]">
             <div className="flex flex-col gap-4">
                <span className="text-white">COMMAND</span>
                <Link to="/" className="hover:text-gold transition-colors">Strategic Home</Link>
                <Link to="/map" className="hover:text-gold transition-colors">Live Intelligence</Link>
                <Link to="/accountability" className="hover:text-gold transition-colors">Ward Audits</Link>
             </div>
             <div className="flex flex-col gap-4">
                <span className="text-white">COALITION</span>
                <Link to="/forum" className="hover:text-gold transition-colors">Citizen Forum</Link>
                <Link to="/petitions" className="hover:text-gold transition-colors">Petitions</Link>
                <Link to="/report" className="hover:text-gold transition-colors">New Report</Link>
             </div>
             <div className="flex flex-col gap-4">
                <span className="text-white">GOVERNMENT</span>
                <a href="https://bbmp.gov.in" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">BBMP</a>
                <a href="https://bwssb.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">BWSSB</a>
                <a href="https://bescom.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">BESCOM</a>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-20 pt-10 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em]">
           <span>Est. 2024 • Citizen Powered</span>
           <span className="text-bright">System Active</span>
        </div>
      </footer>
    </div>
  );
}
