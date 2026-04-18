/**
 * communityDb.js — Forum and Petition handlers.
 * Syncs community data to Supabase with localStorage fallback.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const FORUM_KEY = 'bb_forum_posts';
const PETITION_KEY = 'bb_petitions';

// ─── Forum Posts ──────────────────────────────────────────────────────────
export async function submitPost(postData) {
  const record = {
    ...postData,
    ts: Date.now(),
    upvotes: 0,
    replies: []
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('forum_posts').insert([record]).select().single();
    return { data, error };
  }

  const all = JSON.parse(localStorage.getItem(FORUM_KEY) || '[]');
  const localRecord = { ...record, id: Date.now() };
  localStorage.setItem(FORUM_KEY, JSON.stringify([localRecord, ...all]));
  return { data: localRecord, error: null };
}

export async function getPosts() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('forum_posts').select('*').order('ts', { ascending: false });
    return error ? [] : data;
  }
  return JSON.parse(localStorage.getItem(FORUM_KEY) || '[]');
}

// ─── Petitions ────────────────────────────────────────────────────────────
export async function submitPetition(petitionData) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('petitions').insert([petitionData]).select().single();
    return { data, error };
  }

  const all = JSON.parse(localStorage.getItem(PETITION_KEY) || '[]');
  const localRecord = { ...petitionData, id: Date.now(), signatures: 0 };
  localStorage.setItem(PETITION_KEY, JSON.stringify([localRecord, ...all]));
  return { data: localRecord, error: null };
}

export async function getPetitions() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('petitions').select('*').order('created_at', { ascending: false });
    return error ? [] : data;
  }
  return JSON.parse(localStorage.getItem(PETITION_KEY) || '[]');
}
