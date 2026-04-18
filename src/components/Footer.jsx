import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-olive text-tea py-12 px-4 md:px-8 text-center mt-auto">
       <div className="font-display font-bold text-2xl mb-4 flex justify-center items-center gap-2">
          BrokenBanglore <span className="text-red-500 animate-pulse-fast text-[16px]">🔴</span>
       </div>
       <p className="font-display font-bold text-xl md:text-2xl text-gold mb-3 opacity-90 uppercase tracking-tight">Audit. Accountability. Action.</p>
       <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-tea/40">
          Reclaim. Restore. Resist.
       </div>
       <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-tea/20">
          <div>© 2024 Garden City Resistance</div>
          <div className="flex gap-6">
            <Link to="/map" className="hover:text-gold transition-colors">Map</Link>
            <Link to="/report" className="hover:text-gold transition-colors">Reports</Link>
            <Link to="/petitions" className="hover:text-gold transition-colors">Petitions</Link>
            <Link to="/forum" className="hover:text-gold transition-colors">Forum</Link>
          </div>
       </div>
    </footer>
  );
}
