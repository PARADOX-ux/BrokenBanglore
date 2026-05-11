import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import Report from './pages/Report';
import Map from './pages/Map';
import Accountability from './pages/Accountability';
import Forum from './pages/Forum';
import Petitions from './pages/Petitions';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#050505] font-body text-[#e8e6e3] flex flex-col selection:bg-amber-500/30 selection:text-amber-500">
      <CustomCursor />
      <Navbar />
      <main className="flex-1 w-full flex flex-col relative pb-20 md:pb-0 pt-16 md:pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/map" element={<Map />} />
          <Route path="/accountability" element={<Accountability />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/petitions" element={<Petitions />} />
        </Routes>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-[500] bg-[#050505]/90 backdrop-blur-xl border-t border-white/5 md:hidden flex justify-around items-center h-16 px-1 pb-safe overflow-x-auto hide-scrollbar">
          <Link to="/" className={`flex items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-widest transition-colors ${location.pathname === '/' ? 'text-amber-500' : 'text-white/50'}`}>Home</Link>
          <Link to="/report" className={`flex items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-widest transition-colors ${location.pathname === '/report' ? 'text-amber-500' : 'text-white/50'}`}>Report</Link>
          <Link to="/map" className={`flex items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-widest transition-colors ${location.pathname === '/map' ? 'text-amber-500' : 'text-white/50'}`}>Map</Link>
          <Link to="/accountability" className={`flex items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-widest transition-colors ${location.pathname === '/accountability' ? 'text-amber-500' : 'text-white/50'}`}>Audit</Link>
      </nav>
    </div>
  );
}

export default App;
