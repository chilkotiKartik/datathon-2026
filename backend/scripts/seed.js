// 100K Synthetic Crime Record Generator for SAHASRA KSP
// Realistic Bengaluru crime patterns based on NCRB data

const CATEGORIES = {
  chain_snatching: { weight: 0.18, severity: 'grave', slots: ['EVENING_16-20', 'NIGHT_20-0'] },
  vehicle_theft: { weight: 0.12, severity: 'grave', slots: ['LATE_NIGHT_0-4', 'NIGHT_20-0'] },
  theft: { weight: 0.20, severity: 'petty', slots: ['MORNING_8-12', 'AFTERNOON_12-16', 'NIGHT_20-0'] },
  burglary: { weight: 0.08, severity: 'grave', slots: ['LATE_NIGHT_0-4', 'AFTERNOON_12-16'] },
  assault: { weight: 0.10, severity: 'grave', slots: ['EVENING_16-20', 'NIGHT_20-0'] },
  murder: { weight: 0.02, severity: 'heinous', slots: ['NIGHT_20-0', 'LATE_NIGHT_0-4'] },
  robbery: { weight: 0.06, severity: 'heinous', slots: ['NIGHT_20-0', 'EVENING_16-20'] },
  kidnapping: { weight: 0.03, severity: 'heinous', slots: ['MORNING_8-12', 'AFTERNOON_12-16'] },
  cyber_crime: { weight: 0.07, severity: 'grave', slots: ['MORNING_8-12', 'AFTERNOON_12-16', 'EVENING_16-20'] },
  fraud: { weight: 0.05, severity: 'grave', slots: ['MORNING_8-12', 'AFTERNOON_12-16'] },
  drug_offense: { weight: 0.03, severity: 'grave', slots: ['NIGHT_20-0', 'LATE_NIGHT_0-4'] },
  rioting: { weight: 0.02, severity: 'grave', slots: ['EVENING_16-20', 'AFTERNOON_12-16'] },
  domestic_violence: { weight: 0.02, severity: 'grave', slots: ['EVENING_16-20', 'NIGHT_20-0'] },
  sexual_harassment: { weight: 0.02, severity: 'heinous', slots: ['EVENING_16-20', 'MORNING_8-12'] },
};

const LOCATIONS = [
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245, weight: 0.12 },
  { name: 'MG Road', lat: 12.9719, lng: 77.5937, weight: 0.10 },
  { name: 'Commercial Street', lat: 12.9833, lng: 77.6069, weight: 0.08 },
  { name: 'Jayanagar', lat: 12.9250, lng: 77.5938, weight: 0.08 },
  { name: 'Indiranagar', lat: 12.9783, lng: 77.6400, weight: 0.07 },
  { name: 'Brigade Road', lat: 12.9700, lng: 77.6100, weight: 0.06 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500, weight: 0.06 },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6389, weight: 0.05 },
  { name: 'Yeshwanthpur', lat: 12.9815, lng: 77.5399, weight: 0.05 },
  { name: 'Peenya', lat: 13.0267, lng: 77.5100, weight: 0.04 },
  { name: 'Electronic City', lat: 12.8399, lng: 77.6770, weight: 0.04 },
  { name: 'KR Puram', lat: 12.9980, lng: 77.7000, weight: 0.04 },
  { name: 'Hebbal', lat: 13.0358, lng: 77.5970, weight: 0.03 },
  { name: 'RT Nagar', lat: 13.0267, lng: 77.5950, weight: 0.03 },
  { name: 'Banashankari', lat: 12.9200, lng: 77.5469, weight: 0.03 },
  { name: 'Vijayanagar', lat: 12.9719, lng: 77.5300, weight: 0.03 },
  { name: 'Malleshwaram', lat: 12.9999, lng: 77.5700, weight: 0.03 },
  { name: 'Basavanagudi', lat: 12.9422, lng: 77.5700, weight: 0.02 },
  { name: 'Rajajinagar', lat: 12.9900, lng: 77.5500, weight: 0.02 },
  { name: 'BTM Layout', lat: 12.9166, lng: 77.6100, weight: 0.02 },
];

const MODUS_OPERANDI = {
  chain_snatching: ['Snatched from pedestrian on footpath', 'Snatched from woman on two-wheeler', 'Snatched at traffic signal', 'Snatched near market area'],
  vehicle_theft: ['Parked vehicle broken into', 'Bike stolen from parking lot', 'Car stolen using duplicate key', 'Two-wheeler stolen from residential area'],
  theft: ['Pickpocketing in crowded bus', 'Wallet stolen at market', 'Mobile phone stolen from pocket', 'Bag stolen from auto-rickshaw'],
  burglary: ['House lock broken during daytime', 'Shop shutter cut at night', 'Office burglary after hours', 'Hotel room theft'],
  assault: ['Road rage assault', 'Assault during dispute', 'Assault near bar', 'Assault in public transport'],
  murder: ['Stabbing during dispute', 'Murder for revenge', 'Murder during robbery attempt', 'Domestic dispute murder'],
  robbery: ['Armed robbery at shop', 'Carjacking at gunpoint', 'Bank customer robbery', 'ATM robbery'],
  kidnapping: ['Child abduction near school', 'Kidnapping for ransom', 'Woman kidnapped from bus stop', 'Teenager missing since evening'],
  cyber_crime: ['Online banking fraud', 'Credit card cloning', 'Social media impersonation', 'Phishing email scam'],
  fraud: ['Job fraud with fake offer letter', 'Property document forgery', 'Insurance claim fraud', 'Loan scam'],
  drug_offense: ['Pedestrian caught with marijuana', 'Rave party drug raid', 'Drug supply bust at pub', 'Inter-state drug smuggling'],
  rioting: ['Group clash over parking', 'Political protest violence', 'Communal tension escalation', 'Alcohol-fueled street brawl'],
  domestic_violence: ['Husband assaulting wife', 'Dowry harassment', 'Elder abuse by family', 'Spousal verbal abuse'],
  sexual_harassment: ['Eve-teasing on bus', 'Stalking near college', 'Harassment at workplace', 'Comments on street'],
};

const DAY_WEIGHTS = [1.8, 0.6, 0.5, 0.5, 0.6, 1.4, 1.9]; // Sun=high, Sat=high
const OFFICERS = ['SI Ramesh', 'SI Priya', 'SI Kumar', 'SI Anita', 'SI Vishnu', 'SI Suresh', 'SI Lakshmi', 'SI Venkatesh'];
const STATUSES = ['under_investigation', 'under_investigation', 'under_investigation', 'solved', 'solved', 'closed'];

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function generateTimeInSlot(slot, date) {
  const hourMap = {
    'MORNING_8-12': [8, 12],
    'AFTERNOON_12-16': [12, 16],
    'EVENING_16-20': [16, 20],
    'NIGHT_20-0': [20, 24],
    'LATE_NIGHT_0-4': [0, 4],
  };
  const [start, end] = hourMap[slot] || [8, 20];
  const h = Math.floor(randBetween(start, end));
  const m = Math.floor(Math.random() * 60);
  const s = Math.floor(Math.random() * 60);
  date.setHours(h, m, s, 0);
  return date;
}

function generateFIR(startDate, endDate) {
  const catKeys = Object.keys(CATEGORIES);
  const catWeights = catKeys.map(k => ({ key: k, weight: CATEGORIES[k].weight }));
  const chosen = pickWeighted(catWeights.map(w => ({ name: w.key, weight: w.weight })));
  const category = chosen.name;
  const pattern = CATEGORIES[category];

  const location = pickWeighted(LOCATIONS);
  const timeSlot = pattern.slots[Math.floor(Math.random() * pattern.slots.length)];
  const dow = Math.floor(Math.random() * 7);
  const skipDays = Math.floor(randBetween(0, (endDate - startDate) / 86400000));
  const occurredAt = new Date(startDate.getTime() + skipDays * 86400000);
  occurredAt.setDate(occurredAt.getDate() + (dow - occurredAt.getDay() + 7) % 7);
  generateTimeInSlot(timeSlot, occurredAt);

  const lat = location.lat + randBetween(-0.008, 0.008);
  const lng = location.lng + randBetween(-0.008, 0.008);
  const mos = MODUS_OPERANDI[category] || ['Reported incident'];
  const mo = mos[Math.floor(Math.random() * mos.length)];
  const responseMin = Math.floor(randBetween(3, 45));
  const reportedAt = new Date(occurredAt.getTime() + Math.floor(randBetween(1, 120)) * 60000);

  const firNum = `KSP-${occurredAt.getFullYear()}-CR-${String(10000 + Math.floor(Math.random() * 89999))}`;
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const severity = pattern.severity;
  const victimCount = category === 'murder' ? 1 : Math.floor(randBetween(1, 3));
  const suspectCount = Math.floor(randBetween(0, 3));
  const arrestedCount = status === 'solved' ? Math.min(suspectCount, Math.floor(randBetween(1, suspectCount + 1))) : 0;
  const officer = OFFICERS[Math.floor(Math.random() * OFFICERS.length)];

  return {
    firNumber: firNum,
    category,
    subcategory: '',
    description: `${mo} in ${location.name}, ${category.replace(/_/g, ' ')} reported at ${occurredAt.toLocaleTimeString('en-IN')}`,
    latitude: parseFloat(lat.toFixed(7)),
    longitude: parseFloat(lng.toFixed(7)),
    beat: location.name,
    jurisdiction: 'Bengaluru Urban',
    district: 'Bengaluru Urban',
    ward: location.name,
    occurredAt: occurredAt.toISOString(),
    reportedAt: reportedAt.toISOString(),
    dayOfWeek: occurredAt.getDay(),
    timeSlot,
    status,
    severity,
    modusOperandi: mo,
    propertyLost: ['theft', 'vehicle_theft', 'burglary', 'robbery', 'fraud'].includes(category)
      ? parseFloat(randBetween(1000, 500000).toFixed(2)) : 0,
    victimCount,
    suspectCount,
    arrestedCount,
    investigatingOfficer: officer,
    ioiPhone: `98${String(70000000 + Math.floor(Math.random() * 29999999)).slice(0, 8)}`,
    evidenceCount: Math.floor(randBetween(0, 5)),
    cctvAvailable: Math.random() > 0.6,
    forensicsRequired: category === 'murder' || category === 'assault' || category === 'rape',
    isRepeatLocation: Math.random() > 0.85,
    isRepeatOffender: Math.random() > 0.9,
    responseTimeMinutes: responseMin,
    aiRiskScore: parseFloat(randBetween(5, 98).toFixed(2)),
  };
}

function runSeed(totalRecords = 100000) {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-06-30');
  const batchSize = 1000;
  const records = [];

  console.log(`Generating ${totalRecords} synthetic crime records...`);
  console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  for (let i = 0; i < totalRecords; i++) {
    records.push(generateFIR(startDate, endDate));

    if (records.length >= batchSize || i === totalRecords - 1) {
      const progress = ((i + 1) / totalRecords * 100).toFixed(1);
      console.log(`Progress: ${progress}% (${i + 1}/${totalRecords} records)`);

      if (typeof window === 'undefined' && typeof process !== 'undefined') {
        // Write to stdout in Node.js environment
        if (i === totalRecords - 1) {
          console.log(`\n✅ Generated ${totalRecords} crime records`);
          console.log(`Sample record:`);
          console.log(JSON.stringify(records[0], null, 2));
        }
      }
    }
  }

  // Summary
  const catCounts = {};
  records.forEach(r => {
    catCounts[r.category] = (catCounts[r.category] || 0) + 1;
  });
  console.log('\n📊 Category Distribution:');
  Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} (${(count / totalRecords * 100).toFixed(1)}%)`);
    });

  return records;
}

// If running directly
if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 100000;
  const result = runSeed(count);
  // Output first and last records
  console.log('\n📄 First record:', JSON.stringify(result[0], null, 2));
  process.exit(0);
}

module.exports = { generateFIR, runSeed, CATEGORIES, LOCATIONS };
