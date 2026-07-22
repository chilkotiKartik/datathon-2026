import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import type {
  CrimeIncident, Suspect, CrimeSuspectLink, PoliceStation, PatrolVan,
  SOSAlert, RiskZone, CrimeTrend, CrimeFilter, CrimeStats, Hotspot,
  Prediction, Anomaly, GraphData, GraphNode, GraphLink
} from './crime-models';

export const sseEmitter = new EventEmitter();
sseEmitter.setMaxListeners(200);

const crimes: CrimeIncident[] = [];
const suspects: Suspect[] = [];
const crimeSuspectLinks: CrimeSuspectLink[] = [];
const policeStations: PoliceStation[] = [];
const patrolVans: PatrolVan[] = [];
const sosAlerts: SOSAlert[] = [];
const riskZones: RiskZone[] = [];
const crimeTrends: CrimeTrend[] = [];

let nextId = 1;
function nextRowId(): number { return nextId++; }

class InMemoryStore {
  private _predictions: Prediction[] = [];
  private _anomalies: Anomaly[] = [];

  getCrimes(filter?: CrimeFilter): CrimeIncident[] {
    let result = [...crimes];
    if (filter) {
      if (filter.district) result = result.filter(c => c.district === filter.district);
      if (filter.category) result = result.filter(c => c.category === filter.category);
      if (filter.status) result = result.filter(c => c.status === filter.status);
      if (filter.severity) result = result.filter(c => c.severity === filter.severity);
      if (filter.beat) result = result.filter(c => c.beat === filter.beat);
      if (filter.from) { const from = filter.from; result = result.filter(c => new Date(c.occurredAt) >= new Date(from)); }
      if (filter.to) { const to = filter.to; result = result.filter(c => new Date(c.occurredAt) <= new Date(to)); }
    }
    result.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    const limit = filter?.limit || 1000;
    const offset = filter?.offset || 0;
    return result.slice(offset, offset + limit);
  }

  getCrimeById(id: number): CrimeIncident | undefined {
    return crimes.find(c => c.ROWID === id);
  }

  getCrimeByFIR(fir: string): CrimeIncident | undefined {
    return crimes.find(c => c.firNumber === fir);
  }

  addCrime(data: Omit<CrimeIncident, 'ROWID' | 'createdAt' | 'updatedAt'>): CrimeIncident {
    const crime: CrimeIncident = {
      ROWID: nextRowId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    crimes.push(crime);
    sseEmitter.emit('crime:new', crime);
    return crime;
  }

  addCrimesBatch(data: Omit<CrimeIncident, 'ROWID' | 'createdAt' | 'updatedAt'>[]): CrimeIncident[] {
    const now = new Date().toISOString();
    const batch = data.map(d => ({
      ROWID: nextRowId(),
      ...d,
      createdAt: now,
      updatedAt: now,
    }));
    crimes.push(...batch);
    return batch;
  }

  getCrimeStats(district?: string): CrimeStats {
    let filtered = district ? crimes.filter(c => c.district === district) : crimes;
    const today = new Date().toISOString().split('T')[0];
    const todayCrimes = filtered.filter(c => c.occurredAt.startsWith(today));
    const solved = filtered.filter(c => c.status === 'solved');
    const active = filtered.filter(c => c.status === 'under_investigation');

    const byCategory: Record<string, number> = {};
    const byTimeSlot: Record<string, number> = {};
    const byDistrict: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    filtered.forEach(c => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      byTimeSlot[c.timeSlot] = (byTimeSlot[c.timeSlot] || 0) + 1;
      byDistrict[c.district] = (byDistrict[c.district] || 0) + 1;
      bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
    });

    const avgResponse = filtered.length
      ? filtered.reduce((s, c) => s + c.responseTimeMinutes, 0) / filtered.length
      : 0;

    return {
      total: filtered.length,
      today: todayCrimes.length,
      activeCases: active.length,
      solvedCases: solved.length,
      clearanceRate: filtered.length ? (solved.length / filtered.length) * 100 : 0,
      avgResponseTime: avgResponse,
      byCategory: Object.entries(byCategory).map(([k, v]) => ({ category: k, count: v })),
      byTimeSlot: Object.entries(byTimeSlot).map(([k, v]) => ({ timeSlot: k, count: v })),
      byDistrict: Object.entries(byDistrict).map(([k, v]) => ({ district: k, count: v })),
      bySeverity: Object.entries(bySeverity).map(([k, v]) => ({ severity: k, count: v })),
    };
  }

  setHotspots(hotspots: Hotspot[]): void {
    riskZones.length = 0;
    hotspots.forEach(h => {
      riskZones.push({
        ROWID: nextRowId(),
        centerLat: h.centerLat,
        centerLng: h.centerLng,
        radius: h.radius,
        crimeCount: h.crimeCount,
        density: h.density,
        category: h.category,
        severity: h.severity,
        district: h.district,
        isActive: true,
        lastUpdated: new Date().toISOString(),
      });
    });
  }

  getHotspots(district?: string): RiskZone[] {
    return district ? riskZones.filter(r => r.district === district) : riskZones;
  }

  getSOSAlerts(status?: string): SOSAlert[] {
    let result = [...sosAlerts];
    if (status) result = result.filter(s => s.status === status);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addSOSAlert(data: Omit<SOSAlert, 'ROWID' | 'createdAt'>): SOSAlert {
    const alert: SOSAlert = {
      ROWID: nextRowId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    sosAlerts.push(alert);
    sseEmitter.emit('sos:new', alert);
    return alert;
  }

  updateSOSAlert(id: number, data: Partial<SOSAlert>): SOSAlert | undefined {
    const idx = sosAlerts.findIndex(s => s.ROWID === id);
    if (idx === -1) return undefined;
    sosAlerts[idx] = { ...sosAlerts[idx], ...data };
    return sosAlerts[idx];
  }

  getPatrolVans(district?: string): PatrolVan[] {
    return district ? patrolVans.filter(v => v.district === district) : patrolVans;
  }

  updatePatrolVan(id: number, data: Partial<PatrolVan>): PatrolVan | undefined {
    const idx = patrolVans.findIndex(v => v.ROWID === id);
    if (idx === -1) return undefined;
    patrolVans[idx] = { ...patrolVans[idx], ...data, lastUpdated: new Date().toISOString() };
    sseEmitter.emit('patrol:update', patrolVans[idx]);
    return patrolVans[idx];
  }

  getPoliceStations(district?: string): PoliceStation[] {
    return district ? policeStations.filter(p => p.district === district) : policeStations;
  }

  getSuspects(): Suspect[] { return [...suspects]; }

  getSuspect(id: number): Suspect | undefined { return suspects.find(s => s.ROWID === id); }

  addSuspect(data: Omit<Suspect, 'ROWID' | 'createdAt'>): Suspect {
    const sus: Suspect = { ROWID: nextRowId(), ...data, createdAt: new Date().toISOString() };
    suspects.push(sus);
    return sus;
  }

  addCrimeSuspectLink(crimeId: number, suspectId: number, role: string): CrimeSuspectLink {
    const link: CrimeSuspectLink = { ROWID: nextRowId(), crimeId, suspectId, role: role as any };
    crimeSuspectLinks.push(link);
    return link;
  }

  getLinksForCrime(crimeId: number): CrimeSuspectLink[] {
    return crimeSuspectLinks.filter(l => l.crimeId === crimeId);
  }

  getLinksForSuspect(suspectId: number): CrimeSuspectLink[] {
    return crimeSuspectLinks.filter(l => l.suspectId === suspectId);
  }

  buildGraphData(depth: number = 2): GraphData {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeSet = new Set<string>();

    for (const crime of crimes.slice(0, 100)) {
      const crimeId = `crime-${crime.ROWID}`;
      if (!nodeSet.has(crimeId)) {
        nodes.push({ id: crimeId, label: `FIR ${crime.firNumber}`, type: 'location', data: crime });
        nodeSet.add(crimeId);
      }

      const crimeLinks = crimeSuspectLinks.filter(l => l.crimeId === crime.ROWID);
      for (const link of crimeLinks) {
        const suspect = suspects.find(s => s.ROWID === link.suspectId);
        if (suspect) {
          const suspectId = `suspect-${suspect.ROWID}`;
          if (!nodeSet.has(suspectId)) {
            nodes.push({ id: suspectId, label: suspect.name, type: 'suspect', data: suspect });
            nodeSet.add(suspectId);
          }
          links.push({ source: crimeId, target: suspectId, label: link.role, weight: 1 });
        }
      }
    }

    return { nodes, links };
  }

  getCrimeTrends(district?: string, days: number = 90): CrimeTrend[] {
    let result = [...crimeTrends];
    if (district) result = result.filter(t => t.district === district);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return result.filter(t => new Date(t.date) >= cutoff);
  }

  addCrimeTrend(data: Omit<CrimeTrend, 'ROWID' | 'createdAt'>): CrimeTrend {
    const trend: CrimeTrend = { ROWID: nextRowId(), ...data, createdAt: new Date().toISOString() };
    crimeTrends.push(trend);
    return trend;
  }

  setPredictions(p: Prediction[]): void { this._predictions = p; }
  getPredictions(): Prediction[] { return this._predictions; }

  setAnomalies(a: Anomaly[]): void { this._anomalies = a; }
  getAnomalies(): Anomaly[] { return this._anomalies; }

  seedInitialData(): void {
    if (policeStations.length > 0) return;

    const stations: Omit<PoliceStation, 'ROWID'>[] = [
      { name: 'Koramangala Police Station', address: 'Koramangala, Bengaluru', phone: '080-25530100', latitude: 12.9352, longitude: 77.6245, district: 'Bengaluru Urban', jurisdiction: 'South Division', officerCount: 45 },
      { name: 'MG Road Police Station', address: 'MG Road, Bengaluru', phone: '080-25580100', latitude: 12.9719, longitude: 77.5937, district: 'Bengaluru Urban', jurisdiction: 'Central Division', officerCount: 38 },
      { name: 'Whitefield Police Station', address: 'Whitefield, Bengaluru', phone: '080-28451100', latitude: 12.9698, longitude: 77.7500, district: 'Bengaluru Urban', jurisdiction: 'East Division', officerCount: 42 },
      { name: 'Yeshwanthpur Police Station', address: 'Yeshwanthpur, Bengaluru', phone: '080-23371100', latitude: 12.9815, longitude: 77.5399, district: 'Bengaluru Urban', jurisdiction: 'West Division', officerCount: 35 },
      { name: 'Jayanagar Police Station', address: 'Jayanagar, Bengaluru', phone: '080-26631100', latitude: 12.9250, longitude: 77.5938, district: 'Bengaluru Urban', jurisdiction: 'South Division', officerCount: 40 },
      { name: 'Indiranagar Police Station', address: 'Indiranagar, Bengaluru', phone: '080-25201100', latitude: 12.9783, longitude: 77.6400, district: 'Bengaluru Urban', jurisdiction: 'East Division', officerCount: 36 },
      { name: 'Hebbal Police Station', address: 'Hebbal, Bengaluru', phone: '080-23601100', latitude: 13.0358, longitude: 77.5970, district: 'Bengaluru Urban', jurisdiction: 'North Division', officerCount: 32 },
      { name: 'Electronic City Police Station', address: 'Electronic City, Bengaluru', phone: '080-28521100', latitude: 12.8399, longitude: 77.6770, district: 'Bengaluru Urban', jurisdiction: 'Southeast Division', officerCount: 30 },
    ];
    stations.forEach(s => policeStations.push({ ROWID: nextRowId(), ...s }));

    const vans: Omit<PatrolVan, 'ROWID'>[] = [
      { vanNumber: 'PR-101', officerInCharge: 'SI Ramesh', officerPhone: '9876543210', district: 'Bengaluru Urban', zone: 'Koramangala', status: 'active_patrol', latitude: 12.9352, longitude: 77.6245, shift: 'night', isWomenSafetyUnit: false, crewCount: 3, lastUpdated: new Date().toISOString() },
      { vanNumber: 'PR-102', officerInCharge: 'SI Priya', officerPhone: '9876543211', district: 'Bengaluru Urban', zone: 'MG Road', status: 'active_patrol', latitude: 12.9719, longitude: 77.5937, shift: 'night', isWomenSafetyUnit: true, crewCount: 4, lastUpdated: new Date().toISOString() },
      { vanNumber: 'PR-103', officerInCharge: 'SI Kumar', officerPhone: '9876543212', district: 'Bengaluru Urban', zone: 'Whitefield', status: 'active_patrol', latitude: 12.9698, longitude: 77.7500, shift: 'day', isWomenSafetyUnit: false, crewCount: 3, lastUpdated: new Date().toISOString() },
      { vanNumber: 'PR-104', officerInCharge: 'SI Anita', officerPhone: '9876543213', district: 'Bengaluru Urban', zone: 'Yeshwanthpur', status: 'responding', latitude: 12.9815, longitude: 77.5399, shift: 'night', isWomenSafetyUnit: true, crewCount: 4, lastUpdated: new Date().toISOString() },
      { vanNumber: 'PR-105', officerInCharge: 'SI Vishnu', officerPhone: '9876543214', district: 'Bengaluru Urban', zone: 'Electronic City', status: 'active_patrol', latitude: 12.8399, longitude: 77.6770, shift: 'day', isWomenSafetyUnit: false, crewCount: 3, lastUpdated: new Date().toISOString() },
    ];
    vans.forEach(v => patrolVans.push({ ROWID: nextRowId(), ...v }));
  }
}

export const store = new InMemoryStore();

setInterval(() => {
  const vans = store.getPatrolVans();
  vans.forEach(v => {
    if (v.status === 'active_patrol') {
      const dlat = (Math.random() - 0.5) * 0.002;
      const dlng = (Math.random() - 0.5) * 0.002;
      store.updatePatrolVan(v.ROWID, {
        latitude: parseFloat((v.latitude + dlat).toFixed(6)),
        longitude: parseFloat((v.longitude + dlng).toFixed(6)),
      });
    }
  });
}, 8000);
