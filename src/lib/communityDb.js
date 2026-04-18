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
    title: postData.title,
    body: postData.body,
    author_name: postData.author_name || 'Anonymous Citizen',
    ward: postData.ward || 'Bengaluru',
    category: postData.category || 'discussions',
    upvotes: 0,
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('forum_posts').insert([record]).select().single();
    return { data, error };
  }

  const all = JSON.parse(localStorage.getItem(FORUM_KEY) || '[]');
  const localRecord = { ...record, ts: Date.now(), id: Date.now(), replies: [] };
  localStorage.setItem(FORUM_KEY, JSON.stringify([localRecord, ...all]));
  return { data: localRecord, error: null };
}

export async function getPosts() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
    return error ? [] : (data || []).map(p => ({
      ...p,
      ts: new Date(p.created_at).getTime(), // Map DB created_at to ts for UI
      author: p.author_name,
      tab: p.category
    }));
  }
  return JSON.parse(localStorage.getItem(FORUM_KEY) || '[]');
}

// ─── Petitions ────────────────────────────────────────────────────────────
export async function submitPetition(petitionData) {
  const record = {
    title: petitionData.title,
    description: petitionData.description,
    ward_no: Number(petitionData.ward_no) || null,
    area_name: petitionData.area_name || 'Bengaluru',
    goal_signatures: Number(petitionData.goal_signatures) || 500,
    current_signatures: 1,
    status: 'active'
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('petitions').insert([record]).select().single();
    return { data, error };
  }

  const all = JSON.parse(localStorage.getItem(PETITION_KEY) || '[]');
  const localRecord = { ...record, id: Date.now(), signatures: 1 };
  localStorage.setItem(PETITION_KEY, JSON.stringify([localRecord, ...all]));
  return { data: localRecord, error: null };
}

export async function getPetitions() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('petitions').select('*').order('created_at', { ascending: false });
    return error ? [] : (data || []).map(p => ({
      ...p,
      signatures: p.current_signatures,
      goal: p.goal_signatures,
      ward: p.ward_no
    }));
  }
  return JSON.parse(localStorage.getItem(PETITION_KEY) || '[]');
}
