import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useSpring, useTransform } from 'motion/react';
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

// RetroGrid Background Component
function RetroGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden [perspective:300px] pointer-events-none opacity-40">
      <div className="absolute inset-0 [transform:rotateX(45deg)] origin-center">
        <div 
          className="absolute [background-image:linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_0)] [background-size:60px_60px] [height:400vh] [width:200vw] -left-[50%] top-0"
          style={{ animation: 'grid-scroll 4s linear infinite' }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#fdfbf6] via-[#fdfbf6]/20 to-transparent"></div>
    </div>
  );
}


// Cinematic Ticker Component
function Ticker({ reports }) {
  const latestReports = reports.slice(0, 10);
  return (
    <div className="w-full bg-black py-4 overflow-hidden border-y border-white/5 relative z-20">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="flex whitespace-nowrap gap-20 items-center"
      >
        {[...latestReports, ...latestReports].map((report, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="w-1 h-1 rounded-full bg-gold"></span>
            <span className="text-[9px] font-medium text-white/40 uppercase tracking-[0.3em] font-display">Live Audit:</span>
            <span className="text-[9px] font-bold text-white uppercase tracking-[0.2em] font-display">{report.category} in {report.area_name || 'Central'}</span>
          </div>
        ))}
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

  useEffect(() => {
    // Fetch real reports for accurate live counters
    import('../lib/reportsDb').then(m => {
      m.getReports().then(fetchedReports => {
        setReports(fetchedReports);
        
        // Calculate dynamic stats from all reports
        const baseStats = getStats();
        setStats({
          reports: fetchedReports.length || baseStats.reports,
          citizens: Math.max(fetchedReports.length + 10, baseStats.citizens), // Estimate active citizens
          resolved: fetchedReports.filter(r => r.status === 'resolved').length || baseStats.resolved
        });
      });
    });

    const handler = (e) => setStats(e.detail);
    window.addEventListener('bb-stats-update', handler);
    return () => window.removeEventListener('bb-stats-update', handler);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="w-full flex-col flex overflow-x-hidden min-h-screen bg-[#fdfbf6] text-black">
      {/* Hero Section */}
      <section className="w-full bg-[#fdfbf6] px-4 md:px-8 py-24 md:py-40 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <RetroGrid />



        <div className="relative z-10 mb-6 px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-display font-light text-5xl md:text-8xl text-black tracking-tight leading-[0.9] uppercase"
          >
            BENGALURU <br className="hidden md:block"/> <span className="font-bold">REIMAGINED.</span>
          </motion.h1>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="relative z-10 text-sm md:text-xl text-black font-medium max-w-2xl mb-12 tracking-wide uppercase"
        >
          Your platform for transparency, accountability, and a better city.
        </motion.p>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row gap-4 relative z-10 w-full md:w-auto px-6">
          <motion.div variants={itemVariants}>
            <Link to="/report" className="bg-forest text-gold px-10 py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl hover:-translate-y-1 block text-center uppercase tracking-tight group">
              Report a Problem 
              <motion.span className="inline-block ml-2" animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link to="/map" className="bg-white text-black border-4 border-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-black hover:text-white transition-all block text-center uppercase tracking-tight">
              Explore the Map
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Live Ticker */}
      <Ticker reports={reports} />

      {/* Audit Hub - Structured Grid */}
      <section ref={auditHubRef} className="w-full pt-12 md:pt-20 pb-20 px-4 md:px-8 bg-black/5">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={isAuditHubInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-7xl mx-auto flex flex-col md:flex-row bg-white rounded-3xl md:rounded-[40px] overflow-hidden shadow-2xl border-4 border-black">
          
          {/* Left Panel: High Energy Citizen Voice */}
          <div className="md:w-[320px] bg-forest p-6 md:p-10 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0 relative overflow-hidden">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.05, 0.1, 0.05]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none">
            </motion.div>
            
            <div>
              <div className="flex flex-col gap-2 mb-10">
                <motion.span 
                  whileInView={{ x: [-20, 0], opacity: [0, 1] }}
                  className="bg-gold text-black px-4 py-2 font-display font-black text-5xl leading-none w-fit shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-2 uppercase tracking-tighter">WE SEE</motion.span>
                <motion.span 
                  whileInView={{ x: [20, 0], opacity: [0, 1] }}
                  className="bg-white text-forest px-4 py-2 font-display font-black text-5xl leading-none w-fit shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-3 uppercase tracking-tighter">YOU.</motion.span>
              </div>
              
              <div className="space-y-6">
                <p className="text-xl md:text-2xl font-black text-white leading-[1.1] uppercase tracking-tight">
                  No more <span className="text-gold">Broken Roads</span><br/>
                  No more <span className="text-gold">Garbage</span><br/>
                  No more <span className="text-gold">Dark Streets</span>
                </p>
                
                <div className="h-1 w-full bg-white/10 rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "75%" }}
                    transition={{ duration: 2, delay: 0.5 }}
                    className="h-full bg-gold rounded-full">
                  </motion.div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 space-y-4">
              <div className="flex flex-col gap-3">
                 <div className="bg-white/10 border-2 border-dashed border-white/20 p-4 rounded-2xl">
                    <p className="text-xs font-black text-gold uppercase tracking-[0.2em] mb-1">Live Audit:</p>
                    <p className="text-3xl font-black text-white uppercase leading-tight tracking-tighter">
                      <AnimatedNumber value={stats.reports} />
                    </p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Reports Tracked</p>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 text-white">
                    <span className="bg-black text-white px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest italic shadow-lg">Good Water</span>
                    <span className="bg-bright text-white px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest italic shadow-lg">Clean Parks</span>
                    <span className="bg-gold text-black px-3 py-1.5 rounded-lg border border-black text-[9px] font-black uppercase tracking-widest italic shadow-lg">Safe Walks</span>
                 </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Message To Government:</p>
                 <motion.div 
                    whileHover={{ scale: 1.05, rotate: -1 }}
                    className="bg-white p-4 rounded-xl border-4 border-black text-black text-xs font-bold uppercase tracking-tighter leading-tight flex items-center gap-3 shadow-[8px_8px_0px_0px_rgba(212,175,55,1)] cursor-pointer">
                    <span className="text-2xl animate-bounce">📢</span>
                    WE ARE ALL <br/> WATCHING YOU.
                 </motion.div>
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 h-[350px] md:h-[450px] overflow-y-auto overflow-x-hidden pr-1 md:pr-2 custom-scrollbar bg-black/5 p-2 md:p-4 rounded-2xl md:rounded-[2rem] border-2 border-dashed border-black/10">
              {completeMLAList.map((mla) => {
                const isSelected = selectedZoneMLA?.constituency === mla.constituency;
                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    key={mla.constNo}
                    onClick={() => setSelectedZoneMLA(mla)}
                    className={`p-2 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-0 md:min-h-[200px] group relative overflow-hidden ${isSelected ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-black/5 bg-white hover:border-black/20'}`}
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-black opacity-[0.02] -mr-6 -mt-6 rounded-full"></div>
                    
                    <div className={`w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden mb-1 md:mb-2 border-2 transition-transform group-hover:scale-105 shrink-0 ${isSelected ? 'border-forest' : 'border-black/5'}`}>
                      <img src={mla.photo} alt={mla.mla} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="text-[7px] md:text-[9px] font-black text-black/30 uppercase tracking-[0.1em] mb-0.5 md:mb-1 truncate">{mla.constituency}</div>
                      <div className="font-body font-bold text-[9px] md:text-sm text-black uppercase leading-tight group-hover:text-forest transition-colors line-clamp-2">
                          {mla.mla}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border border-black/10 ${mla.party === 'BJP' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                         {mla.party}
                       </span>
                       {isSelected && <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-forest"></motion.div>}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {selectedZoneMLA ? (
                <motion.div 
                  key={selectedZoneMLA.constituency}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="mt-8 bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border-4 border-black flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
                >
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 border-4 border-black bg-black">
                    <img src={selectedZoneMLA.photo} alt={selectedZoneMLA.mla} className="w-full h-full object-cover" />
                  </motion.div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="font-display font-black text-xl md:text-3xl text-black mb-1 uppercase tracking-tight leading-none break-words">{selectedZoneMLA.mla}</h4>
                    <div className="text-xs font-black text-black/50 uppercase tracking-widest mb-4 mt-2">{selectedZoneMLA.constituency} • {selectedZoneMLA.party}</div>
                    <div className="flex gap-8 justify-center md:justify-start">
                      {(() => {
                        const mlaReports = reports.filter(r => Number(r.ward_no) === Number(selectedZoneMLA.ward));
                        const total = mlaReports.length;
                        const fixed = mlaReports.filter(r => r.status === 'resolved').length;
                        const score = total > 0 ? Math.round((fixed / total) * 100) : 0;
                        
                        return (
                          <>
                            <div>
                              <div className="text-2xl font-display font-black text-black">
                                <AnimatedNumber value={fixed} />/<AnimatedNumber value={total} />
                              </div>
                              <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">Fixed Issues</div>
                            </div>
                            <div>
                              <div className={`text-2xl font-display font-black ${score >= 50 ? 'text-forest' : 'text-red-600'}`}>
                                <AnimatedNumber value={score} />%
                              </div>
                              <div className="text-[10px] font-black text-black/40 uppercase tracking-widest">Audit Score</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <Link to="/map" className="w-full md:w-auto bg-forest text-gold px-10 py-5 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-lg uppercase tracking-widest border-2 border-black">
                    ACT NOW →
                  </Link>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 bg-black/[0.02] border-4 border-dashed border-black/10 rounded-[32px] py-16 flex flex-col items-center justify-center text-center">
                   <span className="text-4xl mb-4 grayscale">🏛️</span>
                   <p className="text-black font-black uppercase tracking-[0.2em] text-sm opacity-20 italic">Select your area to begin the audit</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* THE DEMANDS - Simple & Powerful */}
      <section className="w-full py-20 px-4 md:px-8 bg-forest text-white border-t-8 border-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            whileInView={{ rotate: [-2, 1], scale: [0.9, 1] }}
            className="bg-gold text-black px-6 py-3 font-display font-black text-3xl md:text-5xl leading-none w-fit mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase tracking-tighter mb-12">
            WHAT WE ALL WANT
          </motion.div>
          
          <div className="grid gap-8 text-left">
            {[
              { title: "1. FIX THE ROADS", desc: "Stop the potholes. Stop the dust. We want smooth roads for our kids and family.", color: "text-gold" },
              { title: "2. CLEAN OUR CITY", desc: "Pick up the garbage. Clean the drains. We want a green and fresh Bengaluru.", color: "text-white" },
              { title: "3. LIGHT THE STREETS", desc: "No more dark corners. We want safe streets for everyone to walk at night.", color: "text-gold" }
            ].map((demand, i) => (
              <motion.div 
                key={i}
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="bg-white/5 p-6 rounded-3xl border-2 border-dashed border-white/20 hover:bg-white/10 transition-colors">
                 <div className={`text-3xl font-black uppercase tracking-tight ${demand.color} mb-2`}>{demand.title}</div>
                 <p className="text-sm md:text-lg font-bold opacity-80">{demand.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL THE GOVT - Simple Action */}
      <section className="w-full py-16 px-4 md:px-8 bg-white border-y-8 border-black">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl md:text-6xl font-display font-black text-black uppercase tracking-tighter mb-6">
            TIME FOR ACTION
          </motion.div>
          <p className="text-xl font-bold text-black/60 mb-10">Choose who to reach out to. They must listen to us.</p>
          <div className="flex flex-wrap gap-4 justify-center">
             <motion.a whileHover={{ scale: 1.1 }} href="https://bbmp.gov.in" target="_blank" rel="noreferrer" className="bg-black text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-forest transition-all">Report to BBMP</motion.a>
             <motion.a whileHover={{ scale: 1.1 }} href="https://bwssb.karnataka.gov.in" target="_blank" rel="noreferrer" className="bg-black text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-forest transition-all">Contact BWSSB</motion.a>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="w-full py-12 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto border-t border-black/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
             <div className="font-display font-black text-2xl text-black uppercase tracking-tighter">BROKENBENGALURU</div>
             <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Built for Bengaluru by Citizens • Established 2024</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-black/60">
             <a href="https://bbmp.gov.in" target="_blank" rel="noreferrer" className="hover:text-forest transition-colors">BBMP</a>
             <a href="https://bwssb.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-forest transition-colors">BWSSB</a>
             <a href="https://bescom.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-forest transition-colors">BESCOM</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
