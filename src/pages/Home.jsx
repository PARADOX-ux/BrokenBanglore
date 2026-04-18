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

  const slogans = [
    "WAKE UP BENGALURU",
    "FIX THE ROADS",
    "AUDIT THE LEADERS",
    "NO MORE EXCUSES",
    "RECLAIM YOUR WARD",
    "CITIZENS ARE WATCHING"
  ];

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-[#fdfbf6] text-black">
      
      {/* 1. VIBRANT HERO */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="bg-forest text-gold px-4 py-1 rounded-lg font-black text-xs uppercase tracking-widest mb-6 rotate-[-1deg] shadow-lg">
          Official Administrative Scoreboard
        </div>
        
        <h1 className="font-display font-black text-6xl md:text-9xl leading-[0.85] uppercase tracking-tighter mb-8 max-w-5xl">
          BENGALURU IS <br/>
          <span className="text-forest underline decoration-gold decoration-8 underline-offset-8">BROKEN.</span>
        </h1>

        <p className="text-xl md:text-2xl font-bold max-w-2xl mb-12 opacity-70">
          The government isn't moving fast enough. <br className="hidden md:block"/> We're here to push them.
        </p>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto px-6">
          <Link to="/report" className="bg-black text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-forest transition-all shadow-[8px_8px_0px_0px_#2B9348] hover:translate-y-1 hover:shadow-none uppercase tracking-tight">
            Report a Problem →
          </Link>
          <Link to="/map" className="bg-white text-black border-4 border-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-black hover:text-white transition-all uppercase tracking-tight">
            Explore Map
          </Link>
        </div>
      </section>

      {/* 2. THE STENCIL MARQUEE (Quotes Replacement) */}
      <div className="w-full bg-forest border-y-8 border-black py-4 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
           {[...slogans, ...slogans].map((s, i) => (
             <span key={i} className="text-5xl md:text-8xl font-display font-black text-white uppercase tracking-tighter mx-12 italic opacity-90">
               • {s} 
             </span>
           ))}
        </div>
      </div>

      {/* 3. THE ACTION CANVAS (Audit Hub Replacement) */}
      <section className="w-full py-24 px-4 md:px-8 bg-[#fdfbf6]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="relative">
               <div className="absolute -top-12 -left-6 text-7xl opacity-10 font-display font-black uppercase pointer-events-none">ACTION</div>
               <h2 className="font-display font-black text-5xl md:text-7xl text-black uppercase tracking-tighter leading-none">
                 MLA <br/> <span className="text-forest shadow-sm">RESOLUTION</span> <br/> HUB
               </h2>
               <p className="text-lg font-bold text-black/40 mt-4 uppercase tracking-widest italic">Checkmate the leadership.</p>
            </div>
            <Link to="/accountability" className="bg-black text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-forest transition-all shadow-xl">
               VIEW FULL AUDIT →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             {/* Dynamic Status Sticker */}
             <div className="lg:col-span-1 bg-gold p-8 rounded-[40px] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[400px] rotate-[-2deg]">
                <div>
                   <h3 className="font-display font-black text-4xl text-black leading-none mb-6 italic">PLATFORM <br/> MISSION</h3>
                   <p className="text-xs font-black uppercase text-black/60 tracking-widest mb-10 leading-relaxed">
                     Every report is a strike. Every petition is a demand. We track the numbers so they can't hide from the truth.
                   </p>
                   
                   <div className="space-y-6">
                      <div className="bg-white/40 p-4 rounded-2xl border-2 border-black/10">
                        <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">Reports Stacked</div>
                        <div className="text-5xl font-display font-black text-black">{stats.reports}</div>
                      </div>
                      <div className="bg-white/40 p-4 rounded-2xl border-2 border-black/10">
                        <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">MLA Response Rate</div>
                        <div className="text-5xl font-display font-black text-forest">0%</div>
                      </div>
                   </div>
                </div>
             </div>

             {/* The Interactive Card Grid */}
             <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(zoneLookup).map(([disp, key]) => {
                  const mla = completeMLAList.find(m => m.constituency === key);
                  const isSelected = selectedZoneMLA?.constituency === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedZoneMLA(mla)}
                      className={`group relative p-6 rounded-[32px] border-4 transition-all flex flex-col items-center justify-center gap-3 ${isSelected ? 'border-black bg-white shadow-[8px_8px_0px_0px_#2B9348] -translate-x-1 -translate-y-1' : 'border-black/5 bg-white/50 hover:border-black hover:bg-white hover:scale-105'}`}
                    >
                      <div className="absolute top-4 right-6 text-[8px] font-black text-black/20 uppercase tracking-[0.2em]">{disp}</div>
                      <div className="w-16 h-16 rounded-2xl border-2 border-black/5 overflow-hidden group-hover:border-black transition-colors grayscale group-hover:grayscale-0">
                         {mla && <img src={mla.photo} className="w-full h-full object-cover" alt="mla" />}
                      </div>
                      <div className="font-display font-black text-xl uppercase leading-none text-center">
                         {mla ? mla.mla.split(' ').pop() : 'MLA'}
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-forest' : 'text-black/30'}`}>
                        {isSelected ? 'SELECTED' : 'SELECT'}
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Action Pop-Card */}
          {selectedZoneMLA && (
            <div className="mt-12 bg-white rounded-[40px] p-8 md:p-12 border-8 border-black shadow-[20px_20px_0px_0px_rgba(43,147,72,1)] flex flex-col md:flex-row items-center gap-10 animate-in slide-in-from-bottom-5 duration-300">
               <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-8 border-black shadow-xl overflow-hidden shrink-0 rotate-[3deg]">
                 <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 text-center md:text-left">
                  <div className="inline-block bg-black text-gold px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">LEADER UNDER AUDIT</div>
                  <h3 className="font-display font-black text-6xl md:text-7xl uppercase leading-none tracking-tighter mb-4">{selectedZoneMLA.mla}</h3>
                  <div className="space-y-2 mb-8">
                    <p className="text-2xl font-black uppercase text-forest tracking-tighter italic">{selectedZoneMLA.constituency} • {selectedZoneMLA.party}</p>
                    <p className="text-sm font-bold text-black/40 uppercase tracking-widest leading-wide">Currently responsible for your ward's resolution progress.</p>
                  </div>
                  <Link to="/map" className="inline-block bg-forest text-gold px-12 py-6 rounded-2xl font-black text-2xl hover:scale-105 transition-transform uppercase tracking-tighter shadow-xl border-4 border-black">
                     PUSH ACTION →
                  </Link>
               </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. THE BUBBLE STATS (Stats Replacement) */}
      <section className="w-full py-32 px-4 md:px-8 border-t-8 border-black bg-[#fdfbf6]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="max-w-md text-center lg:text-left">
             <h2 className="font-display font-black text-5xl md:text-[80px] leading-[0.85] uppercase tracking-tighter mb-6 underline decoration-forest/30">
               OUR <br/> NUMBERS <br/> SO FAR.
             </h2>
             <p className="font-black uppercase tracking-[0.2em] text-black/30 text-sm">Real-time civic impact data for 2024.</p>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="bg-white p-10 rounded-[50px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center group hover:bg-forest hover:text-white transition-all cursor-default translate-y-4">
               <div className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-4">REPORTS</div>
               <div className="text-8xl font-display font-black leading-none">{stats.reports}</div>
            </div>
            <div className="bg-white p-10 rounded-[50px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center group hover:bg-gold transition-all cursor-default">
               <div className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-4 text-forest">PETITIONS</div>
               <div className="text-8xl font-display font-black leading-none text-forest group-hover:text-black">{stats.petitions}</div>
            </div>
            <div className="bg-white p-10 rounded-[50px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center group hover:bg-forest hover:text-white transition-all cursor-default translate-y-4">
               <div className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-4">CITIZENS</div>
               <div className="text-8xl font-display font-black leading-none">{stats.citizens}</div>
            </div>
            <div className="bg-white p-10 rounded-[50px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center group hover:bg-gold transition-all cursor-default">
               <div className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-4 text-forest">SOLVED</div>
               <div className="text-8xl font-display font-black leading-none text-forest group-hover:text-black">0%</div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-40 pt-16 border-t-4 border-black/5 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="text-center md:text-left">
              <div className="font-display font-black text-4xl tracking-tighter uppercase mb-1">BROKENBANGLORE</div>
              <p className="text-xs font-black text-black/40 uppercase tracking-widest italic leading-none">Built for Bengaluru by Citizens • Mission Ops • Est. 2024</p>
           </div>
           <div className="flex gap-10 font-black text-[10px] uppercase tracking-widest text-black/60">
              <a href="#" className="hover:text-forest transition-colors">Privacy</a>
              <a href="#" className="hover:text-forest transition-colors">Audit Policy</a>
              <a href="#" className="hover:text-forest transition-colors">Open Data</a>
           </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}} />
    </div>
  );
}
