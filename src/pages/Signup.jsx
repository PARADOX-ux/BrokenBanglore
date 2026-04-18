import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function Signup() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isLoggedIn, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', ward: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const configured = isSupabaseConfigured();

  // If already logged in, show profile
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f5f3ea] flex items-center justify-center px-4 py-20 font-body">
        <div className="w-full max-w-md bg-white border border-[#1a3a2a]/10 rounded-3xl p-8 shadow-xl text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-display font-bold text-2xl text-[#1a3a2a] mb-2">You're in, {displayName}!</h1>
          <p className="text-[#1a3a2a]/60 font-medium mb-8">You're now part of the BrokenBanglore movement.</p>
          <div className="space-y-3">
            <Link to="/report" className="w-full bg-forest text-gold py-4 rounded-xl font-bold text-lg hover:bg-[#1a3a2a] transition-colors inline-block">
              📸 Report a Problem →
            </Link>
            <button onClick={signOut} className="w-full border border-[#1a3a2a]/20 text-[#1a3a2a]/60 py-3 rounded-xl font-bold hover:border-red-400 hover:text-red-500 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err && err !== 'not_configured') setError('Google sign-in failed. Try again.');
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!configured) {
      // Demo mode — show success without real auth
      setSuccess('demo');
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error: err } = await signInWithEmail(form.email, form.password);
      if (err) { setError(err.message); setLoading(false); return; }
      navigate('/');
    } else {
      const { error: err } = await signUpWithEmail(form.email, form.password, {
        full_name: form.name,
        ward: form.ward,
      });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess('email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ea] flex items-center justify-center px-4 py-20 font-body">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-block font-display font-bold text-2xl text-[#1a3a2a] mb-2">
            BrokenBanglore 🔴
          </Link>
          {!configured && (
            <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl px-4 py-2">
              ⚠️ Demo mode — Supabase not connected yet. Auth will simulate locally.
            </div>
          )}
        </div>

        <div className="bg-white border border-[#1a3a2a]/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-forest/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="font-display font-bold text-2xl text-[#1a3a2a] mb-6">
              {isLogin ? 'Welcome back' : 'Join the movement'}
            </h1>

            {success === 'email' ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="font-display font-bold text-xl text-[#1a3a2a] mb-2">Check your inbox!</h2>
                <p className="text-[#1a3a2a]/60 font-medium text-sm">We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.</p>
              </div>
            ) : success === 'demo' ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="font-display font-bold text-xl text-[#1a3a2a] mb-2">Welcome to BrokenBanglore!</h2>
                <p className="text-[#1a3a2a]/60 font-medium text-sm mb-6">Demo mode active. Connect Supabase to enable real accounts.</p>
                <Link to="/report" className="bg-forest text-gold px-6 py-3 rounded-xl font-bold hover:bg-[#1a3a2a] transition-colors inline-block">
                  📸 Report a Problem →
                </Link>
              </div>
            ) : (
              <>
                {/* Google Auth — the real button */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#1a3a2a]/15 rounded-xl px-4 py-3.5 font-bold text-[#1a3a2a] hover:border-[#1a3a2a]/40 hover:bg-[#1a3a2a]/5 transition-all mb-5 shadow-sm disabled:opacity-50"
                >
                  <GoogleIcon />
                  {loading ? 'Redirecting…' : 'Continue with Google'}
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-[#1a3a2a]/10"></div>
                  <span className="text-xs font-bold text-[#1a3a2a]/30 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-[#1a3a2a]/10"></div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3 mb-4">
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/40 mb-1.5">Full Name</label>
                      <input type="text" placeholder="Arjun Kumar" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full bg-[#f5f3ea] border border-[#1a3a2a]/15 rounded-xl px-4 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all font-medium text-[#1a3a2a]" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/40 mb-1.5">Email Address</label>
                    <input type="email" required placeholder="name@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full bg-[#f5f3ea] border border-[#1a3a2a]/15 rounded-xl px-4 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all font-medium text-[#1a3a2a]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/40 mb-1.5">Password</label>
                    <input type="password" required placeholder="min. 8 characters" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      className="w-full bg-[#f5f3ea] border border-[#1a3a2a]/15 rounded-xl px-4 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all font-medium text-[#1a3a2a]" />
                  </div>
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#1a3a2a]/40 mb-1.5">Your Area <span className="normal-case tracking-normal text-[#1a3a2a]/20">(optional)</span></label>
                      <input type="text" placeholder="e.g. Indiranagar, HSR Layout" value={form.ward} onChange={e => setForm({...form, ward: e.target.value})}
                        className="w-full bg-[#f5f3ea] border border-[#1a3a2a]/15 rounded-xl px-4 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all font-medium text-[#1a3a2a]" />
                    </div>
                  )}
                  <button type="submit" disabled={loading}
                    className="w-full bg-forest text-gold py-4 rounded-xl font-bold font-display text-lg shadow-lg hover:bg-[#1a3a2a] transition-all transform hover:-translate-y-0.5 disabled:opacity-60 mt-2"
                  >
                    {loading ? 'Please wait…' : isLogin ? 'Login →' : 'Join the Movement →'}
                  </button>
                </form>

                {!isLogin && (
                  <p className="text-xs text-center text-[#1a3a2a]/30 font-medium mt-4">
                    🔒 No spam. No selling. Your data stays private.
                  </p>
                )}
              </>
            )}

            {!success && (
              <div className="mt-6 text-center pt-5 border-t border-[#1a3a2a]/5">
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-[#1a3a2a]/50 hover:text-forest text-sm font-bold transition-colors"
                >
                  {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link to="/" className="text-[10px] uppercase tracking-tighter font-bold text-[#1a3a2a]/20 hover:text-forest transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>

        {!isLogin && !success && (
          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs font-bold text-[#1a3a2a]/50">
            <div className="bg-white rounded-xl p-3 border border-[#1a3a2a]/10"><div className="text-lg mb-1">📸</div>Track reports</div>
            <div className="bg-white rounded-xl p-3 border border-[#1a3a2a]/10"><div className="text-lg mb-1">✍️</div>Sign petitions</div>
            <div className="bg-white rounded-xl p-3 border border-[#1a3a2a]/10"><div className="text-lg mb-1">⚖️</div>Hold MLAs accountable</div>
          </div>
        )}
      </div>
    </div>
  );
}
