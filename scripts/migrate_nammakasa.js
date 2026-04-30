import { createClient } from '@supabase/supabase-js';

/**
 * MIGRATION SCRIPT: Seeding Broken Bengaluru with NammaKasa Data
 * 
 * This script fetches garbage reports from NammaKasa's public Supabase API
 * and inserts them into the Broken Bengaluru database.
 * 
 * TO RUN:
 * 1. Ensure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * 2. Run: node scripts/migrate_nammakasa.js
 */

// --- CONFIG ---
const NAMMAKASA_URL = 'https://tcldazhypyuutdpoksfx.supabase.co/rest/v1/garbage_reports';
const NAMMAKASA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbGRhemh5cHl1dXRkcG9rc2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTE5MzcsImV4cCI6MjA5MDg2NzkzN30.E6HWvErPgkTomXCuxunwwCBbDXsOZ4dVCQ2Bo7_BgAs';

// REPLACE THESE WITH YOUR OWN IF RUNNING LOCALLY
const MY_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const MY_SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!MY_SUPABASE_URL || !MY_SUPABASE_KEY) {
  console.error("❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not found in environment.");
  process.exit(1);
}

const mySupabase = createClient(MY_SUPABASE_URL, MY_SUPABASE_KEY);

async function migrate() {
  console.log("🚀 Starting data migration from NammaKasa...");

  try {
    // 1. Fetch from NammaKasa
    const response = await fetch(`${NAMMAKASA_URL}?select=*`, {
      headers: {
        'apikey': NAMMAKASA_KEY,
        'Authorization': `Bearer ${NAMMAKASA_KEY}`
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch NammaKasa data: ${response.statusText}`);
    const reports = await response.json();
    console.log(`📦 Found ${reports.length} reports on NammaKasa.`);

    // 2. Map and Enrich
    // Note: We'd ideally import wardData.js here, but since this is a standalone script
    // we will rely on our database's "Data Healing" logic or just insert raw and let 
    // the frontend handle enrichment if needed. However, we'll try to map common fields.

    const mappedReports = reports.map(r => ({
      category: 'garbage',
      title: `Reported via NammaKasa: ${r.area_name || 'Garbage Issue'}`,
      description: r.description || `Automated import of garbage report from NammaKasa. Severity: ${r.severity || 'Medium'}.`,
      severity: (r.severity || 'medium').toLowerCase(),
      lat: r.lat,
      lng: r.lng,
      area_name: r.area_name,
      ward_no: r.ward_no ? Number(r.ward_no) : null,
      status: r.status === 'unresolved' ? 'open' : 'resolved',
      ref_no: `NK-${r.id || Date.now()}`,
      created_at: r.created_at || new Date().toISOString(),
      photo_url: r.image_url || r.photo_url || null,
      authority: 'BBMP',
      // The rest (MLA, MP) will be healed by the application logic on display
    }));

    // 3. Insert into our Supabase
    console.log(`📤 Inserting ${mappedReports.length} reports into Broken Bengaluru...`);
    
    const { data, error } = await mySupabase
      .from('reports')
      .upsert(mappedReports, { onConflict: 'ref_no' });

    if (error) {
      console.error("❌ Supabase Insertion Error:", error.message);
    } else {
      console.log("✅ Successfully migrated NammaKasa data!");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  }
}

migrate();
