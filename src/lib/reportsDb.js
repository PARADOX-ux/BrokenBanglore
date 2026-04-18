/**
 * reportsDb.js — All report CRUD operations.
 * Uses Supabase when configured, falls back to localStorage.
 * This is the single source of truth for all report data across the app.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import { incrementStat } from '../data/wardData';

const LS_KEY = 'bb_reports';

// ─── localStorage helpers ─────────────────────────────────────────────────
function lsGetAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}
function lsSave(reports) {
  localStorage.setItem(LS_KEY, JSON.stringify(reports));
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Submit a new report. Saves to Supabase if connected, localStorage otherwise.
 * Always returns { data, refNo, error }.
 */
export async function submitReport(reportData) {
  const refNo = `BB-${Date.now().toString(36).toUpperCase()}`;
  const record = { ...reportData, ref_no: refNo, status: 'open', created_at: new Date().toISOString() };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('reports').insert([record]).select().single();
    if (!error) {
      incrementStat('reports');
      incrementStat('citizens');
      // Trigger automated email via Supabase Edge Function
      await sendComplaintEmail(data);
    }
    return { data, refNo, error };
  }

  // localStorage fallback
  const all = lsGetAll();
  const full = { ...record, id: refNo };
  lsSave([full, ...all]);
  incrementStat('reports');
  incrementStat('citizens');
  return { data: full, refNo, error: null };
}

/**
 * Get all reports — with optional ward_no filter.
 * Used by Map.jsx to show ward-level report counts.
 */
export async function getReports(filters = {}) {
  if (isSupabaseConfigured()) {
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (filters.ward_no) query = query.eq('ward_no', filters.ward_no);
    if (filters.status)  query = query.eq('status', filters.status);
    const { data, error } = await query;
    return error ? [] : data;
  }

  // localStorage fallback
  let all = lsGetAll();
  if (filters.ward_no) all = all.filter(r => Number(r.ward_no) === Number(filters.ward_no));
  if (filters.status)  all = all.filter(r => r.status === filters.status);
  return all;
}

/**
 * Upvote a report (one per browser session via localStorage flag).
 */
export async function upvoteReport(reportId) {
  const key = `bb_upvoted_${reportId}`;
  if (localStorage.getItem(key)) return { error: 'already_voted' };
  localStorage.setItem(key, '1');

  if (isSupabaseConfigured()) {
    const { error } = await supabase.rpc('increment_upvotes', { report_id: reportId });
    return { error };
  }

  // localStorage fallback
  const all = lsGetAll();
  const updated = all.map(r => r.id === reportId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r);
  lsSave(updated);
  return { error: null };
}

/**
 * Mark a report as resolved (citizen-verified).
 */
export async function markResolved(reportId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', reportId);
    if (!error) incrementStat('resolved');
    return { error };
  }

  const all = lsGetAll();
  const updated = all.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r);
  lsSave(updated);
  incrementStat('resolved');
  return { error: null };
}

// ─── Email escalation via Supabase Edge Function ──────────────────────────
async function sendComplaintEmail(report) {
  try {
    await supabase.functions.invoke('send-complaint-email', { body: { report } });
  } catch (e) {
    console.warn('Email function not deployed yet:', e.message);
  }
}
