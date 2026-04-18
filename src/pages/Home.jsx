import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { completeMLAList, getStats } from '../data/wardData';

export default function Home() {
  const [selectedZoneMLA, setSelectedZoneMLA] = useState(null);
  const [stats, setStats] = useState({ reports: 0, petitions: 0, citizens: 0, resolved: 0 });

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

  const quotes = [
    { text: "Bengaluru doesn't need more promises, it needs accountability.", author: "Public Audit 2024" },
    { text: "Your silence is their comfort. Your report is their deadline.", author: "Citizen Command" },
    { text: "If we don't fix it, our children will pay for it.", author: "Voice of Bengaluru" },
    { text: "Pressure works. Public data works. BrokenBanglore works.", author: "Community Lead" }
  ];

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-[#fdfbf6] text-black">
      {/* Hero Section */}
      <section className="w-full bg-[#fdfbf6] px-4 md:px-8 py-20 md:py-32 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>

        <div className="relative z-10 mb-6 inline-flex items-center gap-2 bg-red-100 text-red-900 border border-red-200 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-tight">
          Your photo. Your ward. Their problem to fix.
        </div>

        <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-black mb-6 tracking-tighter relative z-10 max-w-5xl leading-[0.95]">
          Bengaluru is broken. <br className="hidden md:block"/>
          <span className="text-forest relative inline-block">
            We're fixing it.
            <span className="absolute -bottom-4 left-0 w-full h-1 md:h-1.5 bg-gold -z-10"></span>
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-black font-bold max-w-2xl mb-12 relative z-10">
          Report problems. Sign petitions. Reach your MLA. <br className="hidden md:block" /> Make the government move.
        </p>

        <div className="flex flex-col md:flex-row gap-4 relative z-10 w-full md:w-auto px-6">
          <Link to="/report" className="bg-forest text-gold px-10 py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl hover:-translate-y-1 text-center uppercase tracking-tight">
            Report a Problem →
          </Link>
          <Link to="/map" className="bg-white text-black border-4 border-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-black hover:text-white transition-all text-center uppercase tracking-tight">
            Explore the Map
          </Link>
        </div>
      </section>

      {/* Audit Hub - Structured Grid */}
      <section className="w-full py-16 px-4 md:px-8 bg-black/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row bg-white rounded-[40px] overflow-hidden shadow-2xl border-4 border-black min-h-[500px]">
          
          {/* Left Panel: Direct & Bold */}
          <div className="md:w-[350px] bg-forest p-10 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            
            <div>
              <div className="flex flex-col gap-1 mb-8">
                <span className="bg-bright text-white px-4 py-1.5 font-display font-black text-4xl leading-none w-fit shadow-lg rotate-1">CIVIC</span>
                <span className="bg-white text-forest px-4 py-1.5 font-display font-black text-4xl leading-none w-fit shadow-lg -rotate-1">ACTION</span>
              </div>
              
              <div className="w-12 h-1.5 bg-gold mb-8"></div>
              
              <div className="space-y-4">
                <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Status Tracking</p>
                  <p className="text-sm font-bold text-black uppercase italic">Testing Phase • Launch 2024</p>
                </div>
                <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Audit Coverage</p>
                   <p className="text-sm font-bold text-white uppercase italic">243 Wards Mapped</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 space-y-8">
              <div className="group cursor-help">
                <div className="flex justify-between items-end border-b-2 border-white/10 pb-3 transition-colors group-hover:border-gold">
                  <span className="text-xs uppercase font-black tracking-widest text-gold/80 group-hover:text-gold text-left">Reports <br/> Filed</span>
                  <span className="text-5xl font-display font-black text-white leading-none">0</span>
                </div>
              </div>
              <div className="group cursor-help">
                <div className="flex justify-between items-end border-b-2 border-white/10 pb-3 transition-colors group-hover:border-gold">
                  <span className="text-xs uppercase font-black tracking-widest text-gold/80 group-hover:text-gold text-left">Resolution <br/> Speed</span>
                  <span className="text-5xl font-display font-black text-white leading-none">0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Clean Interactive Grid */}
          <div className="flex-1 p-8 md:p-12 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <h3 className="font-display font-black text-3xl md:text-5xl text-black uppercase tracking-tighter leading-tight">MLA RESOLUTION <br className="hidden md:block"/> HUB</h3>
                <p className="text-black/40 font-bold text-xs uppercase tracking-widest mt-4">Pick a zone. See who is working — or ignoring you.</p>
              </div>
              <Link to="/accountability" className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-forest transition-all hover:scale-105 shadow-xl shrink-0">Full Audit →</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 h-[550px] overflow-y-auto pr-4 custom-scrollbar bg-black/5 p-4 rounded-[2rem] border-2 border-dashed border-black/10">
              {completeMLAList.map((mla) => {
                const isSelected = selectedZoneMLA?.constituency === mla.constituency;
                return (
                  <button
                    key={mla.mla}
                    onClick={() => setSelectedZoneMLA(mla)}
                    onMouseEnter={() => setSelectedZoneMLA(mla)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-[240px] group relative overflow-hidden ${isSelected ? 'border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1' : 'border-black/10 bg-white hover:border-black/30 hover:shadow-lg'}`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-black opacity-[0.03] -mr-8 -mt-8 rounded-full"></div>
                    
                    {/* Leader Photo in Selection Grid */}
                    <div className={`w-20 h-20 rounded-2xl overflow-hidden mb-4 border-2 transition-transform group-hover:scale-105 ${isSelected ? 'border-forest' : 'border-black/5'}`}>
                      <img src={mla.photo} alt={mla.mla} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    </div>

                    <div className="flex-1">
                      <div className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] leading-none mb-2">{mla.constituency}</div>
                      <div className="font-display font-black text-lg text-black uppercase leading-tight group-hover:text-forest transition-colors break-words">
                          {mla.mla}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border border-black/10 ${mla.party === 'BJP' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                         {mla.party}
                       </span>
                       {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse"></div>}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedZoneMLA ? (
              <div className="mt-8 bg-white rounded-[32px] p-6 border-4 border-black flex flex-col md:flex-row items-center gap-8 animate-in zoom-in-95 duration-200 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-4 border-black bg-black">
                  <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-display font-black text-3xl text-black mb-1 uppercase tracking-tight leading-none break-words">{selectedZoneMLA.mla}</h4>
                  <div className="text-xs font-black text-black/50 uppercase tracking-widest mb-4 mt-2">{selectedZoneMLA.constituency} • {selectedZoneMLA.party}</div>
                  <div className="flex gap-8 justify-center md:justify-start">
                    <div>
                      <div className="text-2xl font-display font-black text-black">0/0</div>
                      <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">Fixed Issues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-black text-red-600">0%</div>
                      <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">Audit Score</div>
                    </div>
                  </div>
                </div>
                <Link to="/map" className="w-full md:w-auto bg-forest text-gold px-10 py-5 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-lg uppercase tracking-widest border-2 border-black">
                  ACT NOW →
                </Link>
              </div>
            ) : (
              <div className="mt-8 bg-black/[0.02] border-4 border-dashed border-black/10 rounded-[32px] py-16 flex flex-col items-center justify-center text-center">
                 <span className="text-4xl mb-4 grayscale">🏛️</span>
                 <p className="text-black font-black uppercase tracking-[0.2em] text-sm opacity-20 italic">Select your area to begin the audit</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Voice of Bengaluru - Quotes */}
      <section className="w-full py-24 px-4 md:px-8 bg-[#fdfbf6]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="font-display font-black text-4xl md:text-6xl text-black uppercase tracking-tighter mb-12">
            "Voices of Bengaluru"
          </div>
          <div className="grid gap-12">
            {quotes.map((q, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                <div className="text-2xl md:text-4xl font-display font-black text-forest italic leading-tight group-hover:scale-105 transition-transform">
                   "{q.text}"
                </div>
                <div className="text-xs font-black uppercase tracking-[0.3em] text-black/40">
                  — {q.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Stats - Cream BG */}
      <section className="w-full py-16 px-4 md:px-8 border-t-8 border-black bg-[#fdfbf6]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-black">
          <div className="text-center">
            <div className="text-6xl font-display font-black mb-2 leading-none">0</div>
            <div className="text-xs font-black uppercase tracking-[0.2em]">REPORTS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-forest mb-2 leading-none">0</div>
            <div className="text-xs font-black uppercase tracking-[0.2em]">PETITIONS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black mb-2 leading-none">0</div>
            <div className="text-xs font-black uppercase tracking-[0.2em]">CITIZENS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-forest mb-2 leading-none">0%</div>
            <div className="text-xs font-black uppercase tracking-[0.2em]">SOLVED</div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-20 pt-10 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
             <div className="font-display font-black text-2xl text-black uppercase tracking-tighter">BROKENBANGLORE</div>
             <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Built for Bengaluru by Citizens • Established 2024</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-black/60">
             <a href="https://bbmp.gov.in" target="_blank" rel="noreferrer" className="hover:text-forest transition-colors">BBMP</a>
             <a href="https://bwssb.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-forest transition-colors">BWSSB</a>
             <a href="https://bescom.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-forest transition-colors">BESCOM</a>
          </div>
        </div>
      </section>
    </div>
  );
}
