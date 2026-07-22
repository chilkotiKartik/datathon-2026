import { store } from '../server/in-memory-store';
import type { Anomaly, CrimeIncident } from '../server/crime-models';

export class AnomalyDetector {
  detect(district: string): Anomaly[] {
    const crimes = store.getCrimes({ district });
    const anomalies: Anomaly[] = [];
    const today = new Date().toISOString().split('T')[0];

    const categories = [...new Set(crimes.map(c => c.category))];
    for (const cat of categories) {
      const catCrimes = crimes.filter(c => c.category === cat);
      const recent = catCrimes.filter(c => {
        const d = new Date(c.occurredAt);
        return Date.now() - d.getTime() < 7 * 86400000;
      });
      const older = catCrimes.filter(c => {
        const d = new Date(c.occurredAt);
        const diff = Date.now() - d.getTime();
        return diff > 7 * 86400000 && diff < 30 * 86400000;
      });

      if (older.length > 0) {
        const change = ((recent.length - older.length / 3) / (older.length / 3)) * 100;
        if (Math.abs(change) > 50) {
          anomalies.push({
            type: change > 0 ? 'spike' : 'drop',
            category: cat,
            district,
            changePercent: Math.round(change),
            description: change > 0
              ? `${cat} in ${district} up ${Math.round(change)}% vs monthly average`
              : `${cat} in ${district} down ${Math.abs(Math.round(change))}% (intervention effective)`,
            severity: Math.abs(change) > 150 ? 'critical' : Math.abs(change) > 80 ? 'warning' : 'info',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    const beats = [...new Set(crimes.map(c => c.beat))];
    for (const beat of beats) {
      const beatCrimes = crimes.filter(c => c.beat === beat);
      const recent = beatCrimes.filter(c => {
        const d = new Date(c.occurredAt);
        return Date.now() - d.getTime() < 7 * 86400000;
      });
      const older = beatCrimes.filter(c => {
        const d = new Date(c.occurredAt);
        const diff = Date.now() - d.getTime();
        return diff > 7 * 86400000 && diff < 30 * 86400000;
      });

      if (older.length > 0 && recent.length > older.length / 3 * 2) {
        const change = ((recent.length - older.length / 3) / (older.length / 3)) * 100;
        if (change > 100) {
          const catCounts: Record<string, number> = {};
          recent.forEach(c => catCounts[c.category] = (catCounts[c.category] || 0) + 1);
          const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
          anomalies.push({
            type: 'spike',
            category: topCat?.[0] || 'unknown',
            district,
            beat,
            changePercent: Math.round(change),
            description: `Crime surge in ${beat}: ${topCat?.[0] || 'unknown'} incidents up ${Math.round(change)}%`,
            severity: 'warning',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    store.setAnomalies(anomalies);
    return anomalies.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return (order[a.severity] || 0) - (order[b.severity] || 0);
    });
  }
}
