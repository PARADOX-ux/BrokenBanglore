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
    "BENGALURU NEEDS ACTION. NOT PROMISES.",
    "YOUR REPORT IS THEIR DEADLINE.",
    "BENGALURU IS BROKEN. WE ARE THE FIX.",
    "THE GOVERNMENT IS WATCHING. SO ARE WE.",
    "AUDIT THE LEADERS. RECLAIM THE STREETS."
  ];

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-black text-white selection:bg-gold selection:text-black">
      
      {/* 1. KINETIC HERO HERO HERO */}
      <section className="w-full min-h-[90vh] flex flex-col items-center justify-center text-center relative px-4 py-20 border-b-8 border-forest">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(to right, #2B9348 1px, transparent 1px), linear-gradient(to bottom, #2B9348 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        </div>

        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-block bg-gold text-black px-6 py-2 rounded-full font-black text-sm uppercase tracking-[0.2em] mb-8 animate-pulse">
            ADMINISTRATIVE COMMAND CENTER
          </div>
          
          <h1 className="font-display font-black text-6xl md:text-[140px] leading-[0.85] uppercase tracking-tighter mb-10 [text-shadow:4px_4px_0px_#2B9348]">
            BENGALURU <br/>
            IS <span className="text-forest">BROKEN.</span>
          </h1>

          <p className="text-xl md:text-4xl font-black max-w-4xl mx-auto mb-16 uppercase tracking-tight italic opacity-80">
            We are the audit. We are the pressure. <br className="hidden md:block"/> We are the fix.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center scale-110">
             <Link to="/report" className="bg-forest text-gold px-12 py-6 rounded-none font-black text-2xl hover:bg-gold hover:text-black transition-all shadow-[8px_8px_0px_0px_white] hover:shadow-[8px_8px_0px_0px_#2B9348] uppercase tracking-tighter">
                FILE REPORT →
             </Link>
             <Link to="/map" className="bg-white text-black px-12 py-6 rounded-none font-black text-2xl hover:bg-forest hover:text-gold transition-all shadow-[8px_8px_0px_0px_#2B9348] uppercase tracking-tighter">
                LIVE MAP
             </Link>
          </div>
        </div>
      </section>

      {/* 2. THE KINETIC MARQUEE (Quotes Replacement) */}
      <div className="w-full bg-forest py-6 overflow-hidden border-b-8 border-black">
        <div className="flex whitespace-nowrap animate-marquee">
           {[...quotes, ...quotes].map((q, i) => (
             <span key={i} className="text-4xl md:text-7xl font-display font-black text-gold uppercase tracking-tighter mx-10">
               ★ {q} 
             </span>
           ))}
        </div>
      </div>

      {/* 3. THE MLA STRIKE GRID (Audit Hub Replacement) */}
      <section className="w-full py-32 px-4 md:px-8 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl">
               <h2 className="font-display font-black text-6xl md:text-8xl text-white uppercase tracking-tighter leading-none mb-6">
                 MLA <br/> <span className="text-forest shadow-sm">RESOLUTION</span> <br/> HUB
               </h2>
               <div className="w-full h-4 bg-forest mb-6"></div>
               <p className="text-xl font-bold text-ash uppercase tracking-tight">Audit your local leadership. High-pressure tracking enabled.</p>
            </div>
            <Link to="/accountability" className="bg-gold text-black px-12 py-6 font-black text-xl uppercase tracking-widest hover:bg-white transition-all shadow-[10px_10px_0px_0px_#2B9348]">
               FULL SCOREBOARD →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             {/* Left Stats Bar */}
             <div className="lg:col-span-1 bg-forest/10 border-4 border-forest p-8 flex flex-col justify-between min-h-[400px]">
                <div>
                   <div className="text-gold font-black text-xs uppercase tracking-[0.3em] mb-4">PLATFORM STATUS</div>
                   <div className="text-5xl font-display font-black text-white italic leading-none mb-10">TESTING <br/> PHASE</div>
                   
                   <div className="space-y-8">
                      <div>
                        <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">LIVE REPORTS</div>
                        <div className="text-6xl font-display font-black text-white leading-none">{stats.reports}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">AUDIT SUCCESS</div>
                        <div className="text-6xl font-display font-black text-forest leading-none">0%</div>
                      </div>
                   </div>
                </div>
                <div className="text-[10px] font-black text-ash uppercase mt-12">EST. 2024 • COMMAND OPS</div>
             </div>

             {/* The Selection Grid */}
             <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(zoneLookup).map(([disp, key]) => {
                  const mla = completeMLAList.find(m => m.constituency === key);
                  const isSelected = selectedZoneMLA?.constituency === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedZoneMLA(mla)}
                      className={`relative group aspect-square border-4 transition-all overflow-hidden flex flex-col items-center justify-center p-4 ${isSelected ? 'border-gold bg-gold text-black rotate-1' : 'border-white/10 bg-white/5 hover:border-forest text-white'}`}
                    >
                      <div className={`absolute top-0 right-0 p-2 text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'text-black/40' : 'text-white/20'}`}>{disp}</div>
                      <div className="font-display font-black text-2xl md:text-3xl uppercase leading-none text-center">
                         {mla ? mla.mla.split(' ').pop() : 'MLA'}
                      </div>
                      <div className={`mt-2 text-[10px] font-black uppercase tracking-[0.2em] transform transition-transform group-hover:scale-110 ${isSelected ? 'text-black' : 'text-forest'}`}>
                        {isSelected ? 'SELECTED' : 'SELECT'}
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Expanded MLA Tactical View */}
          {selectedZoneMLA && (
            <div className="mt-12 bg-white text-black p-10 flex flex-col md:flex-row items-center gap-12 border-8 border-gold shadow-[20px_20px_0px_0px_#2B9348]">
               <div className="w-32 h-32 md:w-48 md:h-48 grayscale hover:grayscale-0 transition-all border-4 border-black shrink-0 overflow-hidden">
                 <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1">
                  <div className="text-xs font-black bg-black text-white px-3 py-1 inline-block mb-4 uppercase tracking-widest">WARD AUDIT IN PROGRESS</div>
                  <h3 className="font-display font-black text-6xl md:text-8xl uppercase leading-[0.8] tracking-tighter mb-4">{selectedZoneMLA.mla}</h3>
                  <div className="flex flex-wrap gap-8">
                     <div>
                        <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">CONSTITUENCY</div>
                        <div className="text-xl font-black uppercase">{selectedZoneMLA.constituency}</div>
                     </div>
                     <div>
                        <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">PARTY</div>
                        <div className="text-xl font-black uppercase text-forest">{selectedZoneMLA.party}</div>
                     </div>
                  </div>
               </div>
               <Link to="/map" className="w-full md:w-auto bg-black text-white px-16 py-8 font-black text-2xl hover:bg-forest transition-colors uppercase tracking-tighter shadow-xl">
                  START STRIKE →
               </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. MEGA-COUNTER FOOTER (Stats Replacement) */}
      <section className="w-full py-40 px-4 md:px-8 bg-white text-black border-t-[20px] border-forest">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
          <div className="group">
             <div className="text-[10px] font-black tracking-[0.5em] text-black/40 mb-4 group-hover:text-forest transition-colors">CRITICAL REPORTS</div>
             <div className="text-9xl font-display font-black leading-none mb-4 group-hover:scale-110 transition-transform origin-left">{stats.reports}</div>
             <div className="h-2 w-full bg-black"></div>
          </div>
          <div className="group">
             <div className="text-[10px] font-black tracking-[0.5em] text-black/40 mb-4 group-hover:text-forest transition-colors">ACTIVE PETITIONS</div>
             <div className="text-9xl font-display font-black leading-none mb-4 text-forest group-hover:scale-110 transition-transform origin-left">{stats.petitions}</div>
             <div className="h-2 w-full bg-forest"></div>
          </div>
          <div className="group">
             <div className="text-[10px] font-black tracking-[0.5em] text-black/40 mb-4 group-hover:text-forest transition-colors">CITIZEN COMMAND</div>
             <div className="text-9xl font-display font-black leading-none mb-4 group-hover:scale-110 transition-transform origin-left">{stats.citizens}</div>
             <div className="h-2 w-full bg-black"></div>
          </div>
          <div className="group">
             <div className="text-[10px] font-black tracking-[0.5em] text-black/40 mb-4 group-hover:text-forest transition-colors">TOTAL RESOLVED</div>
             <div className="text-9xl font-display font-black leading-none mb-4 text-forest group-hover:scale-110 transition-transform origin-left">0%</div>
             <div className="h-2 w-full bg-forest"></div>
          </div>
        </div>

        <div className="mt-40 pt-20 border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="text-center md:text-left">
              <div className="font-display font-black text-5xl tracking-tighter uppercase mb-2">BROKENBANGLORE</div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-black/40 italic">Built for Bengaluru by Citizens • Mission Control Center • Est. 2024</div>
           </div>
           <div className="flex gap-12 font-black text-sm uppercase tracking-widest">
              <a href="#" className="hover:text-forest transition-all hover:scale-110">Privacy</a>
              <a href="#" className="hover:text-forest transition-all hover:scale-110">Audit</a>
              <a href="#" className="hover:text-forest transition-all hover:scale-110">OpenData</a>
           </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
}
