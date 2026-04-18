// supabase/functions/send-complaint-email/index.ts
// Deploy with: supabase functions deploy send-complaint-email
// Set secrets: supabase secrets set RESEND_API_KEY=re_xxxxx FROM_EMAIL=reports@brokenbanglore.in

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// BBMP Zonal Commissioner emails (official public contacts)
const BBMP_ZONE_EMAILS: Record<string, string> = {
  'East':          'acoeast@bbmp.gov.in',
  'West':          'acowest@bbmp.gov.in',
  'South':         'acosouth@bbmp.gov.in',
  'North':         'aconorth@bbmp.gov.in',
  'Mahadevapura':  'acomahadevapura@bbmp.gov.in',
  'Bommanahalli':  'acobommanahalli@bbmp.gov.in',
  'RR Nagar':      'acorrnagar@bbmp.gov.in',
  'Dasarahalli':   'acodasarahalli@bbmp.gov.in',
};

// Ward → Zone mapping (simplified; full mapping in wardData.js)
function getZoneForWard(wardNo: number): string {
  if (wardNo <= 30)  return 'South';
  if (wardNo <= 60)  return 'East';
  if (wardNo <= 90)  return 'West';
  if (wardNo <= 120) return 'North';
  if (wardNo <= 150) return 'Mahadevapura';
  if (wardNo <= 180) return 'Bommanahalli';
  if (wardNo <= 210) return 'RR Nagar';
  return 'Dasarahalli';
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { report } = await req.json();
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') || 'reports@brokenbanglore.in';

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500 });
  }

  const zone       = getZoneForWard(report.ward_no);
  const toEmail    = BBMP_ZONE_EMAILS[zone] || 'commissioner@bbmp.gov.in';
  const mlaEmail   = `mla-${(report.constituency || 'office').toLowerCase().replace(/\s/g, '-')}@kla.kar.nic.in`;
  const refNo      = report.ref_no || `BB-${report.id?.slice(0, 8)?.toUpperCase()}`;

  const emailHtml = `
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a3a2a;">
  <div style="background: #1a3a2a; padding: 20px; text-align: center;">
    <h1 style="color: #E9C46A; margin: 0; font-size: 22px;">BrokenBanglore — Citizen Complaint</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 5px 0 0;">Automated escalation from a verified Bengaluru resident</p>
  </div>

  <div style="padding: 30px; background: #f5f3ea;">
    <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #c0392b;">
      <p style="margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Reference Number</p>
      <h2 style="margin: 0; color: #1a3a2a; font-size: 24px; letter-spacing: 2px;">${refNo}</h2>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      ${[
        ['Issue', report.title],
        ['Category', report.category || 'General'],
        ['Severity', report.severity || 'Medium'],
        ['Location', `${report.area_name || 'Bengaluru'}, Ward ${report.ward_no || '—'}`],
        ['MLA (State)', `${report.mla_name || '—'} (${report.mla_party || '—'})`],
        ['MP (Lok Sabha)', `${report.mp_name || '—'}, ${report.mp_constituency || '—'}`],
        ['Filed On', new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })],
      ].map(([key, val]) => `
        <tr style="border-bottom: 1px solid #e8e8e8;">
          <td style="padding: 10px 0; font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; width: 35%;">${key}</td>
          <td style="padding: 10px 0; color: #1a3a2a; font-weight: 600;">${val}</td>
        </tr>
      `).join('')}
    </table>

    ${report.description ? `<div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666;">Citizen's Description</p>
      <p style="margin: 0; color: #1a3a2a; line-height: 1.6;">${report.description}</p>
    </div>` : ''}

    <div style="background: #1a3a2a; border-radius: 12px; padding: 20px; color: white; margin-bottom: 20px;">
      <p style="margin: 0 0 10px; font-weight: bold;">Expected Action:</p>
      <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.8); line-height: 1.8;">
        <li>Acknowledge this complaint within <strong>7 working days</strong></li>
        <li>Assign a field officer for on-site inspection</li>
        <li>Provide a resolution timeline within <strong>30 days</strong></li>
        <li>Update the complaint status on BrokenBanglore portal</li>
      </ul>
    </div>

    <p style="color: #666; font-size: 12px; line-height: 1.6;">
      This complaint is publicly documented at <a href="https://brokenbanglore.in/map" style="color: #2B9348;">brokenbanglore.in/map</a> and is visible to all citizens. 
      If unresolved after 15 days, this will be automatically re-escalated and flagged for media attention.
      Citizens may also file an RTI application (RTI Act 2005) if no response is received.
    </p>
  </div>

  <div style="background: #1a3a2a; padding: 15px; text-align: center;">
    <p style="color: rgba(255,255,255,0.4); margin: 0; font-size: 11px;">BrokenBanglore — Built by Bengaloreans. For Bengaloreans.</p>
  </div>
</body></html>`;

  // Send email via Resend
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `BrokenBanglore Reports <${FROM_EMAIL}>`,
      to: [toEmail],
      cc: [mlaEmail, 'track@brokenbanglore.in'],
      reply_to: report.reporter_email || FROM_EMAIL,
      subject: `[Citizen Complaint ${refNo}] ${report.title} — Ward ${report.ward_no}, ${zone} Zone`,
      html: emailHtml,
    }),
  });

  const result = await response.json();

  // Log to console for debugging
  console.log(`Email sent to ${toEmail} for complaint ${refNo}:`, result);

  return new Response(JSON.stringify({ sent: true, refNo, to: toEmail, result }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
