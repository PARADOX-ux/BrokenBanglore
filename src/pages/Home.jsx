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

      {/* 243 Wards Mapped Section - High Stakes Branding */}
      <section className="w-full py-20 px-4 md:px-8 bg-black/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row bg-white rounded-[40px] overflow-hidden shadow-2xl border-4 border-black">
          
          <div className="md:w-1/3 bg-forest text-gold p-8 md:p-12 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black">
            <div>
              <div className="font-display font-black text-5xl md:text-8xl mb-4 leading-[0.8] tracking-tighter uppercase italic flex flex-col">
                <span className="text-bright">243</span>
                <span className="text-white">Wards</span>
                <span className="text-gold">Mapped</span>
              </div>
              <div className="w-20 h-2 bg-gold mb-8"></div>
              <p className="text-xl font-black leading-tight uppercase tracking-tight text-white">The Administrative Accountability Scoreboard</p>
            </div>
            
            <div className="mt-12 space-y-4">
              <div className="flex justify-between items-end border-b-2 border-black/20 pb-2">
                <span className="text-xs uppercase font-black tracking-widest text-gold">Live Reports</span>
                <span className="text-3xl font-display font-black text-white">{stats.reports}</span>
              </div>
              <div className="flex justify-between items-end border-b-2 border-black/20 pb-2">
                <span className="text-xs uppercase font-black tracking-widest text-gold">Resolved Rate</span>
                <span className="text-3xl font-display font-black text-bright">{stats.resolved > 0 ? Math.round((stats.resolved/stats.reports)*100) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="md:w-2/3 p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                <h3 className="font-display font-black text-4xl text-black uppercase tracking-tighter leading-none">MLA Resolution Hub</h3>
                <p className="text-black font-bold italic text-sm mt-2 opacity-70">Pick a zone. See who is working for you — or ignoring you.</p>
              </div>
              <Link to="/accountability" className="bg-black text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-forest transition-colors flex-shrink-0">Full Audit →</Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(zoneLookup).map(([disp, key]) => {
                const mla = completeMLAList.find(m => m.constituency === key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedZoneMLA(mla)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left group flex flex-col justify-between h-32 ${selectedZoneMLA?.constituency === key ? 'border-black bg-gold/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-black/10 bg-black/5 hover:border-black hover:bg-white'}`}
                  >
                    <div className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none">{disp}</div>
                    <div className="font-display font-black text-xl text-black uppercase leading-none break-words line-clamp-2">
                        {mla ? mla.mla.split(' ').pop() : 'MLA'}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedZoneMLA ? (
              <div className="mt-8 bg-white rounded-[32px] p-6 border-4 border-black flex flex-col md:flex-row items-center gap-8 animate-in zoom-in-95 duration-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-4 border-black bg-black">
                  <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-display font-black text-2xl lg:text-4xl text-black mb-1 uppercase tracking-tight leading-none">{selectedZoneMLA.mla}</h4>
                  <div className="text-xs font-black text-black opacity-60 uppercase tracking-widest mb-4">{selectedZoneMLA.constituency} • {selectedZoneMLA.party}</div>
                  <div className="flex gap-6 justify-center md:justify-start">
                    <div>
                      <div className="text-2xl font-display font-black text-black">{selectedZoneMLA.resolvedReports}/{selectedZoneMLA.totalReports}</div>
                      <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">Fixed Issues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-black text-red-600">0%</div>
                      <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">Audit Score</div>
                    </div>
                  </div>
                </div>
                <Link to="/map" className="w-full md:w-auto bg-forest text-gold px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-lg uppercase tracking-widest border-2 border-black">
                  Act Now →
                </Link>
              </div>
            ) : (
              <div className="mt-8 bg-black/[0.02] border-4 border-dashed border-black/10 rounded-[32px] py-16 flex flex-col items-center justify-center text-center">
                 <span className="text-4xl mb-4 grayscale">🏛️</span>
                 <p className="text-black font-black uppercase tracking-[0.2em] text-sm opacity-20">Pick a zone to begin the audit</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="w-full py-20 px-4 md:px-8 border-t-8 border-black bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="text-center">
            <div className="text-6xl font-display font-black text-black mb-2 leading-none">0</div>
            <div className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Reports</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-forest mb-2 leading-none">0</div>
            <div className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Petitions</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-black mb-2 leading-none">0</div>
            <div className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Citizens</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-display font-black text-bright mb-2 leading-none">0%</div>
            <div className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">Solved</div>
          </div>
        </div>
      </section>
    </div>
  );
}
