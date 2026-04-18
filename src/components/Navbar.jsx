import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Report', path: '/report' },
    { name: 'Petitions', path: '/petitions' },
    { name: 'Forum', path: '/forum' },
    { name: 'Map', path: '/map' },
    { name: 'Accountability', path: '/accountability' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream shadow-sm border-b border-ash/30 w-full max-w-[2560px] mx-auto h-16 md:h-20 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-2">
        <Link to="/" className="font-display font-bold md:text-2xl text-xl flex items-center gap-2 text-forest">
          BrokenBanglore <span className="text-red-500 animate-pulse-fast text-sm">🔴</span>
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path}
            className={`hover:text-forest transition-colors pb-1 border-b-2 ${
              location.pathname === link.path ? 'border-bright text-forest' : 'border-transparent text-forest/60'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      
      <div className="flex items-center">
        <Link to="/signup" className="bg-forest text-gold font-bold px-6 py-2.5 rounded-xl rounded-tl-none text-sm hover:bg-black transition-all font-display shadow-md">
          Sign Up
        </Link>
      </div>
    </header>
  );
}
