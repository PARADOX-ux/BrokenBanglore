import { createClient } from '@supabase/supabase-js';

/**
 * MIGRATION SCRIPT: Seeding Broken Bengaluru with IChangeMyCity (Official Complaints)
 * 
 * This script fetches historical complaint data from the OpenCity Urban Data Portal.
 */

const OPENCITY_API = 'https://data.opencity.in/api/action/datastore_search?resource_id=a60abf5c-3a15-4967-af32-c3074248580f&limit=100';
const MY_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const MY_SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!MY_SUPABASE_URL || !MY_SUPABASE_KEY) {
  console.error("❌ Error: Supabase environment variables not found.");
  process.exit(1);
}

const mySupabase = createClient(MY_SUPABASE_URL, MY_SUPABASE_KEY);

async function migrate() {
  console.log("🚀 Starting data migration from OpenCity (IChangeMyCity)...");

  try {
    const response = await fetch(OPENCITY_API);
    const result = await response.json();
    const records = result.result.records;
    console.log(`📦 Found ${records.length} records.`);

    const mapped = records.map(r => ({
      category: (r['Complaint Type'] || 'general').toLowerCase(),
      title: r['Complaint Description']?.substring(0, 50) || 'Official Complaint',
      description: r['Complaint Description'] || 'Imported from official BBMP Sahaaya records via OpenCity.',
      severity: 'medium',
      lat: Number(r['Latitude']),
      lng: Number(r['Longitude']),
      area_name: r['Locality'] || r['Ward Name'],
      ward_no: r['Ward Number'] ? Number(r['Ward Number']) : null,
      status: 'resolved', // Most OpenCity archives are historical
      ref_no: `OC-${r['_id']}`,
      created_at: r['Posted Date'] || new Date().toISOString(),
      authority: 'BBMP'
    })).filter(r => r.lat && r.lng);

    console.log(`📤 Inserting ${mapped.length} records...`);
    const { error } = await mySupabase.from('reports').upsert(mapped, { onConflict: 'ref_no' });

    if (error) console.error("❌ Error:", error.message);
    else console.log("✅ Successfully migrated OpenCity data!");

  } catch (e) {
    console.error("❌ Failed:", e.message);
  }
}

migrate();
