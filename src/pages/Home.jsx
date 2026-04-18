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
    { text: "Fixing the city, one ward at a time.", author: "BrokenBanglore" }
  ];

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="w-full bg-white px-4 md:px-8 py-20 md:py-32 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>

        <div className="relative z-10 mb-6 inline-flex items-center gap-2 bg-red-100 text-red-900 border border-red-200 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-tight">
          Your photo. Your ward. Their problem to fix.
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl text-black mb-6 tracking-tighter relative z-10 max-w-5xl leading-[0.9]">
          Bengaluru is broken. <br className="hidden md:block"/>
          <span className="text-forest relative inline-block">
            We're fixing it.
            <span className="absolute -bottom-4 left-0 w-full h-1 md:h-2 bg-gold -z-10"></span>
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

      {/* Rebuilt Audit Hub - No Overlap */}
      <section className="w-full py-16 px-4 md:px-8 bg-black/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row bg-white rounded-[40px] overflow-hidden shadow-2xl border-4 border-black min-h-[500px]">
          
          {/* Left Panel: High Impact Status */}
          <div className="md:w-[350px] bg-forest text-gold p-8 md:p-10 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0">
            <div>
              <h2 className="font-display font-black text-5xl mb-4 leading-none tracking-tighter uppercase italic">
                CIVIC <br/>
                <span className="text-white">ACTION</span> <br/>
                AUDIT
              </h2>
              <div className="w-16 h-2 bg-gold mb-8"></div>
              <p className="text-sm font-black leading-tight uppercase tracking-tight text-white mb-2">Live Status Tracking</p>
              <p className="text-xs font-bold text-white/50 uppercase leading-none">Testing Phase • Launch 2024</p>
            </div>
            
            <div className="mt-12 space-y-6">
              <div className="flex justify-between items-end border-b-2 border-black/20 pb-2">
                <span className="text-xs uppercase font-black tracking-widest text-gold text-left">Reports <br/> Filed</span>
                <span className="text-4xl font-display font-black text-white">{stats.reports}</span>
              </div>
              <div className="flex justify-between items-end border-b-2 border-black/20 pb-2">
                <span className="text-xs uppercase font-black tracking-widest text-gold text-left">Resolution <br/> Speed</span>
                <span className="text-4xl font-display font-black text-white">0%</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Leader Hub */}
          <div className="flex-1 p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                <h3 className="font-display font-black text-3xl md:text-4xl text-black uppercase tracking-tighter leading-none">MLA RESOLUTION HUB</h3>
                <p className="text-black font-bold italic text-sm mt-3 opacity-60">Pick a zone. See who is working — or ignoring you.</p>
              </div>
              <Link to="/accountability" className="bg-black text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-forest transition-colors flex-shrink-0">Full Audit →</Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(zoneLookup).map(([disp, key]) => {
                const mla = completeMLAList.find(m => m.constituency === key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedZoneMLA(mla)}
                    className={`p-5 rounded-2xl border-4 transition-all text-left flex flex-col justify-between h-36 ${selectedZoneMLA?.constituency === key ? 'border-black bg-gold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1' : 'border-black/10 bg-black/5 hover:border-black hover:bg-white'}`}
                  >
                    <div className="text-[10px] font-black text-black/50 uppercase tracking-widest leading-none">{disp}</div>
                    <div className="font-display font-black text-xl text-black uppercase leading-none break-words">
                        {mla ? mla.mla.split(' ').pop() : 'MLA'}
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
                  <h4 className="font-display font-black text-3xl text-black mb-1 uppercase tracking-tight leading-none">{selectedZoneMLA.mla}</h4>
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

      {/* Voice of Bengaluru - Quotes Section */}
      <section className="w-full py-24 px-4 md:px-8 bg-white overflow-hidden">
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

      {/* Bottom Stats Footer */}
      <section className="w-full py-16 px-4 md:px-8 border-t-8 border-black bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="text-center">
            <div className="text-6xl font-display font-black text-black mb-2 leading-none">0</div>
            <div className="text-xs font-black text-black uppercase tracking-[0.2em]">REPORTS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-forest mb-2 leading-none">0</div>
            <div className="text-xs font-black text-black uppercase tracking-[0.2em]">PETITIONS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-black mb-2 leading-none">0</div>
            <div className="text-xs font-black text-black uppercase tracking-[0.2em]">CITIZENS</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-forest mb-2 leading-none">0%</div>
            <div className="text-xs font-black text-black uppercase tracking-[0.2em]">SOLVED</div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-20 pt-10 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
             <div className="font-display font-black text-2xl text-black">BROKENBANGLORE</div>
             <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Built for Bengaluru by Citizens • Established 2024</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-black/60">
             <a href="#" className="hover:text-forest transition-colors">Privacy</a>
             <a href="#" className="hover:text-forest transition-colors">Audit Policy</a>
             <a href="#" className="hover:text-forest transition-colors">Open Data</a>
          </div>
        </div>
      </section>
    </div>
  );
}
