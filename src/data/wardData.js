// Ward + MLA + Authority Data for Bangalore
// MP Data: 2024 Lok Sabha Election Results (BJP won all 4 Bangalore seats)
// Bangalore North: Shobha Karandlaje (BJP)
// Bangalore Central: P. C. Mohan (BJP)
// Bangalore South: Tejasvi Surya (BJP)
// Bangalore Rural: C. N. Manjunath (BJP)

const getAvatar = (name, pColor) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${pColor.replace('#', '')}&color=fff&size=512&font-size=0.35&bold=true`;

// Accurate Ward Area Data (Sync'd with BBMP 243 ward boundaries)
export const accurateAreaNames = {
  1: { name: "Kempegowda", areas: ["Govindapura", "Kulappa Layout", "Yelahanka Airport Area"] },
  2: { name: "Chowdeswari", areas: ["Harohalli", "Naganahalli", "Puttanahalli"] },
  3: { name: "Atturu", areas: ["Ananthapura", "Atturu Village", "Doddaamaravathi"] },
  4: { name: "Yelahanka Satellite Town", areas: ["Yelahanka New Town", "Sahakaranagara"] },
  5: { name: "Chokkanahalli", areas: ["Jakkuru Village", "Hebbal Kempapura"] },
  28: { name: "Hebbal", areas: ["Hebbal", "Nagavara Lake"] },
  37: { name: "Yeshwanthpura", areas: ["Yeshwanthpura", "Jalahalli"] },
  101: { name: "Indiranagar", areas: ["Indiranagar", "HAL 2nd Stage", "Doopanahalli"] },
  142: { name: "Shivajinagar", areas: ["Shivajinagar", "Commercial Street"] },
  172: { name: "Koramangala", areas: ["Koramangala 1st Block", "Koramangala 8th Block"] },
  188: { name: "BTM Layout", areas: ["BTM 2nd Stage", "Madiwala", "Silk Board"] },
  190: { name: "HSR Layout", areas: ["HSR Layout Sector 1", "HSR Layout Sector 7"] },
  206: { name: "Whitefield", areas: ["Whitefield", "ITPL Road", "Hope Farm"] },
  213: { name: "Mahadevapura", areas: ["Phoenix Marketcity", "Outer Ring Road"] },
};

// Constituency → Parliamentary Constituency mapping (2024 Lok Sabha Results)
export const constituencyMPMap = {
  // Bangalore North (MP: Shobha Karandlaje, BJP)
  'Byatarayanapura': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Yeshvanthapura': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Yeshwanthpur': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Dasarahalli': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Mahalakshmi Layout': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Malleshwaram': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Hebbal': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Pulakeshinagar': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Krishnarajapuram': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },
  'Yelahanka': { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' },

  // Bangalore Central (MP: P. C. Mohan, BJP)
  'Sarvagnanagar': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'C. V. Raman Nagar': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'C V Raman Nagar': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'Shivajinagar': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'Shanti Nagar': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'Gandhi Nagar': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'Rajaji Nagar': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'Chamrajpet': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },
  'Mahadevapura': { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' },

  // Bangalore South (MP: Tejasvi Surya, BJP)
  'Govindraj Nagar': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'Vijayanagara': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'Chickpet': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'Basavanagudi': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'Padmanabhanagar': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'B.T.M. Layout': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'Jayanagar': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'Bommanahalli': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },
  'BTM Layout': { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' },

  // Bangalore Rural (MP: Dr. C. N. Manjunath, BJP)
  'Bangalore South': { mp: 'Dr. C. N. Manjunath', mpConstituency: 'Bangalore Rural', mpParty: 'BJP' },
  'Anekal': { mp: 'Dr. C. N. Manjunath', mpConstituency: 'Bangalore Rural', mpParty: 'BJP' },
  'Rajarajeshwarinagar': { mp: 'Dr. C. N. Manjunath', mpConstituency: 'Bangalore Rural', mpParty: 'BJP' },
  'Hoskote': { mp: 'Dr. C. N. Manjunath', mpConstituency: 'Bangalore Rural', mpParty: 'BJP' },
};

// Helper to get MP data by zone (as fallback)
export const getMPByZone = (zoneName) => {
  const zone = zoneName?.toLowerCase() || '';
  
  // 1. Bangalore North (Shobha Karandlaje)
  if (zone.includes('yelahanka') || zone.includes('north') || zone.includes('hebbal') || 
      zone.includes('byatarayanapura') || zone.includes('yeshwanthpur') || 
      zone.includes('malleshwaram') || zone.includes('dasarahalli') || zone.includes('mahalakshmi')) {
    return { mp: 'Shobha Karandlaje', mpConstituency: 'Bangalore North', mpParty: 'BJP' };
  }
  
  // 2. Bangalore South (Tejasvi Surya)
  if (zone.includes('south') || zone.includes('jayanagar') || zone.includes('basavanagudi') || 
      zone.includes('padmanabhanagar') || zone.includes('btm') || zone.includes('vijayanagar') || 
      zone.includes('govindraj') || zone.includes('chickpet') || zone.includes('bommanahalli')) {
    return { mp: 'Tejasvi Surya', mpConstituency: 'Bangalore South', mpParty: 'BJP' };
  }
  
  // 3. Bangalore Rural (Dr. C. N. Manjunath)
  if (zone.includes('rural') || zone.includes('anekal') || zone.includes('rr nagar') || 
      zone.includes('hoskote') || zone.includes('rajarajeshwari')) {
    return { mp: 'Dr. C. N. Manjunath', mpConstituency: 'Bangalore Rural', mpParty: 'BJP' };
  }
  
  // 4. Bangalore Central (P. C. Mohan) - Default
  // Covers: Shivajinagar, Shanti Nagar, Sarvagnanagar, CV Raman Nagar, Gandhi Nagar, Rajaji Nagar, Chamrajpet, Mahadevapura
  return { mp: 'P. C. Mohan', mpConstituency: 'Bangalore Central', mpParty: 'BJP' };
};

// Helper to get MP data by constituency name
export const getMPByConstituency = (constituency) => {
  return constituencyMPMap[constituency] || getMPByZone(constituency);
};

export const completeMLAList = [
  { constNo: 177, constituency: 'Anekal', mla: 'B Shivanna', party: 'INC', partyColor: '#2563eb', photo: getAvatar('B Shivanna', '#2563eb'), ...getMPByConstituency('Anekal'), totalReports: 0, resolvedReports: 0 },
  { constNo: 172, constituency: 'B.T.M. Layout', mla: 'Ramalinga Reddy', party: 'INC', partyColor: '#2563eb', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/R_Ramalinga_Reddy_BNC.jpg/330px-R_Ramalinga_Reddy_BNC.jpg', ...getMPByConstituency('B.T.M. Layout'), totalReports: 0, resolvedReports: 0 },
  { constNo: 176, constituency: 'Bangalore South', mla: 'M Krishnappa', party: 'BJP', partyColor: '#f97316', photo: getAvatar('M Krishnappa', '#f97316'), ...getMPByConstituency('Bangalore South'), totalReports: 0, resolvedReports: 0 },
  { constNo: 170, constituency: 'Basavanagudi', mla: 'Ravi Subramanya L A', party: 'BJP', partyColor: '#f97316', photo: getAvatar('Ravi Subramanya L A', '#f97316'), ...getMPByConstituency('Basavanagudi'), totalReports: 0, resolvedReports: 0 },
  { constNo: 175, constituency: 'Bommanahalli', mla: 'Satish Reddy M', party: 'BJP', partyColor: '#f97316', photo: getAvatar('Satish Reddy M', '#f97316'), ...getMPByConstituency('Bommanahalli'), totalReports: 0, resolvedReports: 0 },
  { constNo: 152, constituency: 'Byatarayanapura', mla: 'Krishna Byregowda', party: 'INC', partyColor: '#2563eb', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Krishna_Byre_Gowda_in_2018.jpg/330px-Krishna_Byre_Gowda_in_2018.jpg', ...getMPByConstituency('Byatarayanapura'), totalReports: 0, resolvedReports: 0 },
  { constNo: 161, constituency: 'C. V. Raman Nagar', mla: 'S Raghu', party: 'BJP', partyColor: '#f97316', photo: getAvatar('S Raghu', '#f97316'), ...getMPByConstituency('C. V. Raman Nagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 168, constituency: 'Chamrajpet', mla: 'B. Z. Zameer Ahmed Khan', party: 'INC', partyColor: '#2563eb', photo: getAvatar('Zameer Ahmed Khan', '#2563eb'), ...getMPByConstituency('Chamrajpet'), totalReports: 0, resolvedReports: 0 },
  { constNo: 169, constituency: 'Chickpet', mla: 'Uday B Garudachar', party: 'BJP', partyColor: '#f97316', photo: getAvatar('Uday B Garudachar', '#f97316'), ...getMPByConstituency('Chickpet'), totalReports: 0, resolvedReports: 0 },
  { constNo: 155, constituency: 'Dasarahalli', mla: 'S Muniraju', party: 'BJP', partyColor: '#f97316', photo: getAvatar('S Muniraju', '#f97316'), ...getMPByConstituency('Dasarahalli'), totalReports: 0, resolvedReports: 0 },
  { constNo: 164, constituency: 'Gandhi Nagar', mla: 'Dinesh Gundu Rao', party: 'INC', partyColor: '#2563eb', photo: getAvatar('Dinesh Gundu Rao', '#2563eb'), ...getMPByConstituency('Gandhi Nagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 166, constituency: 'Govindraj Nagar', mla: 'Priya Krishna', party: 'INC', partyColor: '#2563eb', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/%E0%B2%AA%E0%B3%8D%E0%B2%B0%E0%B2%BF%E0%B2%AF_%E0%B2%95%E0%B3%83%E0%B2%B7%E0%B3%8D%E0%B2%A3%E0%B2%A8.jpg/330px-%E0%B2%AA%E0%B3%8D%E0%B2%B0%E0%B2%BF%E0%B2%AF_%E0%B2%95%E0%B3%83%E0%B2%B7%E0%B3%8D%E0%B2%A3%E0%B2%A8.jpg', ...getMPByConstituency('Govindraj Nagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 158, constituency: 'Hebbal', mla: 'Byrathi Suresh', party: 'INC', partyColor: '#2563eb', photo: getAvatar('Byrathi Suresh', '#2563eb'), ...getMPByConstituency('Hebbal'), totalReports: 0, resolvedReports: 0 },
  { constNo: 178, constituency: 'Hoskote', mla: 'Sharath Kumar Bachegowda', party: 'INC', partyColor: '#2563eb', photo: getAvatar('Sharath Kumar Bachegowda', '#2563eb'), ...getMPByConstituency('Hoskote'), totalReports: 0, resolvedReports: 0 },
  { constNo: 173, constituency: 'Jayanagar', mla: 'C K Ramamurthy', party: 'BJP', partyColor: '#f97316', photo: getAvatar('C K Ramamurthy', '#f97316'), ...getMPByConstituency('Jayanagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 151, constituency: 'Krishnarajapuram', mla: 'B A Basavaraja', party: 'BJP', partyColor: '#f97316', photo: getAvatar('B A Basavaraja', '#f97316'), ...getMPByConstituency('Krishnarajapuram'), totalReports: 0, resolvedReports: 0 },
  { constNo: 174, constituency: 'Mahadevapura', mla: 'Manjula S', party: 'BJP', partyColor: '#f97316', photo: getAvatar('Manjula S', '#f97316'), ...getMPByConstituency('Mahadevapura'), totalReports: 0, resolvedReports: 0 },
  { constNo: 156, constituency: 'Mahalakshmi Layout', mla: 'K Gopalaiah', party: 'BJP', partyColor: '#f97316', photo: getAvatar('K Gopalaiah', '#f97316'), ...getMPByConstituency('Mahalakshmi Layout'), totalReports: 0, resolvedReports: 0 },
  { constNo: 157, constituency: 'Malleshwaram', mla: 'Dr C N Ashwathnarayan', party: 'BJP', partyColor: '#f97316', photo: getAvatar('Dr C N Ashwathnarayan', '#f97316'), ...getMPByConstituency('Malleshwaram'), totalReports: 0, resolvedReports: 0 },
  { constNo: 171, constituency: 'Padmanabhanagar', mla: 'R Ashoka', party: 'BJP', partyColor: '#f97316', photo: getAvatar('R Ashoka', '#f97316'), ...getMPByConstituency('Padmanabhanagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 159, constituency: 'Pulakeshinagar', mla: 'A. C. Srinivasa', party: 'INC', partyColor: '#2563eb', photo: getAvatar('A. C. Srinivasa', '#2563eb'), ...getMPByConstituency('Pulakeshinagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 165, constituency: 'Rajaji Nagar', mla: 'S Suresh Kumar', party: 'BJP', partyColor: '#f97316', photo: getAvatar('S Suresh Kumar', '#f97316'), ...getMPByConstituency('Rajaji Nagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 154, constituency: 'Rajarajeshwarinagar', mla: 'Munirathna', party: 'BJP', partyColor: '#f97316', photo: getAvatar('Munirathna', '#f97316'), ...getMPByConstituency('Rajarajeshwarinagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 160, constituency: 'Sarvagnanagar', mla: 'K J George', party: 'INC', partyColor: '#2563eb', photo: getAvatar('K J George', '#2563eb'), ...getMPByConstituency('Sarvagnanagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 163, constituency: 'Shanti Nagar', mla: 'N A Harris', party: 'INC', partyColor: '#2563eb', photo: getAvatar('N A Harris', '#2563eb'), ...getMPByConstituency('Shanti Nagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 162, constituency: 'Shivajinagar', mla: 'Rizwan Arshad', party: 'INC', partyColor: '#2563eb', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Rizwan_Arshad.png/330px-Rizwan_Arshad.png', ...getMPByConstituency('Shivajinagar'), totalReports: 0, resolvedReports: 0 },
  { constNo: 167, constituency: 'Vijayanagara', mla: 'M Krishnappa', party: 'INC', partyColor: '#2563eb', photo: getAvatar('M Krishnappa', '#2563eb'), ...getMPByConstituency('Vijayanagara'), totalReports: 0, resolvedReports: 0 },
  { constNo: 150, constituency: 'Yelahanka', mla: 'S R Vishwanath', party: 'BJP', partyColor: '#f97316', photo: getAvatar('S R Vishwanath', '#f97316'), ...getMPByConstituency('Yelahanka'), totalReports: 0, resolvedReports: 0 },
  { constNo: 153, constituency: 'Yeshvanthapura', mla: 'S T Somashekar', party: 'BJP', partyColor: '#f97316', photo: getAvatar('S T Somashekar', '#f97316'), ...getMPByConstituency('Yeshvanthapura'), totalReports: 0, resolvedReports: 0 },
];

export const wardMLAData = [
  {
    ward: 1, name: "Kempegowda", constituency: "Yelahanka",
    mla: "S R Vishwanath", party: "BJP", partyColor: "#f97316",
    mp: "Shobha Karandlaje", mpConstituency: "Bangalore North", mpParty: "BJP",
    authority: "BBMP Yelahanka Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 4, name: "Yelahanka Satellite Town", constituency: "Yelahanka",
    mla: "S R Vishwanath", party: "BJP", partyColor: "#f97316",
    mp: "Shobha Karandlaje", mpConstituency: "Bangalore North", mpParty: "BJP",
    authority: "BBMP Yelahanka Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 5, name: "Chokkanahalli", constituency: "Yelahanka",
    mla: "S R Vishwanath", party: "BJP", partyColor: "#f97316",
    mp: "Shobha Karandlaje", mpConstituency: "Bangalore North", mpParty: "BJP",
    authority: "BBMP Yelahanka Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 28, name: "Hebbal", constituency: "Hebbal",
    mla: "Byrathi Suresh", party: "INC", partyColor: "#2563eb",
    mp: "Shobha Karandlaje", mpConstituency: "Bangalore North", mpParty: "BJP",
    authority: "BBMP North Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 101, name: "Indiranagar", constituency: "C V Raman Nagar",
    mla: "S Raghu", party: "BJP", partyColor: "#f97316",
    mp: "P. C. Mohan", mpConstituency: "Bangalore Central", mpParty: "BJP",
    authority: "BBMP East Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 172, name: "Koramangala", constituency: "B.T.M. Layout",
    mla: "Ramalinga Reddy", party: "INC", partyColor: "#2563eb",
    mp: "Tejasvi Surya", mpConstituency: "Bangalore South", mpParty: "BJP",
    authority: "BBMP South Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 190, name: "HSR Layout", constituency: "Bommanahalli",
    mla: "Satish Reddy M", party: "BJP", partyColor: "#f97316",
    mp: "Tejasvi Surya", mpConstituency: "Bangalore South", mpParty: "BJP",
    authority: "BBMP South Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 207, name: "Whitefield (Hagadur)", constituency: "Mahadevapura",
    mla: "Manjula S", party: "BJP", partyColor: "#f97316",
    mp: "Shobha Karandlaje", mpConstituency: "Bangalore North", mpParty: "BJP",
    authority: "BBMP Mahadevapura Zone", totalReports: 0, resolvedReports: 0
  },
  {
    ward: 142, name: "Shivajinagar", constituency: "Shivajinagar",
    mla: "Rizwan Arshad", party: "INC", partyColor: "#2563eb",
    mp: "P. C. Mohan", mpConstituency: "Bangalore Central", mpParty: "BJP",
    authority: "BBMP East Zone", totalReports: 0, resolvedReports: 0
  }
];

// Authority data
export const authorityData = [
  {
    name: "BBMP", fullName: "Bruhat Bengaluru Mahanagara Palike", icon: "🏛️",
    email: "commissioner@bbmp.gov.in", openTickets: 0, avgResolutionDays: 0,
    lastResponseDate: "2025-04-17", categories: ["roads", "garbage", "traffic"],
  },
  {
    name: "BWSSB", fullName: "Bangalore Water Supply & Sewerage Board", icon: "💧",
    email: "chiefengineer@bwssb.gov.in", openTickets: 0, avgResolutionDays: 0,
    lastResponseDate: "2025-04-17", categories: ["water"],
  },
  {
    name: "BESCOM", fullName: "Bangalore Electricity Supply Company", icon: "⚡",
    email: "director@bescom.co.in", openTickets: 0, avgResolutionDays: 0,
    lastResponseDate: "2025-04-17", categories: ["power"],
  },
];

export const sampleReports = [];
export const samplePetitions = [];
export const sampleForumPosts = [];

export const categories = [
  { id: "roads", label: "Roads & Potholes", emoji: "🚧", color: "#2B9348" },
  { id: "water", label: "Water Supply", emoji: "💧", color: "#55A630" },
  { id: "garbage", label: "Garbage (Waste)", emoji: "🗑️", color: "#2B9348" },
  { id: "power", label: "Power Cuts", emoji: "⚡", color: "#E9C46A" },
  { id: "environment", label: "Lakes & Environment", emoji: "🌊", color: "#2B9348" },
  { id: "traffic", label: "Traffic & Roads", emoji: "🚦", color: "#55A630" },
];

export function getWardData(wardNo) {
  return wardMLAData.find((w) => w.ward === Number(wardNo)) || null;
}

export function getWardByArea(areaName) {
  if (!areaName) return null;
  const lowerArea = areaName.toLowerCase();
  
  // 1. Direct Ward Name match
  let found = wardMLAData.find((w) => w.name.toLowerCase() === lowerArea);
  if (found) return found;

  // 2. Assembly Constituency match (return any ward from that constituency)
  found = wardMLAData.find((w) => w.constituency.toLowerCase() === lowerArea);
  if (found) return found;

  // 3. Sub-string match
  found = wardMLAData.find((w) => w.name.toLowerCase().includes(lowerArea) || w.constituency.toLowerCase().includes(lowerArea));
  
  return found || null;
}

export function getResponseRateColor(total, resolved) {
  const rate = total > 0 ? (resolved / total) * 100 : 0;
  if (rate >= 50) return "#16a34a";
  if (rate >= 25) return "#E7E08B";
  return "#dc2626";
}

export function getResponseRateLabel(total, resolved) {
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  if (rate >= 50) return { text: `${rate}%`, emoji: "🟢", status: "Responsive" };
  if (rate >= 25) return { text: `${rate}%`, emoji: "🟡", status: "Slow" };
  return { text: `${rate}%`, emoji: "🔴", status: "Ignoring" };
}

// -- Live Stats via localStorage --
// These update globally across the site as users interact
export const STATS_KEY = 'bb_platform_stats';

export function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { reports: 0, petitions: 0, citizens: 0, resolved: 0 };
}

export function incrementStat(key) {
  const stats = getStats();
  stats[key] = (stats[key] || 0) + 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  window.dispatchEvent(new CustomEvent('bb-stats-update', { detail: stats }));
  return stats;
}

export function generateMLAWhatsApp(report, wardData) {
  const msg = `Dear ${wardData.mla} (MLA, ${wardData.constituency}),

I am reporting a ${report.category} problem in ${report.area} (Ward ${wardData.ward}):

"${report.title}"

${report.description}

This report is live on BrokenBengaluru. Please take immediate action.

📍 Location: ${report.area}, Ward ${wardData.ward}
🔗 View report: https://brokenbanglore.in/map

#BrokenBengaluru #Fix${report.category.charAt(0).toUpperCase() + report.category.slice(1)}`;

  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function generateShameTweet(mlaName, twitterHandle, constituency, resolveRate) {
  const msg = `.${twitterHandle} MLA of ${constituency} has resolved only ${resolveRate}% of citizen-reported problems. ${constituency} deserves better. 

Check the full accountability report → brokenbanglore.in/accountability

#BrokenBengaluru #FixBengaluru #${constituency.replace(/\s/g, "")}`;

  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`;
}
