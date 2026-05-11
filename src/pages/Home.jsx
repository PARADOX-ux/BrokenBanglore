import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useSpring, useTransform, useScroll } from 'motion/react';
import { completeMLAList, getStats } from '../data/wardData';

// --- UTILS & COMPONENTS ---

function AnimatedNumber({ value }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span>{display}</motion.span>;
}

// Subtle, organic film grain overlay for cinematic feel
function FilmGrain() {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.03] mix-blend-overlay" 
         style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png")', backgroundRepeat: 'repeat' }}>
    </div>
  );
}

// Real-time pulse ticker
function CityPulse({ reports }) {
  const latestReports = reports.slice(0, 10);
  return (
    <div className="w-full bg-[#030303] py-4 border-b border-white/5 relative z-20 overflow-hidden">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        className="flex whitespace-nowrap gap-16 items-center px-4"
      >
        {[...latestReports, ...latestReports].map((report, i) => (
          <div key={i} className="flex items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${report.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Live Pulse:</span>
            <span className="text-[11px] uppercase tracking-wider font-bold text-white/90 font-display">
              {report.category} issue logged in {report.area_name || 'Central Bengaluru'}
            </span>
          </div>
        ))}
        {latestReports.length === 0 && (
          <div className="flex items-center gap-4 opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Live Pulse:</span>
            <span className="text-[11px] uppercase tracking-wider font-bold text-white/90 font-display">
              City is breathing. No recent alerts.
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function Home() {
  const [selectedZoneMLA, setSelectedZoneMLA] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ reports: 0, petitions: 0, citizens: 0, resolved: 0 });
  const auditHubRef = useRef(null);
  const isAuditHubInView = useInView(auditHubRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    import('../lib/reportsDb').then(m => {
      m.getReports().then(fetchedReports => {
        setReports(fetchedReports);
        const baseStats = getStats();
        setStats({
          reports: fetchedReports.length || baseStats.reports,
          citizens: Math.max(fetchedReports.length + 10, baseStats.citizens),
          resolved: fetchedReports.filter(r => r.status === 'resolved').length || baseStats.resolved
        });
      });
    });

    const handler = (e) => setStats(e.detail);
    window.addEventListener('bb-stats-update', handler);
    return () => window.removeEventListener('bb-stats-update', handler);
  }, []);

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-[#050505] text-[#e8e6e3] selection:bg-amber-600/30 selection:text-amber-500">
      <FilmGrain />

      {/* 1. SCENE ONE: ARRIVAL */}
      <section className="relative w-full h-[100svh] flex flex-col justify-end pb-16 md:pb-24 px-6 md:px-12 overflow-hidden bg-black">
        {/* Parallax Background */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#050505] z-10" />
          <div className="absolute inset-0 bg-black/30 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1596414438341-2a1c430ab285?q=80&w=2070&auto=format&fit=crop" 
            alt="Bengaluru Skyline at Night" 
            className="w-full h-full object-cover scale-105 saturate-50"
          />
        </motion.div>

        {/* Cinematic Typography */}
        <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full md:w-2/3"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="w-8 h-[1px] bg-amber-500"></span>
              <span className="text-amber-500 font-bold text-[10px] tracking-[0.4em] uppercase">ನಮ್ಮ ಊರು • Namma Ooru</span>
            </div>
            <h1 className="font-display font-medium text-6xl md:text-[7rem] leading-[0.85] tracking-tight text-white/90">
              The Digital Soul <br className="hidden md:block"/>
              of <span className="font-bold text-white">Bengaluru.</span>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="w-full md:w-1/3 flex flex-col gap-6 border-l border-white/10 pl-6 md:pl-10"
          >
            <p className="text-sm md:text-base text-white/60 font-body leading-relaxed">
              A city of infinite dreams, running on broken streets. We are mapping the friction between our silicon ambitions and our urban reality.
            </p>
            <Link to="/map" className="group inline-flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-amber-500 transition-colors w-fit">
              Enter The Archive 
              <span className="w-8 h-[1px] bg-white group-hover:bg-amber-500 group-hover:w-12 transition-all duration-500"></span>
            </Link>
          </motion.div>
        </div>
      </section>

      <CityPulse reports={reports} />

      {/* 2. SCENE TWO: CHAOS & BEAUTY */}
      <section className="w-full py-24 md:py-40 px-6 md:px-12 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-center">
          
          {/* Editorial Image Block */}
          <motion.div 
            initial={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0% 0 0 0)' }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 relative"
          >
            <div className="aspect-[4/5] overflow-hidden bg-[#111]">
              <img 
                src="https://images.unsplash.com/photo-1610471243171-ec44aee50bba?q=80&w=1000&auto=format&fit=crop" 
                alt="Bengaluru Auto" 
                className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:scale-105 hover:opacity-100 transition-all duration-1000 ease-out"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 md:-right-12 bg-[#050505] p-6 border border-white/5 max-w-[240px]">
               <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">01 / The Friction</div>
               <p className="text-xs text-white/50 leading-relaxed font-body">Millions of hours lost in traffic, yet the city never stops moving.</p>
            </div>
          </motion.div>

          {/* Typography Block */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="md:col-span-6 md:col-start-7 flex flex-col justify-center"
          >
            <h2 className="font-display font-medium text-4xl md:text-5xl leading-tight text-white mb-8">
              We built the future for the world, but forgot to build our own <span className="font-bold italic text-white/50">sidewalks</span>.
            </h2>
            <div className="space-y-6 text-white/60 font-body text-lg leading-relaxed max-w-lg">
              <p>
                From the quiet lanes of Basavanagudi to the neon glow of Koramangala, Bengaluru is a city of two realities. The one we export, and the one we commute through.
              </p>
              <p>
                Broken Bengaluru is an interactive documentary. A civic archive built by citizens, for citizens, to map the truth of our streets.
              </p>
            </div>
            
            <div className="mt-12 flex items-center gap-12 border-t border-white/10 pt-8">
               <div>
                  <div className="text-3xl font-display font-black text-white"><AnimatedNumber value={stats.reports} /></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Issues Mapped</div>
               </div>
               <div>
                  <div className="text-3xl font-display font-black text-white"><AnimatedNumber value={stats.citizens} /></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Active Citizens</div>
               </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. SCENE THREE: ATMOSPHERE (Full width cinematic breaker) */}
      <section className="w-full h-[60vh] md:h-[80vh] relative flex items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=2000&auto=format&fit=crop" 
            alt="Chai in Rain" 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <div className="relative z-20 text-center px-6">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="font-display font-medium text-3xl md:text-5xl text-white tracking-tight"
          >
            "Filter kaapi, monsoons, and endless resilience."
          </motion.h3>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500"
          >
            02 / The Culture
          </motion.div>
        </div>
      </section>

      {/* 4. SCENE FOUR: THE ACCOUNTABILITY ARCHIVE */}
      <section ref={auditHubRef} className="w-full py-24 md:py-40 px-6 md:px-12 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/10 pb-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-4">03 / The Audit</div>
              <h2 className="font-display font-medium text-4xl md:text-6xl text-white tracking-tight leading-none mb-6">
                The Accountability <br className="hidden md:block"/> Archive.
              </h2>
              <p className="text-white/50 text-sm md:text-base font-body leading-relaxed">
                A public ledger of political performance. We track every report, cross-reference it with the responsible representative, and calculate their true resolve rate.
              </p>
            </div>
            <Link to="/accountability" className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:text-amber-500 transition-colors">
              Explore The Index
              <span className="w-6 h-[1px] bg-white group-hover:bg-amber-500 transition-colors"></span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            {/* Minimalist Grid */}
            <div className="lg:w-7/12 grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4 h-[400px] md:h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {completeMLAList.map((mla) => {
                const isSelected = selectedZoneMLA?.constituency === mla.constituency;
                return (
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    key={mla.constNo}
                    onClick={() => setSelectedZoneMLA(mla)}
                    className={`p-5 text-left flex flex-col justify-between h-[140px] md:h-[160px] transition-all duration-500 ease-out border ${isSelected ? 'bg-white border-white text-black' : 'bg-transparent border-white/10 text-white hover:border-white/30 hover:bg-white/[0.02]'}`}
                  >
                    <div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${isSelected ? 'text-black/50' : 'text-white/40'}`}>
                        {mla.constituency}
                      </div>
                      <div className={`font-display font-bold text-lg md:text-xl leading-tight ${isSelected ? 'text-black' : 'text-white'}`}>
                          {mla.mla}
                      </div>
                    </div>
                    <div className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-black/60' : 'text-white/30'}`}>
                      {mla.party}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Editorial Focus Card */}
            <div className="lg:w-5/12">
              <AnimatePresence mode="wait">
                {selectedZoneMLA ? (
                  <motion.div 
                    key={selectedZoneMLA.constituency}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-[#0a0a0a] border border-white/10 p-8 md:p-12 h-full flex flex-col"
                  >
                    <div className="flex items-start gap-6 mb-10">
                      <div className="w-20 h-20 grayscale brightness-75 shrink-0 bg-[#111]">
                        <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover mix-blend-luminosity" />
                      </div>
                      <div>
                        <h4 className="font-display font-medium text-2xl md:text-3xl text-white leading-none mb-2">{selectedZoneMLA.mla}</h4>
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Representative, {selectedZoneMLA.constituency}</div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center space-y-8">
                      {(() => {
                        const mlaReports = reports.filter(r => Number(r.ward_no) === Number(selectedZoneMLA.ward));
                        const total = mlaReports.length;
                        const fixed = mlaReports.filter(r => r.status === 'resolved').length;
                        const score = total > 0 ? Math.round((fixed / total) * 100) : 0;
                        
                        return (
                          <>
                            <div>
                              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Civic Resolutions</div>
                              <div className="text-4xl font-display font-medium text-white">
                                <AnimatedNumber value={fixed} /> <span className="text-white/20 font-light">/</span> <AnimatedNumber value={total} />
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Trust Index</div>
                              <div className={`text-5xl font-display font-medium ${score >= 50 ? 'text-white' : 'text-amber-500'}`}>
                                <AnimatedNumber value={score} />%
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[400px] md:h-full border border-white/5 bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-8">
                     <span className="text-white/20 text-3xl mb-4 font-display italic">?</span>
                     <p className="text-white/30 font-body text-sm max-w-[200px] leading-relaxed">Select a constituency to reveal the public audit data.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SCENE FIVE: HUMAN STORIES */}
      <section className="w-full py-24 md:py-32 px-6 md:px-12 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-4">04 / The Voices</div>
            <h2 className="font-display font-medium text-3xl md:text-4xl text-white tracking-tight">The streets have stories.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "We spend half our lives in traffic, dreaming about the code we'll write when we finally reach the office.", author: "Techie, Bellandur" },
              { text: "The rain used to mean filter coffee and pakodas. Now it just means panic and flooded basements.", author: "Resident, HSR Layout" },
              { text: "I drive an auto for 12 hours. My back hurts more from the potholes than the driving.", author: "Auto Driver, Indiranagar" }
            ].map((quote, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="bg-[#050505] p-8 md:p-10 border border-white/5 flex flex-col justify-between"
              >
                 <div className="text-amber-500 text-4xl font-display leading-none mb-6">"</div>
                 <h4 className="text-lg font-body text-white/80 leading-relaxed mb-12">
                   {quote.text}
                 </h4>
                 <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest border-t border-white/10 pt-4">— {quote.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SCENE SIX: JOIN THE MOVEMENT */}
      <section className="w-full py-32 md:py-48 px-6 md:px-12 bg-black text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="font-display font-medium text-5xl md:text-7xl text-white tracking-tighter mb-8">
            Don't just complain. <br/> <span className="italic text-white/50">Document it.</span>
          </h2>
          <p className="text-white/40 font-body text-lg md:text-xl mb-12">
            Every photo uploaded, every pothole logged, forces accountability. Add your voice to the map.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/report" className="bg-white text-black px-10 py-5 font-bold text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-colors duration-300 w-full sm:w-auto">
              Report an Issue
            </Link>
            <Link to="/map" className="bg-transparent border border-white/20 text-white px-10 py-5 font-bold text-xs uppercase tracking-widest hover:border-white transition-colors duration-300 w-full sm:w-auto">
              View The Map
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Editorial */}
      <footer className="w-full py-12 px-6 md:px-12 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
             <div className="font-display font-bold text-xl text-white tracking-tight mb-2">BROKEN BENGALURU</div>
             <p className="text-[10px] font-body text-white/40 uppercase tracking-[0.2em]">The Digital Soul of the City. Est. 2024.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-white/30">
             <a href="https://bbmp.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">BBMP Official</a>
             <a href="https://bwssb.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">BWSSB</a>
             <Link to="/forum" className="hover:text-white transition-colors">Community Forum</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
