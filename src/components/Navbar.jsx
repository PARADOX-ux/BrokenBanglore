import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Report', path: '/report' },
    { name: 'Petitions', path: '/petitions' },
    { name: 'Forum', path: '/forum' },
    { name: 'Map', path: '/map' },
    { name: 'Accountability', path: '/accountability' },
  ];

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl">
      <div className="glass h-16 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-between px-6 md:px-10 premium-shadow">
        <Link to="/" className="font-display font-black text-xl md:text-3xl flex items-center gap-2 text-forest tracking-tighter uppercase group">
          <span className="bg-forest text-gold w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl group-hover:rotate-12 transition-transform duration-500">B</span>
          <span className="hidden sm:inline">Broken Bengaluru</span>
          <span className="sm:hidden">BB</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 font-bold text-xs uppercase tracking-widest">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`hover:text-bright transition-all px-3 py-2 rounded-lg ${
                location.pathname === link.path ? 'bg-forest text-gold shadow-lg' : 'text-forest/60'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          <Link to="/report" className="hidden md:flex bg-bright text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-bright/20">
            Report Now
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-forest hover:bg-forest/5 rounded-xl transition-colors"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen bg-cream/95 backdrop-blur-2xl z-[99] p-8 lg:hidden flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
           <button 
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-8 right-8 p-4 text-forest text-2xl"
          >
            ✕
          </button>
          <div className="flex flex-col gap-8 items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`font-display font-black text-4xl uppercase tracking-tighter transition-colors ${
                  location.pathname === link.path ? 'text-bright' : 'text-forest'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
