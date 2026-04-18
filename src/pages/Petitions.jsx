import { useState, useEffect } from 'react';
import { wardMLAData, getStats, incrementStat } from '../data/wardData';

export default function Petitions() {
  const [petitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', ward: '', goal: '' });
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    const handler = (e) => setStats(e.detail);
    window.addEventListener('bb-stats-update', handler);
    return () => window.removeEventListener('bb-stats-update', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    incrementStat('petitions');
    incrementStat('citizens');
    setSubmitted(true);
    setTimeout(() => {
      setShowForm(false);
      setSubmitted(false);
      setForm({ title: '', description: '', ward: '', goal: '' });
    }, 2500);
  };

  return (
    <div className="w-full min-h-screen bg-white py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-[#1a3a2a] mb-2">Active Petitions</h1>
            <p className="text-[#1a3a2a]/70 font-semibold text-lg">Gather signatures. Force government action. <span className="text-forest font-bold">{stats.petitions} petitions filed.</span></p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-forest text-gold hover:bg-[#1a3a2a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 text-base"
          >
            ✍️ Start a Petition
          </button>
        </div>

        {/* Petition Modal */}
        {showForm && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="font-display font-bold text-3xl text-[#1a3a2a] mb-2">Petition Started!</h2>
                  <p className="text-[#1a3a2a]/70 font-medium">Your petition is now live. Share it to gather signatures.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display font-bold text-2xl text-[#1a3a2a]">Start a Petition</h2>
                    <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-ash/20 flex items-center justify-center text-[#1a3a2a]/50 hover:text-red-500 font-bold">✕</button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block font-bold text-[#1a3a2a] mb-1 text-sm">Petition Title *</label>
                      <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                        placeholder="e.g. Fix the Pothole Death Trap on Sarjapur Road"
                        className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#1a3a2a] mb-1 text-sm">Why this matters *</label>
                      <textarea required rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        placeholder="Explain the problem and what action you're demanding..."
                        className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-medium resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-[#1a3a2a] mb-1 text-sm">Your Area / Ward</label>
                        <input value={form.ward} onChange={e => setForm({...form, ward: e.target.value})}
                          placeholder="e.g. Indiranagar, Ward 52"
                          className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#1a3a2a] mb-1 text-sm">Signature Goal</label>
                        <input type="number" min="10" value={form.goal} onChange={e => setForm({...form, goal: e.target.value})}
                          placeholder="e.g. 500"
                          className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-medium"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-forest text-gold py-4 rounded-xl font-bold text-lg hover:bg-[#1a3a2a] transition-colors shadow-md mt-2">
                      🚀 Launch Petition
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {petitions.length > 0 ? (
            petitions.map(petition => {
              const mla = wardMLAData.find(w => w.ward === petition.ward);
              return (
                <div key={petition.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-ash/40 hover:border-forest hover:shadow-md transition-all flex flex-col">
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 bg-forest/5 border-2 border-dashed border-forest/20 rounded-3xl flex flex-col items-center justify-center text-center">
              <span className="text-6xl mb-6">✍️</span>
              <h3 className="font-display font-bold text-2xl text-[#1a3a2a]">No active petitions yet.</h3>
              <p className="text-[#1a3a2a]/60 font-semibold mt-2 max-w-sm px-4">The platform is launching. Be the first to start a movement in your ward!</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 bg-forest text-gold px-6 py-3 rounded-xl font-bold hover:bg-[#1a3a2a] transition-colors shadow"
              >
                ✍️ Start the First Petition →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
