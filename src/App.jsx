import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Report from './pages/Report';
import Map from './pages/Map';
import Accountability from './pages/Accountability';
import Forum from './pages/Forum';
import Petitions from './pages/Petitions';
import Signup from './pages/Signup';

function App() {
  return (
    <AuthProvider>
    <div className="min-h-screen bg-cream font-body text-olive flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-[2560px] mx-auto flex flex-col relative pb-20 md:pb-0 pt-16 md:pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/map" element={<Map />} />
          <Route path="/accountability" element={<Accountability />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/petitions" element={<Petitions />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
      <Footer />
      
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-ash/90 backdrop-blur-md border-t border-cream md:hidden flex justify-around items-center h-16 px-1 pb-safe overflow-x-auto hide-scrollbar">
          <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-[10px] font-semibold text-olive/70 hover:text-olive">
            <span className="text-xl mb-1">🏠</span>
            Home
          </Link>
          <Link to="/report" className="flex flex-col items-center justify-center w-full h-full text-[10px] font-semibold text-olive/70 hover:text-olive">
            <span className="text-xl mb-1">📸</span>
            Report
          </Link>
          <Link to="/petitions" className="flex flex-col items-center justify-center w-full h-full text-[10px] font-semibold text-olive/70 hover:text-olive">
            <span className="text-xl mb-1">✍️</span>
            Petitions
          </Link>
          <Link to="/forum" className="flex flex-col items-center justify-center w-full h-full text-[10px] font-semibold text-olive/70 hover:text-olive">
            <span className="text-xl mb-1">💬</span>
            Forum
          </Link>
          <Link to="/map" className="flex flex-col items-center justify-center w-full h-full text-[10px] font-semibold text-olive/70 hover:text-olive">
            <span className="text-xl mb-1">📍</span>
            Map
          </Link>
          <Link to="/accountability" className="flex flex-col items-center justify-center w-full h-full text-[10px] font-semibold text-olive/70 hover:text-olive">
            <span className="text-xl mb-1">⚖️</span>
            Track
          </Link>
      </nav>
    </div>
    </AuthProvider>
  );
}

export default App;
