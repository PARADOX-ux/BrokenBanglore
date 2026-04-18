import { useState, useEffect } from 'react';
import { completeMLAList, authorityData, sampleReports, getResponseRateColor, getResponseRateLabel } from '../data/wardData';
import { getReports } from '../lib/reportsDb';

export default function Accountability() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMLA, setSelectedMLA] = useState(null);

  useEffect(() => {
    getReports().then(data => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const ignoredReports = reports.filter(r => r.status === 'open' || r.status === 'ignored').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Process MLAs with real report data
  const processedMLAs = completeMLAList.map(mla => {
    const mlaReports = reports.filter(r => Number(r.ward_no) === Number(mla.ward));
    const mlaTotal = mlaReports.length;
    const mlaResolved = mlaReports.filter(r => r.status === 'resolved').length;
    return {
      ...mla,
      totalReports: mlaTotal,
      resolvedReports: mlaResolved
    };
  });

  // Sorting logic for MLA table (Penalty applied: low resolution rate first)
  const sortedMLAs = [...processedMLAs].sort((a, b) => {
    const rateA = a.totalReports > 0 ? a.resolvedReports / a.totalReports : 1; // 1 means no reports yet (neutral)
    const rateB = b.totalReports > 0 ? b.resolvedReports / b.totalReports : 1;
    return rateA - rateB; // worst first
  });

  return (
    <div className="w-full min-h-screen bg-transparent">
      
      {/* Header Area */}
      <div className="bg-strong/5 w-full px-4 md:px-8 pt-24 pb-12 border-b border-forest/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="font-display font-bold text-4xl md:text-6xl text-forest uppercase tracking-tighter">Broken Bangalore Audit</h1>
            <span className="flex items-center gap-2 bg-bright/10 text-bright px-3 py-1 rounded-full text-xs font-bold border border-bright/20 shadow-sm mt-2 md:mt-4 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Tracking
            </span>
          </div>
          <p className="text-forest/80 text-lg md:text-xl max-w-2xl font-medium mb-10">
            A transparent view of civic issues and representative responsiveness in Bengaluru.
          </p>

          <div className="flex flex-col md:flex-row gap-4 w-full overflow-x-auto pb-4 hide-scrollbar">
            <div className="bg-white border-b-4 border-forest p-4 rounded-xl flex-shrink-0 min-w-[200px]">
              <div className="text-4xl font-display font-bold text-forest mb-1">{totalReports}</div>
              <div className="font-bold text-sm tracking-wider uppercase text-forest/60">Total Reports</div>
            </div>
            <div className="bg-white border-b-4 border-bright p-4 rounded-xl flex-shrink-0 min-w-[200px]">
              <div className="text-4xl font-display font-bold text-bright mb-1">{resolvedReports}</div>
              <div className="font-bold text-sm tracking-wider uppercase text-forest/60">Resolved ({resolutionRate}%)</div>
            </div>
            <div className="bg-white border-b-4 border-forest/30 p-4 rounded-xl flex-shrink-0 min-w-[200px]">
              <div className="text-4xl font-display font-bold text-forest mb-1">{ignoredReports}</div>
              <div className="font-bold text-sm tracking-wider uppercase text-forest/60">Pending Audit</div>
            </div>
            <div className="bg-white border-b-4 border-gold p-4 rounded-xl flex-shrink-0 min-w-[200px]">
              <div className="text-4xl font-display font-bold text-gold mb-1">0</div>
              <div className="font-bold text-sm tracking-wider uppercase text-forest/60">To Media</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-16">

        {/* MLA Tracker Section */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-white shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="font-display font-bold text-3xl text-forest mb-2">Accountability Audit</h2>
              <p className="text-forest/70 font-medium">Objective tracking of citizen problem resolution.</p>
            </div>
            <select className="bg-white border border-ash/80 text-forest font-bold text-sm outline-none px-4 py-2 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-olive/50 hover:border-olive transition-colors">
              <option>Sort by: Resolution Rate ↓</option>
              <option>Sort by: Resolution Rate ↑</option>
              <option>Sort by: Total Reports</option>
            </select>
          </div>

          <div className="w-full overflow-x-auto pb-4">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 bg-tea p-4 rounded-xl mb-4 text-sm font-bold uppercase tracking-wider text-forest/80">
              <div className="col-span-1 border-r border-ash/40">Photo</div>
              <div className="col-span-3 px-2">MLA Name / Party</div>
              <div className="col-span-2">Constituency</div>
              <div className="col-span-2">Reports (Fixed/Total)</div>
              <div className="col-span-3">Response Rate</div>
              <div className="col-span-2 text-right">Escalate</div>
            </div>

            {/* MLA Rows */}
            <div className="flex flex-col gap-4">
              {sortedMLAs.map((mla, idx) => {
                const isWorst = idx === 0;
                const rateColor = getResponseRateColor(mla.totalReports, mla.resolvedReports);
                const rateLabel = getResponseRateLabel(mla.totalReports, mla.resolvedReports);
                const percentage = mla.totalReports > 0 ? (mla.resolvedReports/mla.totalReports)*100 : 0;
                
                return (
                  <div key={mla.constNo} className="group relative bg-white md:bg-transparent rounded-2xl md:rounded-none p-5 md:p-0 border border-ash/40 md:border-b md:border-x-0 md:border-t-0 md:border-ash/30 md:pb-4 hover:bg-white/50 transition-colors">
                    
                    {/* Desktop rendering structure */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center px-4">
                      <div className="col-span-1">
                         <img 
                           src={mla.photo} 
                           alt={mla.mla} 
                           className="w-14 h-14 rounded-full object-cover shadow-sm bg-neutral-200 border-2 border-white hover:scale-110 transition-transform" 
                           onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mla.mla)}&background=${mla.partyColor.replace('#', '')}&color=fff`; }}
                         />
                      </div>
                      
                      <div className="col-span-3 flex items-center gap-3 px-2">
                         {isWorst && <span title="Needs Attention" className="text-xl -ml-2">⚠️</span>}
                         <div className="flex flex-col">
                           <span className="font-bold text-lg text-forest whitespace-nowrap">{mla.mla}</span>
                           <span className="flex items-center gap-1.5 text-xs font-bold mt-1 max-w-max px-2 py-0.5 rounded-md bg-ash/20">
                             <span className="w-2 h-2 rounded-full" style={{backgroundColor: mla.partyColor}}></span>
                             {mla.party}
                           </span>
                         </div>
                      </div>
                      
                      <div className="col-span-2 flex flex-col text-sm">
                        <span className="font-bold">{mla.constituency}</span>
                        <span className="text-forest/60">AC {mla.constNo}</span>
                      </div>

                      <div className="col-span-2 items-center flex gap-3 text-sm">
                        <span className="font-bold text-forest">{mla.resolvedReports} <span className="opacity-40">/</span> {mla.totalReports}</span>
                      </div>

                      <div className="col-span-3 flex flex-col gap-1.5 pe-4">
                         <div className="flex justify-between text-xs font-bold">
                           <span style={{color: rateColor}}>{rateLabel.status}</span>
                           <span>{rateLabel.text}</span>
                         </div>
                         <div className="w-full bg-ash/30 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000 delay-100" style={{width: `${percentage}%`, backgroundColor: rateColor}}></div>
                         </div>
                      </div>

                      <div className="col-span-1 flex justify-end gap-2 text-xl">
                        <button
                           onClick={() => setSelectedMLA(mla)}
                           className="px-4 py-2 rounded-xl text-sm font-bold bg-forest/10 text-forest hover:bg-forest hover:text-gold transition-colors border border-forest/20"
                         >
                           View Audit →
                         </button>
                      </div>
                    </div>

                    {/* Mobile rendering structure */}
                    <div className="md:hidden flex flex-col relative">
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                           <img 
                             src={mla.photo} 
                             alt={mla.mla} 
                             className="w-16 h-16 rounded-full object-cover shadow-sm bg-neutral-200 border-2 border-white" 
                             onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mla.mla)}&background=${mla.partyColor.replace('#', '')}&color=fff`; }}
                           />
                           <div className="flex flex-col">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: mla.partyColor}}></span>
                                {mla.party}
                              </span>
                              <span className="font-bold text-xl text-forest leading-tight">{mla.mla}</span>
                              <span className="text-sm text-forest/70 font-medium">{mla.constituency} · AC {mla.constNo}</span>
                           </div>
                        </div>
                        {isWorst && <span className="text-2xl" title="Needs Attention">⚠️</span>}
                      </div>

                      <div className="bg-ash/10 rounded-lg p-3 mb-4">
                        <div className="flex justify-between text-sm font-bold mb-2">
                           <span className="opacity-80">Response Rate</span>
                           <span style={{color: rateColor}}>{rateLabel.text} ({rateLabel.status})</span>
                         </div>
                         <div className="w-full bg-ash/30 h-2 rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full" style={{width: `${percentage}%`, backgroundColor: rateColor}}></div>
                         </div>
                         <div className="text-xs font-semibold text-forest/70 text-right mt-1">
                           {mla.resolvedReports} Fixed · {mla.totalReports - mla.resolvedReports} Pending
                         </div>
                      </div>

                      <div className="flex gap-2 w-full mt-2">
                        <button
                           onClick={() => setSelectedMLA(mla)}
                           className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-forest/10 text-forest hover:bg-forest hover:text-gold transition-colors border border-forest/20"
                         >
                           View Audit →
                         </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Civic Authorities Tracker */}
        <section>
          <h2 className="font-display font-bold text-3xl text-forest mb-6">Government Authorities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {authorityData.map(auth => (
              <div key={auth.name} className="bg-white border-2 border-white shadow-sm p-6 rounded-2xl hover:border-gold hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-7xl opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">{auth.icon}</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl bg-tea/50 w-12 h-12 rounded-full flex items-center justify-center">{auth.icon}</div>
                  <div>
                    <h3 className="font-display font-bold text-2xl m-0 leading-none">{auth.name}</h3>
                    <p className="text-[10px] font-bold uppercase text-forest/60 mt-1 max-w-[150px] truncate">{auth.fullName}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex justify-between items-end border-b border-ash/30 pb-2">
                    <span className="text-sm font-bold text-forest/70">Open Tickets</span>
                    <span className="font-display font-bold text-2xl text-red-600 leading-none">{auth.openTickets}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-ash/30 pb-2">
                    <span className="text-sm font-bold text-forest/70">Avg. Response Time</span>
                    <span className="font-display font-bold text-lg text-yellow-600 leading-none">{auth.avgResolutionDays} days</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMLA(auth)}
                  className="w-full bg-forest text-gold hover:bg-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors shadow-sm relative z-10"
                >
                  📧 Email Authority
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Priority Report */}
        <section className="bg-strong/5 rounded-3xl p-6 md:p-10 border border-forest/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📰</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-forest">Priority Response Hub</h2>
            </div>
            <p className="text-forest/70 font-medium border-l-[3px] border-forest pl-4 py-1 ml-1 max-w-2xl">
              The oldest, most upvoted civic issues pending resolution. This data is fully public and transparent to drive government accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 z-10 relative">
            <div className="space-y-4">
              {sampleReports.filter(r => r.status === 'open').sort((a,b) => b.daysOpen - a.daysOpen).slice(0, 3).map((report, idx) => (
                <div key={report.id} className="bg-white p-5 rounded-2xl border-4 border-black shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-lg leading-tight">{report.title}</h4>
                    <span className="shrink-0 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md border border-red-200">
                      Top #{idx + 1}
                    </span>
                  </div>
                  
                  <p className="text-sm text-forest/80 line-clamp-2">{report.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-strong/10 p-2.5 rounded-lg mt-1">
                    <div className="flex flex-col gap-1"><span className="text-forest/60 uppercase text-[9px] tracking-wider">Location</span> Ward {report.ward} · {report.area}</div>
                    <div className="flex flex-col gap-1"><span className="text-forest/60 uppercase text-[9px] tracking-wider">MLA</span> {report.mla} ({report.party})</div>
                    <div className="flex flex-col gap-1"><span className="text-forest/60 uppercase text-[9px] tracking-wider">Pending For</span> <span className="text-red-600">{report.daysOpen} days</span></div>
                    <div className="flex flex-col gap-1"><span className="text-forest/60 uppercase text-[9px] tracking-wider">Citizen Upvotes</span> <span className="text-forest flex items-center gap-1">🔥 {report.upvotes}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col border border-forest/10">
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-6">📊</div>
               <h3 className="font-display font-bold text-2xl mb-4">Export transparency report.</h3>
               <p className="text-forest/80 mb-8">Civic problem data is public. Share these priority issues with communities and media organizations.</p>

               <div className="space-y-3 mt-auto">
                 <button className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-600 transition-colors shadow">
                   Share to WhatsApp Networks
                 </button>
                 <button className="w-full bg-black text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black/90 transition-colors shadow">
                   Escalate on 𝕏 / Twitter
                 </button>
                 <button className="w-full bg-transparent border-2 border-forest text-forest py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-forest hover:text-white transition-colors">
                   📄 Download PDF Report
                 </button>
               </div>
            </div>
          </div>
        </section>

      </div>

      {/* Citizen Audit Modal */}
      {selectedMLA && (() => {
        const mla = selectedMLA;
        // Check if it's an authority (BBMP/BWSSB/BESCOM) or an MLA
        const isAuthority = !!mla.email;
        const emailSubject = isAuthority
          ? `[Citizen Escalation] Open Civic Complaints — ${mla.name} Zone`
          : `[Citizen Pressure] Civic Issues Unresolved in ${mla.constituency} AC ${mla.constNo}`;
        const emailTo = isAuthority ? mla.email : `mla-${mla.constituency.toLowerCase().replace(/\s/g,'')}-karnataka@kla.kar.nic.in`;
        const emailBody = isAuthority
          ? `Dear Commissioner,\n\nThis is a formal citizen escalation regarding unresolved civic issues in your jurisdiction.\n\nPlease review the public audit at https://brokenbanglore.in/accountability\n\nWe request an update within 7 working days.\n\nRegards,\nA Bengaluru Citizen`
          : `Dear ${mla.mla} (MLA, ${mla.constituency}),\n\nAs a citizen of ${mla.constituency} constituency, I am formally requesting your attention to unresolved civic issues in our area.\n\nPublic Audit Report: https://brokenbanglore.in/accountability\n\nWe request acknowledgement and an action plan within 7 working days.\n\nRegards,\nA Bengaluru Citizen`;
        const tweetText = isAuthority
          ? `${mla.name} has ${mla.openTickets} unresolved civic complaints. Citizens of Bengaluru demand accountability. Review the public audit → https://brokenbanglore.in/accountability #BrokenBanglore #FixBengaluru`
          : `${mla.mla} (MLA, ${mla.constituency}) has resolved 0 out of 0 civic complaints filed. The citizens of ${mla.constituency} deserve better. Public audit → https://brokenbanglore.in/accountability @NammaKarnataka #BrokenBanglore`;

        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setSelectedMLA(null)}>
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-display font-bold text-2xl text-[#1a3a2a]">
                    {isAuthority ? mla.name : mla.mla}
                  </h2>
                  <p className="text-[#1a3a2a]/50 font-semibold text-sm">
                    {isAuthority ? mla.fullName : `${mla.party} · AC ${mla.constNo} · ${mla.constituency}`}
                  </p>
                </div>
                <button onClick={() => setSelectedMLA(null)} className="w-8 h-8 rounded-full bg-ash/20 flex items-center justify-center font-bold text-[#1a3a2a]/40 hover:text-red-500">✕</button>
              </div>

              {!isAuthority && (
                <div className="flex items-center gap-3 mb-5">
                  <img
                    src={mla.photo}
                    alt={mla.mla}
                    className="w-16 h-16 rounded-full object-cover border-2 bg-ash/20"
                    style={{borderColor: mla.partyColor}}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mla.mla)}&background=${mla.partyColor.replace('#','')}&color=fff`; }}
                  />
                  <div>
                    {mla.mp && <div className="text-xs text-[#1a3a2a]/50 font-bold">MP (2024): <span className="text-[#1a3a2a]">{mla.mp} · {mla.mpConstituency}</span></div>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: mla.partyColor}}></div>
                      <span className="font-bold text-sm text-[#1a3a2a]">{mla.party}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                  <div className="font-display font-bold text-2xl text-red-600">{mla.totalReports || 0}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-700/60">Reports</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <div className="font-display font-bold text-2xl text-green-600">{mla.resolvedReports || mla.openTickets && (0) || 0}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-green-700/60">Resolved</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                  <div className="font-display font-bold text-2xl text-amber-600">0%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700/60">Rate</div>
                </div>
              </div>

              {/* Burn notice */}
              <div className="bg-[#1a3a2a] text-white rounded-2xl p-4 mb-5">
                <p className="text-sm font-bold mb-1">📣 How to pressure them:</p>
                <p className="text-white/70 text-xs font-medium">Use the buttons below to send a formal complaint. Each action creates a public, permanent record. Combined, they are very hard to ignore.</p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
                <a
                  href={`mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 bg-forest/5 hover:bg-forest border border-forest/20 rounded-xl p-3.5 transition-all no-underline"
                  style={{textDecoration: 'none'}}
                >
                  <span className="text-xl">📧</span>
                  <div>
                    <div className="font-bold text-[#1a3a2a] text-sm">{isAuthority ? 'Email Authority Directly' : 'Email MLA Office'}</div>
                    <div className="text-xs text-[#1a3a2a]/50">{isAuthority ? mla.email : 'Opens your mail app with pre-filled complaint'}</div>
                  </div>
                  <span className="ml-auto text-[#1a3a2a]/30 text-sm">↗</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 bg-black/5 hover:bg-black border border-black/10 rounded-xl p-3.5 transition-all no-underline"
                  style={{textDecoration: 'none'}}
                >
                  <span className="text-xl font-bold text-[#1a3a2a]">𝕏</span>
                  <div>
                    <div className="font-bold text-[#1a3a2a] text-sm">Tweet — Public Accountability</div>
                    <div className="text-xs text-[#1a3a2a]/50">Pre-drafted. Tags @NammaKarnataka + @BBMPgov</div>
                  </div>
                  <span className="ml-auto text-[#1a3a2a]/30 text-sm">↗</span>
                </a>
                <a
                  href="https://janaspandana.karnataka.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-xl p-3.5 transition-all no-underline"
                  style={{textDecoration: 'none'}}
                >
                  <span className="text-xl">🏛️</span>
                  <div>
                    <div className="font-bold text-[#1a3a2a] text-sm">File on Jana Spandana</div>
                    <div className="text-xs text-[#1a3a2a]/50">Official Karnataka govt portal. Legally enforceable.</div>
                  </div>
                  <span className="ml-auto text-blue-400 text-sm">↗</span>
                </a>
                <a
                  href="https://rti.india.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 bg-amber-50 hover:bg-amber-500 border border-amber-200 rounded-xl p-3.5 transition-all no-underline"
                  style={{textDecoration: 'none'}}
                >
                  <span className="text-xl">⚖️</span>
                  <div>
                    <div className="font-bold text-[#1a3a2a] text-sm">File RTI Application</div>
                    <div className="text-xs text-[#1a3a2a]/50">Legally binding if no response in 15 days.</div>
                  </div>
                  <span className="ml-auto text-amber-400 text-sm">↗</span>
                </a>

                {/* WhatsApp — direct message to BBMP control room */}
                <a
                  href={`https://wa.me/918022221188?text=${encodeURIComponent(`Hello, I am filing a formal civic complaint. ${isAuthority ? `Authority: ${mla.name}` : `MLA: ${mla.mla}, ${mla.constituency}`}. Issue: Unresolved complaints in our area. Reference: BrokenBanglore platform. Please acknowledge within 7 days.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/30 rounded-xl p-3.5 transition-all no-underline"
                  style={{textDecoration: 'none'}}
                >
                  <span className="text-xl">📲</span>
                  <div>
                    <div className="font-bold text-[#1a3a2a] text-sm">WhatsApp BBMP Control Room</div>
                    <div className="text-xs text-[#1a3a2a]/50">080-2222-1188 · Pre-drafted formal message</div>
                  </div>
                  <span className="ml-auto text-[#25D366] text-sm">↗</span>
                </a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
