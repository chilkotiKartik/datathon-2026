import type { Express, Request, Response } from 'express';
import type { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { store, sseEmitter } from './in-memory-store';
import { HotspotDetector } from '../agents/HotspotDetector';
import { CrimePredictor } from '../agents/CrimePredictor';
import { AnomalyDetector } from '../agents/AnomalyDetector';
import { LinkAnalyzer } from '../agents/LinkAnalyzer';
import type { CrimeFilter } from './crime-models';

const hotspotDetector = new HotspotDetector();
const crimePredictor = new CrimePredictor();
const anomalyDetector = new AnomalyDetector();
const linkAnalyzer = new LinkAnalyzer();

function wrap(fn: (req: Request, res: Response) => Promise<any>) {
  return (req: Request, res: Response) => {
    fn(req, res).catch(err => {
      console.error('Route error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    });
  };
}

const wssClients = new Set<WebSocket>();

export function registerRoutes(app: Express, server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    wssClients.add(ws);
    ws.on('close', () => wssClients.delete(ws));
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        wssClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      } catch { }
    });
  });

  sseEmitter.on('sos:new', (alert) => {
    const msg = JSON.stringify({ type: 'sos:new', data: alert });
    wssClients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
  });

  sseEmitter.on('crime:new', (crime) => {
    const msg = JSON.stringify({ type: 'crime:new', data: crime });
    wssClients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
  });

  // ── CRIME API ──
  app.get('/api/crime/incidents', wrap(async (req, res) => {
    const filter: CrimeFilter = {
      district: req.query.district as string,
      category: req.query.category as string,
      status: req.query.status as string,
      severity: req.query.severity as string,
      beat: req.query.beat as string,
      from: req.query.from as string,
      to: req.query.to as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 1000,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    const result = store.getCrimes(filter);
    res.json(result);
  }));

  app.get('/api/crime/incidents/:id', wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    const crime = store.getCrimeById(id);
    if (!crime) return res.status(404).json({ error: 'Crime not found' });
    res.json(crime);
  }));

  app.get('/api/crime/stats', wrap(async (req, res) => {
    const district = req.query.district as string;
    const stats = store.getCrimeStats(district);
    res.json(stats);
  }));

  app.get('/api/crime/hotspots', wrap(async (req, res) => {
    const district = (req.query.district as string) || 'Bengaluru Urban';
    const algorithm = req.query.algorithm as string;
    if (algorithm === 'dbscan') {
      const hotspots = hotspotDetector.detect(district);
      return res.json(hotspots);
    }
    const zones = store.getHotspots(district);
    res.json(zones);
  }));

  app.get('/api/crime/trends', wrap(async (req, res) => {
    const district = req.query.district as string;
    const days = req.query.days ? parseInt(req.query.days as string) : 90;
    const trends = store.getCrimeTrends(district, days);
    res.json(trends);
  }));

  app.get('/api/crime/predict', wrap(async (req, res) => {
    const district = (req.query.district as string) || 'Bengaluru Urban';
    const predictions = crimePredictor.predict(district);
    res.json(predictions);
  }));

  app.get('/api/crime/anomalies', wrap(async (req, res) => {
    const district = (req.query.district as string) || 'Bengaluru Urban';
    const anomalies = anomalyDetector.detect(district);
    res.json(anomalies);
  }));

  app.get('/api/crime/links', wrap(async (req, res) => {
    const depth = req.query.depth ? parseInt(req.query.depth as string) : 2;
    const suspectId = req.query.suspectId ? parseInt(req.query.suspectId as string) : undefined;
    const graph = suspectId
      ? linkAnalyzer.analyzeForSuspect(suspectId)
      : linkAnalyzer.analyze(depth);
    res.json(graph);
  }));

  // ── MAP & GEO ──
  app.get('/api/map/heatmap', wrap(async (req, res) => {
    const district = req.query.district as string;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const from = new Date(Date.now() - hours * 3600000).toISOString();
    const crimes = store.getCrimes({ district, from });
    const points = crimes.map(c => ({ lat: c.latitude, lng: c.longitude, weight: c.aiRiskScore || 1 }));
    res.json(points);
  }));

  app.get('/api/map/clusters', wrap(async (req, res) => {
    const district = (req.query.district as string) || 'Bengaluru Urban';
    const hotspots = hotspotDetector.detect(district);
    res.json(hotspots);
  }));

  app.get('/api/cpr/patrols', wrap(async (req, res) => {
    const district = req.query.district as string;
    const vans = store.getPatrolVans(district);
    res.json(vans);
  }));

  app.get('/api/cpr/patrols/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const sendPatrols = () => {
      const vans = store.getPatrolVans();
      res.write(`data: ${JSON.stringify(vans)}\n\n`);
    };

    sendPatrols();
    const interval = setInterval(sendPatrols, 5000);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // ── SOS ──
  app.get('/api/sos', wrap(async (req, res) => {
    const status = req.query.status as string;
    const alerts = store.getSOSAlerts(status);
    res.json(alerts);
  }));

  app.post('/api/sos', wrap(async (req, res) => {
    const alert = store.addSOSAlert({
      category: req.body.category,
      description: req.body.description,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      district: req.body.district || 'Bengaluru Urban',
      status: 'active',
      triggeredBy: req.body.triggeredBy || 'Anonymous',
      triggeredByPhone: req.body.triggeredByPhone,
      isWomenSafety: req.body.isWomenSafety || false,
    });
    res.status(201).json(alert);
  }));

  app.post('/api/sos/women-safety', wrap(async (req, res) => {
    const alert = store.addSOSAlert({
      category: 'women_safety',
      description: req.body.description || 'Stealth SOS activated',
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      district: req.body.district || 'Bengaluru Urban',
      status: 'active',
      triggeredBy: req.body.triggeredBy || 'Anonymous',
      triggeredByPhone: req.body.triggeredByPhone,
      isWomenSafety: true,
    });
    res.status(201).json(alert);
  }));

  app.put('/api/sos/:id/location', wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    const alert = store.updateSOSAlert(id, {
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    if (!alert) return res.status(404).json({ error: 'SOS alert not found' });
    res.json(alert);
  }));

  app.put('/api/sos/:id/resolve', wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    const alert = store.updateSOSAlert(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
    if (!alert) return res.status(404).json({ error: 'SOS alert not found' });
    res.json(alert);
  }));

  // ── POLICE STATIONS ──
  app.get('/api/police-stations', wrap(async (req, res) => {
    const district = req.query.district as string;
    res.json(store.getPoliceStations(district));
  }));

  // ── SUSPECTS ──
  app.get('/api/suspects', wrap(async (req, res) => {
    res.json(store.getSuspects());
  }));

  app.get('/api/suspects/:id', wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    const suspect = store.getSuspect(id);
    if (!suspect) return res.status(404).json({ error: 'Suspect not found' });
    res.json(suspect);
  }));

  // ── PUBLIC ──
  app.get('/api/public/dashboard', wrap(async (req, res) => {
    const district = req.query.district as string;
    const stats = store.getCrimeStats(district);
    const hotspots = store.getHotspots(district);
    const patrols = store.getPatrolVans(district);
    res.json({ stats, hotspots: hotspots.slice(0, 5), activePatrols: patrols.length });
  }));

  app.get('/api/public/district-stats', wrap(async (req, res) => {
    const districts = [...new Set(store.getCrimes().map(c => c.district))];
    const data = districts.map(d => ({
      district: d,
      ...store.getCrimeStats(d),
    }));
    res.json(data);
  }));

  app.get('/api/public/safe-route', wrap(async (req, res) => {
    const fromLat = parseFloat(req.query.fromLat as string);
    const fromLng = parseFloat(req.query.fromLng as string);
    const toLat = parseFloat(req.query.toLat as string);
    const toLng = parseFloat(req.query.toLng as string);
    const hotspots = store.getHotspots();
    res.json({
      from: { lat: fromLat, lng: fromLng },
      to: { lat: toLat, lng: toLng },
      riskZones: hotspots.map(h => ({ lat: h.centerLat, lng: h.centerLng, radius: h.radius, severity: h.severity })),
      recommendation: hotspots.length > 3 ? 'Consider alternative route through low-risk areas' : 'Route is safe',
    });
  }));

  // ── ADMIN ──
  app.get('/api/admin/stats', wrap(async (req, res) => {
    const stats = store.getCrimeStats();
    const activeSOS = store.getSOSAlerts('active');
    const patrols = store.getPatrolVans();
    const predictions = store.getPredictions();
    const anomalies = store.getAnomalies();
    res.json({
      ...stats,
      activeSOS: activeSOS.length,
      activePatrols: patrols.filter(p => p.status === 'active_patrol').length,
      highRiskAlerts: predictions.filter(p => p.riskLevel === 'HIGH').length,
      criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
    });
  }));

  // ── CITIZEN ──
  app.post('/api/auth/login', wrap(async (req, res) => {
    const { phone, role } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    res.json({
      token: `demo-token-${phone}`,
      user: {
        id: `user-${phone}`,
        name: req.body.name || 'Citizen',
        phone,
        role: role || 'citizen',
        district: req.body.district || 'Bengaluru Urban',
      },
    });
  }));

  // ── SSE ──
  app.get('/api/sse/crime-updates', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const onCrime = (crime: any) => {
      res.write(`event: crime\n`);
      res.write(`data: ${JSON.stringify(crime)}\n\n`);
    };
    const onSOS = (alert: any) => {
      res.write(`event: sos\n`);
      res.write(`data: ${JSON.stringify(alert)}\n\n`);
    };

    sseEmitter.on('crime:new', onCrime);
    sseEmitter.on('sos:new', onSOS);

    req.on('close', () => {
      sseEmitter.off('crime:new', onCrime);
      sseEmitter.off('sos:new', onSOS);
    });
  });
}
