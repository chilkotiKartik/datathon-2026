import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Camera, Eye, Play, Pause, Sliders, Database, Cpu, Loader2, Shield } from 'lucide-react';
import { ExplainabilityDrawer, CitationData } from '../components/ExplainabilityDrawer';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Real object detection: COCO-SSD (MIT), weights served locally, real video frames.
interface Feed { id: string; name: string; location: string; src: string; }
const FEEDS: Feed[] = [
  { id: 'cam-04', name: 'Street Traffic — Cam 04', location: 'Sample street footage (car-detection)', src: '/clips/street-cars.mp4' },
  { id: 'cam-11', name: 'Mixed Scene — Cam 11', location: 'Sample street footage (person-bicycle-car)', src: '/clips/street-mixed.mp4' }
];

const COLORS: Record<string, string> = {
  car: '#EF4444', truck: '#F59E0B', bus: '#F59E0B', motorcycle: '#F59E0B', bicycle: '#22C55E',
  person: '#3B82F6', 'traffic light': '#A78BFA'
};
const colorFor = (c: string) => COLORS[c] || '#94A3B8';

export const CameraIntelligence: React.FC = () => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const rafRef = useRef<number>(0);
  const alertedRef = useRef(false);

  const [activeId, setActiveId] = useState(FEEDS[0].id);
  const [isPlaying, setIsPlaying] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const privacyRef = useRef(false);
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modelState, setModelState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [variant, setVariant] = useState<'lite' | 'v2'>('lite');
  const [dets, setDets] = useState<{ class: string; score: number }[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationData | null>(null);

  const activeFeed = FEEDS.find((f) => f.id === activeId) || FEEDS[0];

  // Load COCO-SSD from LOCAL weights (never a CDN). Variant-selectable.
  useEffect(() => {
    let cancelled = false;
    const url = variant === 'v2' ? '/models/coco-ssd-v2/model.json' : '/models/coco-ssd/model.json';
    setModelState('loading');
    modelRef.current = null;
    (async () => {
      try {
        const model = await cocoSsd.load({ modelUrl: url });
        if (cancelled) return;
        modelRef.current = model;
        (window as any).__cocoModel = model; // exposed for verification/debug
        setModelState('ready');
        // eslint-disable-next-line no-console
        console.log(`[COCO-SSD] model loaded (${variant}) from local weights ${url}`);
      } catch (e) {
        if (!cancelled) setModelState('error');
        console.error('[COCO-SSD] load failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [variant]);

  // Detection loop — real inference on real decoded frames (~4 fps).
  const detectLoop = useCallback(async () => {
    const model = modelRef.current, video = videoRef.current, canvas = canvasRef.current;
    if (model && video && canvas && video.readyState >= 2 && !video.paused) {
      const preds = await model.detect(video, 20);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // reusable offscreen canvas for pixelation
        if (!pixelCanvasRef.current) pixelCanvasRef.current = document.createElement('canvas');
        const px = pixelCanvasRef.current;
        preds.forEach((p) => {
          const [x, y, w, h] = p.bbox;
          const col = colorFor(p.class);
          // DPDP privacy mode: pixelate detected persons instead of exposing them
          if (privacyRef.current && p.class === 'person' && w > 4 && h > 4) {
            const sw = Math.max(6, Math.round(w / 12)), sh = Math.max(6, Math.round(h / 12));
            px.width = sw; px.height = sh;
            const pctx = px.getContext('2d');
            if (pctx) {
              pctx.drawImage(video, x, y, w, h, 0, 0, sw, sh);   // downscale region
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(px, 0, 0, sw, sh, x, y, w, h);        // upscale = pixelate
              ctx.imageSmoothingEnabled = true;
            }
            ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = '#22c55e'; ctx.font = 'bold 13px sans-serif';
            ctx.fillText('person · anonymised', x + 4, y + 14);
            return;
          }
          ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
          const label = `${p.class} ${Math.round(p.score * 100)}%`;
          ctx.font = 'bold 16px sans-serif';
          const tw = ctx.measureText(label).width + 10;
          ctx.fillStyle = col; ctx.fillRect(x, y - 22, tw, 22);
          ctx.fillStyle = '#070C18'; ctx.fillText(label, x + 5, y - 6);
        });
        // real console proof (throttled)
        setFrameCount((n) => {
          if (n % 4 === 0) console.log(`[COCO-SSD] ${activeFeed.id} frame ${n}: ` +
            (preds.length ? preds.map((p) => `${p.class} ${p.score.toFixed(2)}`).join(', ') : 'no detections'));
          return n + 1;
        });
        setDets(preds.map((p) => ({ class: p.class, score: p.score })));

        // real interlink: fire a Command Center alert once per clip on a confident vehicle/person
        const strong = preds.find((p) => p.score > 0.6 && ['car', 'truck', 'bus', 'motorcycle', 'person'].includes(p.class));
        if (strong && !alertedRef.current) {
          alertedRef.current = true;
          fetch('/api/catalyst/command-center/alerts', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ station: activeFeed.name, district: 'Bengaluru Urban', crimeType: 'CCTV Object Detection', severity: 'INFO',
              description: `COCO-SSD detected ${strong.class} (${Math.round(strong.score * 100)}%) on ${activeFeed.name}` })
          }).catch(() => {});
        }
      }
    }
    rafRef.current = window.setTimeout(() => requestAnimationFrame(detectLoop), 250) as any;
  }, [activeFeed]);

  useEffect(() => {
    if (modelState === 'ready') detectLoop();
    return () => { clearTimeout(rafRef.current); };
  }, [modelState, detectLoop]);

  useEffect(() => { alertedRef.current = false; }, [activeId]);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); } else { v.pause(); setIsPlaying(false); }
  };

  const openDrawer = (d: { class: string; score: number }) => {
    setActiveCitation({
      title: `COCO-SSD Detection — ${d.class}`,
      category: 'Local Object Detection (TensorFlow.js)',
      fir_citations: ['LOCAL-INFERENCE'],
      model_source: 'COCO-SSD ssdlite_mobilenet_v2 · local weights',
      shap_features: [{ feature: `${d.class} class score`, weight: +d.score.toFixed(2) }]
    });
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <Camera className="w-7 h-7 text-amber-500" />
            {t('Live Camera Intelligence Wall', 'ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ')}
          </h1>
          <p className="text-sm text-slate-400">Real client-side object detection (TensorFlow.js COCO-SSD) on locally-bundled street footage.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={variant} onChange={(e) => setVariant(e.target.value as 'lite' | 'v2')} className="px-2 py-1 bg-navy-900 border border-navy-700 rounded text-slate-200 text-[11px] font-mono">
            <option value="lite">Lite MobileNet (fast · 18MB)</option>
            <option value="v2">MobileNet-v2 (accurate · 65MB)</option>
          </select>
          <span className={`px-2.5 py-1 rounded font-mono text-[11px] border flex items-center gap-1.5 ${modelState === 'ready' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : modelState === 'error' ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-navy-900 text-slate-400 border-navy-700'}`}>
            {modelState === 'ready' ? <Cpu className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {modelState === 'ready' ? `AI DETECTION — COCO-SSD ${variant === 'v2' ? 'MobileNet-v2' : 'Lite'} (Local)` : modelState === 'error' ? 'MODEL LOAD FAILED' : 'LOADING MODEL…'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 ops-card p-4 border border-navy-600 space-y-4 shadow-ops-panel">
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-200"><Eye className="w-4 h-4 text-amber-500" /><span>{activeFeed.name}</span></div>
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LOCAL INFERENCE</span>
          </div>
          <div className="relative w-full aspect-video bg-navy-950 rounded-xl overflow-hidden border border-navy-800">
            <video ref={videoRef} src={activeFeed.src} autoPlay loop muted playsInline className="w-full h-full object-contain" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-navy-950/70 border border-navy-700 text-slate-300 font-mono text-[10px]">
              {modelState === 'ready' ? 'AI DETECTION — COCO-SSD (Local Inference)' : 'Initialising model…'}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-navy-800">
            <span className="font-mono">{activeFeed.location}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const v = !privacyMode; setPrivacyMode(v); privacyRef.current = v; }}
                className={`px-3 py-1.5 rounded border flex items-center gap-1.5 ${privacyMode ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300' : 'bg-navy-900 border-navy-700 text-slate-300 hover:bg-navy-800'}`}
                title="DPDP Act — blur/anonymise detected persons"
              >
                <Shield className="w-3.5 h-3.5" /><span>{privacyMode ? 'Privacy ON' : 'Privacy Mode'}</span>
              </button>
              <button onClick={togglePlay} className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 border border-navy-700 rounded text-slate-200 flex items-center gap-1.5">
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}<span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="ops-card p-5 border border-navy-600 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-navy-700 pb-3 flex items-center gap-2"><Sliders className="w-4 h-4 text-amber-500" /> Feeds & Live Detections</h3>
          <div className="space-y-2">
            {FEEDS.map((f) => (
              <button key={f.id} onClick={() => setActiveId(f.id)} className={`w-full p-3 rounded-lg text-left text-xs border transition-all ${activeFeed.id === f.id ? 'bg-amber-500/20 border-amber-500 text-slate-100 font-bold' : 'bg-navy-950 border-navy-800 text-slate-400 hover:border-navy-600'}`}>
                {f.name}<p className="text-[10px] text-slate-500 mt-1">{f.location}</p>
              </button>
            ))}
          </div>
          <div className="p-3 bg-navy-950 rounded-lg border border-navy-800 space-y-2 text-xs">
            <h4 className="font-bold text-amber-400 uppercase text-[11px]">Live COCO-SSD detections (this frame):</h4>
            {dets.length === 0 ? <p className="text-slate-500 italic text-[11px]">{modelState === 'ready' ? 'No objects in current frame.' : 'Model loading…'}</p> :
              dets.slice(0, 8).map((d, i) => (
                <div key={i} onClick={() => openDrawer(d)} className="p-2 bg-navy-900 rounded border border-navy-700 flex justify-between items-center cursor-pointer hover:border-amber-500/50">
                  <span className="font-mono" style={{ color: colorFor(d.class) }}>{d.class}</span>
                  <span className="font-mono font-bold text-slate-200">{Math.round(d.score * 100)}%</span>
                </div>
              ))}
          </div>
          {dets.length > 0 && (
            <p className="text-[11px] text-slate-300 leading-relaxed bg-navy-950 border border-navy-800 rounded p-2">
              The model is currently seeing {dets.slice(0, 3).map((d) => `a ${d.class} (${Math.round(d.score * 100)}%)`).join(', ')} in this frame.
            </p>
          )}
          <div className="flex items-start gap-2 text-[10px] text-slate-500 font-mono border-t border-navy-800 pt-3">
            <Database className="w-3.5 h-3.5 mt-0.5 text-slate-600 shrink-0" />
            <span>COCO-SSD ssdlite_mobilenet_v2 · MIT · local weights (/models/coco-ssd) · {frameCount} frames inferred</span>
          </div>
        </div>
      </div>
      <ExplainabilityDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} data={activeCitation} />
    </div>
  );
};
