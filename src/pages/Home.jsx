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
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1a3a2a 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>

        <div className="relative z-10 mb-6 inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-sm font-bold">
          Your photo. Your ward. Their problem to fix.
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl text-forest mb-6 tracking-tighter relative z-10 max-w-5xl">
          Bengaluru is broken. <br className="hidden md:block"/>
          <span className="text-forest relative inline-block">
            We're fixing it.
            <span className="absolute -bottom-4 left-0 w-full h-3 md:h-6 bg-gold/60 -rotate-1 -z-10"></span>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#1a3a2a]/80 max-w-2xl mb-12 font-semibold relative z-10">
          Report problems. Sign petitions. Reach your MLA. <br className="hidden md:block" /> Make the government move.
        </p>

        <div className="flex flex-col md:flex-row gap-4 relative z-10 w-full md:w-auto px-6">
          <Link to="/report" className="bg-forest text-gold px-10 py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:-translate-y-1 text-center">
            Report a Problem →
          </Link>
          <Link to="/map" className="bg-white text-forest border-2 border-forest px-10 py-5 rounded-2xl font-bold text-lg hover:bg-forest/5 transition-all text-center">
            Explore the Map
          </Link>
        </div>
      </section>

      {/* 243 Wards Mapped Section - High Stakes Branding */}
      <section className="w-full py-20 px-4 md:px-8 bg-strong/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row bg-white rounded-[40px] overflow-hidden shadow-2xl border border-white">
          
          <div className="md:w-1/3 bg-forest text-gold p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gold/10">
            <div>
              <h2 className="font-display font-bold text-5xl md:text-6xl mb-4 leading-none tracking-tighter uppercase italic">243 <br/> Wards <br/> Mapped</h2>
              <div className="w-16 h-1 bg-bright mb-6"></div>
              <p className="text-xl font-bold leading-tight uppercase tracking-tight text-white/90">The Administrative Accountability Scoreboard</p>
            </div>
            
            <div className="mt-12 space-y-4">
              <div className="flex justify-between items-end border-b border-gold/20 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold/60">Live Reports</span>
                <span className="text-2xl font-display font-bold">{stats.reports}</span>
              </div>
              <div className="flex justify-between items-end border-b border-gold/20 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold/60">Resolved Rate</span>
                <span className="text-2xl font-display font-bold text-bright">{stats.resolved > 0 ? Math.round((stats.resolved/stats.reports)*100) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="md:w-2/3 p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h3 className="font-display font-bold text-3xl text-forest uppercase tracking-tight">MLA Resolution Hub</h3>
                <p className="text-forest/60 font-semibold italic text-sm mt-1">Select your administrative zone to see who is working for you — or ignoring you.</p>
              </div>
              <Link to="/accountability" className="text-forest font-bold text-sm border-b-2 border-forest hover:text-black transition-colors">Full Auditor’s Report →</Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(zoneLookup).map(([disp, key]) => {
                const mla = completeMLAList.find(m => m.constituency === key);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedZoneMLA(mla)}
                    className="p-4 rounded-3xl border-2 border-forest/5 bg-forest/5 hover:border-forest hover:bg-white transition-all text-left group"
                  >
                    <div className="text-[10px] font-bold text-forest/40 uppercase mb-5 tracking-widest">{disp}</div>
                    <div className="font-display font-bold text-lg text-forest group-hover:text-black leading-none mb-1">{mla ? mla.mla.split(' ').pop() : 'MLA'}</div>
                    <div className="w-8 h-0.5 bg-forest/20 group-hover:bg-forest transition-all"></div>
                  </button>
                );
              })}
            </div>

            {selectedZoneMLA ? (
              <div className="mt-8 bg-tea/10 rounded-[32px] p-6 border border-forest/10 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-forest/20">
                  <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-display font-bold text-2xl text-forest mb-1">{selectedZoneMLA.mla}</h4>
                  <div className="text-xs font-bold text-forest/50 uppercase tracking-widest mb-3">{selectedZoneMLA.constituency} • {selectedZoneMLA.party}</div>
                  <div className="flex gap-4 justify-center md:justify-start">
                    <div>
                      <div className="text-lg font-display font-bold text-forest">{selectedZoneMLA.resolvedReports}/{selectedZoneMLA.totalReports}</div>
                      <div className="text-[9px] font-bold text-forest/40 uppercase">Resolved</div>
                    </div>
                    <div>
                      <div className="text-lg font-display font-bold text-red-600">0%</div>
                      <div className="text-[9px] font-bold text-forest/40 uppercase">Score</div>
                    </div>
                  </div>
                </div>
                <Link to="/map" className="bg-forest text-gold px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                  Report in this Ward →
                </Link>
              </div>
            ) : (
              <div className="mt-8 bg-forest/[0.02] border border-dashed border-forest/10 rounded-[32px] py-12 flex flex-col items-center justify-center text-center">
                 <span className="text-3xl mb-3 opacity-30">👆</span>
                 <p className="text-forest/30 font-bold uppercase tracking-widest text-xs">Pick a zone to begin the audit</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="w-full py-16 px-4 md:px-8 border-t border-forest/10 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-display font-bold text-forest mb-2">{stats.reports}</div>
            <div className="text-xs font-bold text-forest/40 uppercase tracking-widest">Active Reports</div>
          </div>
          <div className="text-center md:border-x border-forest/10">
            <div className="text-4xl md:text-5xl font-display font-bold text-gold mb-2">{stats.petitions}</div>
            <div className="text-xs font-bold text-forest/40 uppercase tracking-widest">Movements Started</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-display font-bold text-forest mb-2">{stats.citizens}</div>
            <div className="text-xs font-bold text-forest/40 uppercase tracking-widest">Active Citizens</div>
          </div>
          <div className="text-center border-l md:border-l border-forest/10">
            <div className="text-4xl md:text-5xl font-display font-bold text-bright mb-2">{stats.resolved}</div>
            <div className="text-xs font-bold text-forest/40 uppercase tracking-widest">Fixed Problems</div>
          </div>
        </div>
      </section>
    </div>
  );
}
