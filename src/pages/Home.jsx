import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useSpring, useTransform, useScroll } from 'motion/react';
import { completeMLAList, getStats } from '../data/wardData';

// Helper component for premium-feel numbers
function AnimatedNumber({ value }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

// Minimal Rain Overlay Component
function RainOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', animation: 'rain 0.3s linear infinite' }}>
      <style>{`
        @keyframes rain {
          0% { background-position: 0% 0%; }
          100% { background-position: 10% 100%; }
        }
      `}</style>
    </div>
  );
}

// Cinematic Ticker Component
function Ticker({ reports }) {
  const latestReports = reports.slice(0, 10);
  return (
    <div className="w-full bg-[#050505] py-5 overflow-hidden border-y border-white/10 relative z-20">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
        className="flex whitespace-nowrap gap-20 items-center"
      >
        {[...latestReports, ...latestReports].map((report, i) => (
          <div key={i} className="flex items-center gap-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] font-body">Live Pulse:</span>
            <span className="text-[11px] font-black text-white uppercase tracking-[0.1em] font-display">
              {report.category} reported in {report.area_name || 'Central Bengaluru'}
            </span>
          </div>
        ))}
        {latestReports.length === 0 && (
          <div className="flex items-center gap-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] font-body">Live Pulse:</span>
            <span className="text-[11px] font-black text-white uppercase tracking-[0.1em] font-display">
              City is currently peaceful.
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [selectedZoneMLA, setSelectedZoneMLA] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ reports: 0, petitions: 0, citizens: 0, resolved: 0 });
  const auditHubRef = useRef(null);
  const isAuditHubInView = useInView(auditHubRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

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
      
      {/* 1. ARRIVAL: Cinematic Hero */}
      <section className="relative w-full h-[100svh] flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-12 overflow-hidden">
        {/* Background Layer */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/80 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1596414438341-2a1c430ab285?q=80&w=2070&auto=format&fit=crop" 
            alt="Bengaluru City" 
            className="w-full h-full object-cover scale-105"
          />
          <RainOverlay />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-amber-500 font-bold text-xs md:text-sm tracking-[0.4em] uppercase mb-4">Namma Ooru. Our Voice.</h2>
            <h1 className="font-display font-black text-6xl md:text-[8rem] leading-[0.85] tracking-tighter uppercase text-white drop-shadow-2xl">
              The Soul of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Bengaluru.</span>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.5 }}
            className="mt-12 flex flex-col md:flex-row gap-6 items-start md:items-center"
          >
            <Link to="/map" className="relative group overflow-hidden bg-white text-black px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-transform hover:scale-105">
              <span className="relative z-10">Enter The City Map</span>
              <div className="absolute inset-0 bg-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
            </Link>
            
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 border-l border-white/20 pl-8">
              <div>
                <span className="block text-white mb-1">Weather</span>
                24°C / Rain
              </div>
              <div>
                <span className="block text-amber-500 mb-1">Traffic</span>
                Heavy / Silk Board
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Ticker */}
      <Ticker reports={reports} />

      {/* 2. CHAOS & BEAUTY: The Reality */}
      <section className="w-full py-32 px-6 md:px-12 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="space-y-8"
            >
              <h3 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter leading-[0.9] text-white">
                Beneath the <span className="text-amber-500">Silicon</span>.
              </h3>
              <p className="text-lg md:text-xl text-white/60 font-body leading-relaxed max-w-md">
                A city of builders, dreamers, and endless traffic. We love Bengaluru, but we cannot ignore its broken pieces. It's time to bridge the gap between our tech parks and our streets.
              </p>
              <div className="pt-4">
                <Link to="/report" className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-white transition-colors group">
                  Report a broken street 
                  <span className="w-8 h-[1px] bg-amber-500 group-hover:bg-white transition-colors group-hover:w-12 duration-300"></span>
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.img 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                src="https://images.unsplash.com/photo-1610471243171-ec44aee50bba?q=80&w=1000&auto=format&fit=crop" 
                alt="Bengaluru Auto" 
                className="w-full h-[300px] object-cover rounded-sm grayscale hover:grayscale-0 transition-all duration-700"
              />
              <motion.img 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                src="https://images.unsplash.com/photo-1580227181519-9430c51ce604?q=80&w=1000&auto=format&fit=crop" 
                alt="Bengaluru Traffic" 
                className="w-full h-[300px] object-cover rounded-sm mt-12 grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACCOUNTABILITY HUB: Cinematic & Clean */}
      <section ref={auditHubRef} className="w-full py-32 px-6 md:px-12 bg-[#0a0a0a] border-t border-white/5 relative overflow-hidden">
        {/* Subtle glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isAuditHubInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
          >
            <div>
              <div className="text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">The Real Audit</div>
              <h3 className="font-display font-black text-4xl md:text-6xl text-white uppercase tracking-tighter leading-none">
                Who runs your <br className="hidden md:block"/> neighborhood?
              </h3>
            </div>
            <Link to="/accountability" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white border-b border-white/20 hover:border-white pb-1 transition-all">
              View Full City Index
            </Link>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* The Grid */}
            <div className="lg:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {completeMLAList.map((mla) => {
                const isSelected = selectedZoneMLA?.constituency === mla.constituency;
                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={mla.constNo}
                    onClick={() => setSelectedZoneMLA(mla)}
                    className={`p-4 md:p-5 text-left flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all duration-300 ${isSelected ? 'bg-white text-black rounded-lg' : 'bg-white/5 text-white hover:bg-white/10 rounded-sm border border-white/5'}`}
                  >
                    <div className="flex-1">
                      <div className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-2 ${isSelected ? 'text-black/40' : 'text-white/40'}`}>
                        {mla.constituency}
                      </div>
                      <div className={`font-display font-black text-lg md:text-xl uppercase leading-[1.1] ${isSelected ? 'text-black' : 'text-white/90'}`}>
                          {mla.mla}
                      </div>
                    </div>
                    <div className="mt-4">
                       <span className={`text-[8px] font-black px-2 py-1 uppercase tracking-widest ${isSelected ? 'bg-black/10 text-black' : 'bg-white/10 text-white/70'}`}>
                         {mla.party}
                       </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Card */}
            <div className="lg:w-1/3">
              <AnimatePresence mode="wait">
                {selectedZoneMLA ? (
                  <motion.div 
                    key={selectedZoneMLA.constituency}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-sm backdrop-blur-md sticky top-8"
                  >
                    <div className="w-24 h-24 mb-6 grayscale brightness-75">
                      <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover rounded-sm" />
                    </div>
                    
                    <h4 className="font-display font-black text-3xl text-white mb-1 uppercase tracking-tighter leading-none">{selectedZoneMLA.mla}</h4>
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-8 mt-2">{selectedZoneMLA.party} Representative</div>
                    
                    <div className="space-y-6">
                      {(() => {
                        const mlaReports = reports.filter(r => Number(r.ward_no) === Number(selectedZoneMLA.ward));
                        const total = mlaReports.length;
                        const fixed = mlaReports.filter(r => r.status === 'resolved').length;
                        const score = total > 0 ? Math.round((fixed / total) * 100) : 0;
                        
                        return (
                          <>
                            <div className="border-t border-white/10 pt-4">
                              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Fixed Issues / Total</div>
                              <div className="text-2xl font-display font-black text-white tracking-tighter">
                                <AnimatedNumber value={fixed} /> <span className="text-white/30">/</span> <AnimatedNumber value={total} />
                              </div>
                            </div>
                            <div className="border-t border-white/10 pt-4">
                              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Performance Score</div>
                              <div className={`text-4xl font-display font-black tracking-tighter ${score >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                <AnimatedNumber value={score} />%
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="mt-10">
                      <Link to="/map" className="block text-center w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-colors duration-300">
                        View Ward Map
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[300px] border border-white/5 bg-white/[0.02] rounded-sm flex flex-col items-center justify-center text-center p-8"
                  >
                     <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mb-4">
                        <span className="block w-1.5 h-1.5 bg-white/40 rounded-full animate-ping"></span>
                     </div>
                     <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Select a representative<br/>to view the audit</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE DEMANDS: Emotive Text */}
      <section className="w-full py-32 px-6 md:px-12 bg-black border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-8"
          >
            The Voice of the City
          </motion.div>
          
          <div className="space-y-12 md:space-y-16 text-left border-l border-white/10 pl-6 md:pl-12">
            {[
              { text: "We are tired of dodging potholes on our way to build the future.", author: "Tech Worker, Bellandur" },
              { text: "The metro brings hope, but the last mile brings only frustration.", author: "Student, Jayanagar" },
              { text: "Bengaluru gave us everything. It's time we demand better for it.", author: "Resident, Indiranagar" }
            ].map((quote, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="relative"
              >
                 <div className="absolute -left-[24px] md:-left-[48px] top-2 w-4 h-[1px] bg-amber-500"></div>
                 <h4 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-tighter leading-tight mb-4">
                   "{quote.text}"
                 </h4>
                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">— {quote.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="w-full py-16 px-6 md:px-12 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
             <div className="font-display font-black text-xl text-white uppercase tracking-tighter">BROKENBENGALURU</div>
             <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">Built for Namma Ooru. By the Citizens.</p>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/50">
             <a href="https://bbmp.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">BBMP</a>
             <a href="https://bwssb.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">BWSSB</a>
             <a href="https://bescom.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">BESCOM</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
