import { store } from '../server/in-memory-store';
import { generateFIR } from './seed.js';

const TOTAL = 100000;
const BATCH_SIZE = 1000;

async function main() {
  console.log(`🌱 Seeding ${TOTAL.toLocaleString()} synthetic crime records...`);
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-06-30');
  let batch: any[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const record = generateFIR(startDate, endDate);
    batch.push(record);

    if (batch.length >= BATCH_SIZE || i === TOTAL - 1) {
      store.addCrimesBatch(batch);
      const pct = ((i + 1) / TOTAL * 100).toFixed(1);
      console.log(`  ${pct}% (${(i + 1).toLocaleString()}/${TOTAL.toLocaleString()})`);
      batch = [];
    }
  }

  const stats = store.getCrimeStats();
  console.log(`\n✅ Seeded ${stats.total.toLocaleString()} crime records`);
  console.log('\n📊 Category Distribution:');
  stats.byCategory
    .sort((a, b) => b.count - a.count)
    .forEach(c => console.log(`  ${c.category}: ${c.count.toLocaleString()}`));
}

main().catch(console.error);
