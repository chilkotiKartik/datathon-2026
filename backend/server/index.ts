import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { registerRoutes } from './routes';
import { store } from './in-memory-store';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  const start = Date.now();
  const origJson = _res.json.bind(_res);
  _res.json = (body: any) => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${_res.statusCode} ${Date.now() - start}ms`);
    }
    return origJson(body);
  };
  next();
});

store.seedInitialData();

const server = createServer(app);
registerRoutes(app, server);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SAHASRA KSP API', version: '1.0.0', crimeCount: store.getCrimes().length, timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'SAHASRA KSP Crime Intelligence Platform',
    version: '1.0.0',
    crimeCount: store.getCrimes().length,
    status: 'running',
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SAHASRA KSP API running on http://0.0.0.0:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

function seedDataSync() {
  const count = store.getCrimes().length;
  if (count > 0) return;
  
  const { generateFIR } = require('../scripts/seed.js');
  const now = new Date();
  const TOTAL = 1000;
  const batch: any[] = [];
  
  console.log(`Seeding ${TOTAL} crime records...`);
  for (let i = 0; i < TOTAL; i++) {
    const isRecent = i < 300;
    const rec = isRecent
      ? generateFIR(new Date(now.getTime() - 72 * 3600000), now)
      : generateFIR(new Date('2024-01-01'), new Date('2026-06-30'));
    if (isRecent) rec.status = 'under_investigation';
    batch.push(rec);
  }
  store.addCrimesBatch(batch);

  const suspectNames = ['Raj Kumar', 'Suresh Reddy', 'Mohan Lal', 'Venkatesh Gowda', 'Ravi Shankar',
    'Anil Kumble', 'Siddharth M', 'Vijay Patil', 'Arun Prasad', 'Naveen Singh',
    'Gopal Iyer', 'Karthik S', 'Mahesh Babu', 'Satish Kumar', 'Pradeep Hegde',
    'Harsha V', 'Bhaskar Rao', 'Chandru M', 'Jagadish T', 'Vishwanath K'];
  const suspectIds = suspectNames.map((name, i) =>
    store.addSuspect({
      name, gender: 'Male',
      riskLevel: i % 5 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low' as any,
      priorArrests: Math.floor(Math.random() * 10),
      criminalHistory: Math.random() > 0.5,
      phone: `98${String(70000000 + Math.floor(Math.random() * 29999999)).slice(0, 8)}`,
      address: 'Bengaluru',
    }).ROWID
  );

  const recentCrimes = store.getCrimes({ from: new Date(Date.now() - 7 * 86400000).toISOString() });
  const linkRoles = ['primary', 'primary', 'accomplice', 'accomplice', 'associate'];
  for (let i = 0; i < Math.min(recentCrimes.length, 200); i++) {
    store.addCrimeSuspectLink(recentCrimes[i].ROWID, suspectIds[i % suspectIds.length], linkRoles[i % linkRoles.length]);
  }

  const st = store.getCrimeStats();
  const topCats = st.byCategory.slice(0, 5).map((c: any) => `${c.category}=${c.count}`).join(', ');
  console.log(`✅ Seeded ${store.getCrimes().length} crimes | Suspects: ${suspectNames.length} | Links: ${Math.min(recentCrimes.length, 200)} | Top: ${topCats}`);
}

// Run synchronously on startup
seedDataSync();
