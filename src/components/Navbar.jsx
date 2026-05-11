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
    <header className="fixed top-0 left-0 right-0 z-[500] bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 w-full h-16 md:h-20 flex items-center justify-between px-6 md:px-12 transition-all duration-300">
      <Link to="/" className="font-display font-black text-xl md:text-2xl flex flex-col items-start gap-0 text-white tracking-tighter leading-none group">
        <span>BROKENBENGALURU</span>
        <span className="text-[7px] font-bold tracking-[0.3em] text-amber-500 flex items-center gap-1 mt-1 uppercase">
           <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
           CITIZEN AUDIT ACTIVE
        </span>
      </Link>
      
      {/* Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-8 font-bold text-xs uppercase tracking-widest text-white/50">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path}
            className={`hover:text-white transition-colors py-2 ${
              location.pathname === link.path ? 'text-white border-b border-amber-500' : 'border-b border-transparent'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden p-2 text-white bg-white/5 border border-white/10 rounded-lg backdrop-blur-md"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 bg-[#050505]/95 backdrop-blur-2xl z-[499] p-8 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-8 items-center pt-12">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="font-display font-black text-3xl uppercase tracking-tighter text-white hover:text-amber-500 transition-colors"
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
