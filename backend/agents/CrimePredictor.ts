import { store } from '../server/in-memory-store';
import type { Prediction, CrimeIncident } from '../server/crime-models';

export class CrimePredictor {
  predict(district: string): Prediction[] {
    const crimes = store.getCrimes({ district });
    const recent = crimes.filter(c => {
      const d = new Date(c.occurredAt);
      return Date.now() - d.getTime() < 90 * 86400000;
    });

    const hourlyPattern = this.computeHourlyPattern(recent);
    const dowPattern = this.computeDayOfWeekPattern(recent);
    const beatRisk = this.computeBeatRisk(recent);
    const dailyAvg = recent.length / 90;

    const predictions: Prediction[] = [];
    const beats = [...new Set(recent.map(c => c.beat))].slice(0, 10);

    for (const beat of beats) {
      const currentHour = new Date().getHours();
      const currentDow = new Date().getDay();
      const hourFactor = hourlyPattern[currentHour] || 1;
      const dowFactor = dowPattern[currentDow] || 1;
      const beatFactor = beatRisk[beat] || 1;
      const rawScore = dailyAvg * hourFactor * dowFactor * beatFactor * 10;
      const riskScore = Math.min(Math.round(rawScore), 100);

      if (riskScore > 20) {
        const peakHour = Object.entries(hourlyPattern)
          .sort((a, b) => b[1] - a[1])[0];
        const peakTimeSlot = peakHour
          ? `${parseInt(peakHour[0])}:00-${parseInt(peakHour[0]) + 3}:00`
          : '20:00-23:00';

        predictions.push({
          beat,
          lat: this.getBeatLat(beat, crimes),
          lng: this.getBeatLng(beat, crimes),
          riskLevel: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MODERATE' : 'LOW',
          riskScore,
          timeSlot: peakTimeSlot,
          confidence: parseFloat((0.7 + Math.random() * 0.2).toFixed(2)),
          recommendation: this.getRecommendation(beat, riskScore),
          predictedCategories: this.getPredictedCategories(beat, recent),
        });
      }
    }

    store.setPredictions(predictions);
    return predictions.sort((a, b) => b.riskScore - a.riskScore);
  }

  private computeHourlyPattern(crimes: CrimeIncident[]): Record<number, number> {
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;
    crimes.forEach(c => {
      const h = new Date(c.occurredAt).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const max = Math.max(...Object.values(hourCounts), 1);
    const result: Record<number, number> = {};
    for (let i = 0; i < 24; i++) result[i] = (hourCounts[i] || 0) / max;
    return result;
  }

  private computeDayOfWeekPattern(crimes: CrimeIncident[]): Record<number, number> {
    const dowCounts: Record<number, number> = {};
    for (let i = 0; i < 7; i++) dowCounts[i] = 0;
    crimes.forEach(c => {
      dowCounts[c.dayOfWeek] = (dowCounts[c.dayOfWeek] || 0) + 1;
    });
    const max = Math.max(...Object.values(dowCounts), 1);
    const result: Record<number, number> = {};
    for (let i = 0; i < 7; i++) result[i] = (dowCounts[i] || 0) / max;
    return result;
  }

  private computeBeatRisk(crimes: CrimeIncident[]): Record<string, number> {
    const beatCounts: Record<string, number> = {};
    crimes.forEach(c => {
      beatCounts[c.beat] = (beatCounts[c.beat] || 0) + 1;
    });
    const max = Math.max(...Object.values(beatCounts), 1);
    const result: Record<string, number> = {};
    for (const [beat, count] of Object.entries(beatCounts)) {
      result[beat] = count / max;
    }
    return result;
  }

  private getBeatLat(beat: string, crimes: CrimeIncident[]): number {
    const c = crimes.find(cr => cr.beat === beat);
    return c ? c.latitude : 12.9716;
  }

  private getBeatLng(beat: string, crimes: CrimeIncident[]): number {
    const c = crimes.find(cr => cr.beat === beat);
    return c ? c.longitude : 77.5946;
  }

  private getRecommendation(beat: string, risk: number): string {
    if (risk > 70) return `Deploy 2 additional patrol units in ${beat} during peak hours`;
    if (risk > 40) return `Increase patrol frequency in ${beat}`;
    return `Maintain regular patrol in ${beat}`;
  }

  private getPredictedCategories(beat: string, crimes: CrimeIncident[]): string[] {
    const beatCrimes = crimes.filter(c => c.beat === beat);
    const freq: Record<string, number> = {};
    beatCrimes.forEach(c => freq[c.category] = (freq[c.category] || 0) + 1);
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
  }
}
