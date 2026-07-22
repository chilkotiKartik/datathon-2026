import { store } from '../server/in-memory-store';
import type { CrimeIncident, Hotspot } from '../server/crime-models';

interface Point { lat: number; lng: number; id: number }
interface Cluster { points: Point[] }

export class HotspotDetector {
  detect(district: string, hours: number = 72): Hotspot[] {
    let crimes = store.getCrimes({ district, from: hoursAgo(hours), status: 'under_investigation' });
    if (crimes.length < 3) {
      crimes = store.getCrimes({ district, from: hoursAgo(hours * 10) });
    }
    if (crimes.length < 3) {
      crimes = store.getCrimes({ district }).slice(0, 1000);
    }
    if (crimes.length < 3) return [];

    const points: Point[] = crimes.map(c => ({ lat: c.latitude, lng: c.longitude, id: c.ROWID }));
    const clusters = this.dbscan(points, 0.005, 3);
    const meaningful = clusters.filter(c => c.points.length >= 3);

    const hotspots: Hotspot[] = meaningful.map(cluster => {
      const centroid = this.centroid(cluster.points);
      const crimeIds = cluster.points.map(p => p.id);
      const clusterCrimes = crimeIds.map(id => crimes.find(c => c.ROWID === id)!).filter(Boolean);
      const categories = clusterCrimes.map(c => c.category);
      const dominantCat = this.mode(categories);
      const avgDist = this.avgDistance(cluster.points, centroid);
      const density = cluster.points.length / (Math.PI * avgDist * avgDist);

      return {
        centerLat: centroid.lat,
        centerLng: centroid.lng,
        radius: parseFloat((avgDist * 111000).toFixed(0)),
        crimeCount: cluster.points.length,
        density: parseFloat(density.toFixed(4)),
        category: dominantCat,
        severity: cluster.points.length > 10 ? 'high' : cluster.points.length > 5 ? 'medium' : 'low',
        district,
        beats: [...new Set(clusterCrimes.map(c => c.beat))],
      };
    });

    store.setHotspots(hotspots);
    return hotspots;
  }

  private dbscan(points: Point[], eps: number, minPts: number): Cluster[] {
    const clusters: Cluster[] = [];
    const visited = new Set<number>();
    const noise = new Set<number>();
    let clusterId = 0;

    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;
      visited.add(i);
      const neighbors = this.regionQuery(points, i, eps);
      if (neighbors.length < minPts) {
        noise.add(i);
      } else {
        clusterId++;
        const cluster: Cluster = { points: [points[i]] };
        const neighborQueue = [...neighbors];
        let qIdx = 0;
        while (qIdx < neighborQueue.length) {
          const nbIdx = neighborQueue[qIdx];
          if (!visited.has(nbIdx)) {
            visited.add(nbIdx);
            const newNeighbors = this.regionQuery(points, nbIdx, eps);
            if (newNeighbors.length >= minPts) {
              neighborQueue.push(...newNeighbors.filter(n => !neighborQueue.includes(n)));
            }
          }
          if (!cluster.points.find(p => p.id === points[nbIdx].id)) {
            cluster.points.push(points[nbIdx]);
          }
          qIdx++;
        }
        clusters.push(cluster);
      }
    }
    return clusters;
  }

  private regionQuery(points: Point[], idx: number, eps: number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < points.length; i++) {
      if (i === idx) continue;
      if (this.haversineKm(points[idx], points[i]) / 111 <= eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }

  private haversineKm(a: Point, b: Point): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  private centroid(points: Point[]): Point {
    const sum = points.reduce((s, p) => ({ lat: s.lat + p.lat, lng: s.lng + p.lng }), { lat: 0, lng: 0 });
    return { lat: sum.lat / points.length, lng: sum.lng / points.length, id: 0 };
  }

  private avgDistance(points: Point[], center: Point): number {
    if (points.length === 0) return 0;
    const sum = points.reduce((s, p) => s + this.haversineKm(p, center), 0);
    return sum / points.length;
  }

  private mode(arr: string[]): string {
    const freq: Record<string, number> = {};
    arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString();
}
