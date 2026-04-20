import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, submitPost } from '../lib/communityDb';

const FORUM_KEY = 'bb_forum_posts';
const TABS = ['Trending', 'Discussions', 'Success Stories', 'Legal Help', 'Organizing'];

const TAB_INFO = {
  'Trending': { desc: 'Most upvoted civic issues this week', icon: '🔥' },
  'Discussions': { desc: 'Open conversations about ward problems', icon: '💬' },
  'Success Stories': { desc: 'Issues that got fixed. Celebrate wins.', icon: '✅' },
  'Legal Help': { desc: 'RTI, PILs, legal routes to force action', icon: '⚖️' },
  'Organizing': { desc: 'Plan meetups, protests, WhatsApp campaigns', icon: '🤝' },
};

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Discussions');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', author: '', ward: '', tab: 'Discussions' });
  const [submitted, setSubmitted] = useState(false);

  const SEED_POSTS = [
    {
      id: 1,
      title: "Broken streetlights in Indiranagar 2nd stage since 2 weeks",
      body: "Walked home last night in pitch dark. Multiple elderly people live on this lane. Complained on Sahaya app but no update.",
      author: "Anonymous",
      ward: "80 - Indiranagar",
      tab: 'Discussions',
      upvotes: 42,
      replies: [],
      votedBy: [],
      ts: Date.now() - 3600000 * 5,
    },
    {
      id: 2,
      title: "How to file an RTI for ward fund allocation?",
      body: "I want to know where the 2 crore allocated for road repairs went. Has anyone done this before in Ward 150?",
      author: "Anonymous",
      ward: "150 - Bellandur",
      tab: 'Legal Help',
      upvotes: 89,
      replies: [],
      votedBy: [],
      ts: Date.now() - 86400000,
    },
    {
      id: 3,
      title: "STP water overflow near HSR layout park",
      body: "Health hazard for kids playing in the park. Need to mobilize and tweet to BWSSB chief.",
      author: "Anonymous",
      ward: "174 - HSR Layout",
      tab: 'Organizing',
      upvotes: 24,
      replies: [],
      votedBy: [],
      ts: Date.now() - 3600000 * 24,
    }
  ];

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORUM_KEY);
      if (raw) {
        setPosts(JSON.parse(raw));
      } else {
        setPosts(SEED_POSTS);
        localStorage.setItem(FORUM_KEY, JSON.stringify(SEED_POSTS));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    getPosts().then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await submitPost({
      title: form.title,
      body: form.body,
      author: form.author || 'Anonymous Citizen',
      ward: form.ward || 'Bengaluru',
      tab: form.tab,
    });
    
    if (data) setPosts([data, ...posts]);
    setSubmitted(true);
    setTimeout(() => {
      setShowForm(false);
      setSubmitted(false);
      setForm({ title: '', body: '', author: '', ward: '', tab: 'Discussions' });
    }, 2000);
  };

  const upvote = (postId) => {
    const key = 'bb_voted_' + postId;
    if (localStorage.getItem(key)) return; // No double vote
    localStorage.setItem(key, '1');
    const updated = posts.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p);
    savePosts(updated);
  };

  const filteredPosts = posts.filter(p =>
    activeTab === 'Trending' ? true : p.tab === activeTab
  ).sort((a, b) => activeTab === 'Trending' ? b.upvotes - a.upvotes : b.ts - a.ts);

  const topContributors = Object.entries(posts.reduce((acc, p) => {
    acc[p.author] = (acc[p.author] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="w-full min-h-screen bg-[#fdfbf6] py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 pt-16">

        {/* Main Feed */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="font-display font-bold text-4xl text-[#1a3a2a]">Citizen Forum</h1>
              <p className="text-[#1a3a2a]/60 font-semibold text-sm mt-1">{posts.length} posts from Bengaluru citizens</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-forest text-gold hover:bg-[#1a3a2a] px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md flex items-center gap-2"
            >
              <span>💬</span> New Post
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all border ${
                  activeTab === tab
                    ? 'bg-[#1a3a2a] text-white border-[#1a3a2a] shadow-sm'
                    : 'bg-white text-[#1a3a2a] border-[#1a3a2a]/20 hover:border-[#1a3a2a] hover:bg-[#1a3a2a]/5'
                }`}
              >
                {TAB_INFO[tab]?.icon} {tab}
              </button>
            ))}
          </div>

          {/* Tab descriptor */}
          <div className="bg-white rounded-2xl px-5 py-3 mb-5 border border-[#1a3a2a]/10 flex items-center gap-3">
            <span className="text-2xl">{TAB_INFO[activeTab]?.icon}</span>
            <span className="text-sm font-semibold text-[#1a3a2a]/70">{TAB_INFO[activeTab]?.desc}</span>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl p-5 border border-[#1a3a2a]/10 shadow-sm hover:shadow-md hover:border-forest transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold bg-forest/10 text-forest px-2 py-0.5 rounded-full">{post.tab}</span>
                        {post.ward && <span className="text-xs font-bold text-[#1a3a2a]/50">📍 {post.ward}</span>}
                        <span className="text-xs text-[#1a3a2a]/40 font-medium">{timeAgo(post.ts)}</span>
                      </div>
                      <h3 className="font-black text-xl text-black leading-tight mb-2 uppercase tracking-tight">{post.title}</h3>
                      {post.body && <p className="text-sm text-black/80 font-bold leading-relaxed line-clamp-3 mb-4">{post.body}</p>}
                      <div className="mt-3 flex items-center gap-1 text-xs font-black text-black/40">
                        <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center font-black text-[10px]">A</span>
                        Anonymous Citizen
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => upvote(post.id)}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl font-bold transition-all text-sm ${
                          localStorage.getItem('bb_voted_' + post.id)
                            ? 'bg-forest text-gold cursor-default'
                            : 'bg-forest/10 text-forest hover:bg-forest hover:text-gold'
                        }`}
                      >
                        <span className="text-lg">▲</span>
                        <span>{post.upvotes}</span>
                      </button>
                    </div>
                  </div>

                  {/* Share row */}
                  <div className="mt-4 pt-3 border-t border-[#1a3a2a]/5 flex gap-3 flex-wrap">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`"${post.title}" — A citizen in ${post.ward} is raising this on BrokenBengaluru. Add your voice → brokenbengaluru.in/forum`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#25D366] hover:underline flex items-center gap-1"
                    >
                      📲 Share on WhatsApp
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${post.title}" — Bengaluru citizen raising this issue. ${post.ward ? `Ward: ${post.ward}.` : ''} → brokenbengaluru.in/forum #BrokenBengaluru #FixBengaluru`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#1a1a1a] hover:underline flex items-center gap-1"
                    >
                      𝕏 Tweet this
                    </a>
                    {post.tab === 'Legal Help' && (
                      <a
                        href="https://rtionline.gov.in/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        ⚖️ File RTI
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 bg-white border-2 border-dashed border-[#1a3a2a]/15 rounded-3xl flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4">{TAB_INFO[activeTab]?.icon || '🤝'}</span>
                <h3 className="font-display font-bold text-xl text-[#1a3a2a]/60">
                  {activeTab === 'Trending' ? 'No posts yet.' : `No ${activeTab} posts yet.`}
                </h3>
                <p className="text-[#1a3a2a]/40 font-semibold px-8 mt-2 text-sm">Be the first voice from your neighborhood.</p>
                <button
                  onClick={() => { setForm(f => ({...f, tab: activeTab === 'Trending' ? 'Discussions' : activeTab})); setShowForm(true); }}
                  className="mt-6 bg-forest text-gold px-6 py-3 rounded-xl font-bold hover:bg-[#1a3a2a] transition-colors"
                >
                  Start the Conversation →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 flex flex-col gap-5 shrink-0">

          {/* How to escalate — this is the KEY accountability mechanic */}
          <div className="bg-[#1a3a2a] rounded-2xl p-6 text-white">
            <h3 className="font-display font-bold text-lg mb-3">How to reach your representative</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-start">
                <span className="bg-gold/20 text-gold rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <p className="text-white/80 font-medium">Post your issue here. Upvotes = public proof of demand.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="bg-gold/20 text-gold rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <p className="text-white/80 font-medium">Share on WhatsApp groups in your area to rally neighbours.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="bg-gold/20 text-gold rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <p className="text-white/80 font-medium">Tweet it tagging your MLA/MP directly. Public shame = action.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="bg-gold/20 text-gold rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                <p className="text-white/80 font-medium">File an RTI if ignored for 30+ days. Legal pressure works.</p>
              </div>
            </div>
            <a
              href="https://rtionline.gov.in/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 w-full bg-gold text-[#1a3a2a] py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:brightness-110 transition-all block text-sm text-center"
            >
              ⚖️ File RTI Online →
            </a>
          </div>

          {/* Community Guidelines */}
          <div className="bg-white rounded-2xl p-6 border border-[#1a3a2a]/10 shadow-sm">
            <h3 className="font-display font-bold text-lg text-[#1a3a2a] mb-3">Community Rules</h3>
            <ul className="space-y-2.5 text-sm text-[#1a3a2a]/70 font-medium">
              <li className="flex gap-2 items-start"><span className="text-forest font-bold mt-0.5">✓</span> Be factual. Evidence over emotion.</li>
              <li className="flex gap-2 items-start"><span className="text-forest font-bold mt-0.5">✓</span> Respect officials as individuals.</li>
              <li className="flex gap-2 items-start"><span className="text-forest font-bold mt-0.5">✓</span> Only civic issues — roads, water, power, garbage.</li>
              <li className="flex gap-2 items-start"><span className="text-red-500 font-bold mt-0.5">✗</span> No political party propaganda.</li>
              <li className="flex gap-2 items-start"><span className="text-red-500 font-bold mt-0.5">✗</span> No personal attacks or misinformation.</li>
            </ul>
          </div>

          {/* Active Wards */}
          <div className="bg-white rounded-2xl p-6 border border-[#1a3a2a]/10 shadow-sm">
            <h3 className="font-display font-bold text-lg text-[#1a3a2a] mb-4">📢 Active Wards</h3>
            {posts.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(posts.reduce((acc, p) => {
                  acc[p.ward] = (acc[p.ward] || 0) + 1;
                  return acc;
                }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([ward, count], i) => (
                  <div key={ward} className="flex items-center gap-3">
                    <span className="font-bold text-[#1a3a2a]/40 text-sm w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#1a3a2a] text-sm truncate">{ward}</div>
                      <div className="text-xs text-[#1a3a2a]/40 font-medium">{count} active discussion{count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-[#1a3a2a]/30 italic text-center py-4">No data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="font-display font-bold text-3xl text-[#1a3a2a] mb-2">Post Published!</h2>
                <p className="text-[#1a3a2a]/60 font-medium">Your voice is now live on the forum.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display font-bold text-2xl text-[#1a3a2a]">New Forum Post</h2>
                  <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-ash/20 flex items-center justify-center text-[#1a3a2a]/40 hover:text-red-500 font-bold">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/50 mb-1">Category *</label>
                    <select
                      required
                      value={form.tab}
                      onChange={e => setForm({...form, tab: e.target.value})}
                      className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-semibold bg-white"
                    >
                      {TABS.filter(t => t !== 'Trending').map(t => (
                        <option key={t} value={t}>{TAB_INFO[t]?.icon} {t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/50 mb-1">Title *</label>
                    <input
                      required
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      placeholder="e.g. The drain near 5th cross hasn't been cleaned in 3 months"
                      className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/50 mb-1">Your Story / Details</label>
                    <textarea
                      rows={4}
                      value={form.body}
                      onChange={e => setForm({...form, body: e.target.value})}
                      placeholder="What's happening? How long? Who have you contacted? What's the impact on residents?"
                      className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-medium resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/50 mb-1">Identity</label>
                      <input
                        disabled
                        value="Anonymous Citizen"
                        className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a]/40 font-black uppercase text-[10px] tracking-widest bg-black/5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/50 mb-1">Area / Ward</label>
                      <input
                        value={form.ward}
                        onChange={e => setForm({...form, ward: e.target.value})}
                        placeholder="e.g. Koramangala"
                        className="w-full border border-[#1a3a2a]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-forest/30 text-[#1a3a2a] font-medium"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-forest text-gold py-4 rounded-xl font-bold text-lg hover:bg-[#1a3a2a] transition-colors shadow-md mt-2">
                    🎯 Publish Post
                  </button>
                  <p className="text-xs text-center text-[#1a3a2a]/40 font-medium">No login required. Anonymous posting supported.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
