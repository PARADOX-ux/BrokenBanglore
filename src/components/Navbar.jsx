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
    <header className="fixed top-0 left-0 right-0 z-[100] bg-cream border-b-2 border-black w-full h-16 md:h-20 flex items-center justify-between px-4 md:px-8">
      <Link to="/" className="font-nav font-black text-xl md:text-3xl flex flex-col items-start gap-0 text-black tracking-tighter leading-none group">
        <span>Broken Bengaluru</span>
        <span className="text-[7px] font-black tracking-[0.2em] text-red-600 flex items-center gap-1 mt-1">
           <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
           ANONYMOUS AUDIT ENABLED
        </span>
      </Link>
      
      {/* Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-8 font-black text-sm md:text-lg uppercase tracking-widest text-black/60">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path}
            className={`hover:text-forest transition-colors pb-1 border-b-2 ${
              location.pathname === link.path ? 'border-black text-black' : 'border-transparent text-black/40'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 text-black bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 bg-cream z-[99] p-8 lg:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-6 items-center pt-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="font-nav font-black text-3xl uppercase tracking-tighter text-black hover:text-forest transition-colors"
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
