export interface GeoPoint { lat: number; lng: number }

export type CrimeCategory =
  | 'chain_snatching' | 'vehicle_theft' | 'theft' | 'burglary'
  | 'assault' | 'murder' | 'robbery' | 'dacoity'
  | 'kidnapping' | 'rape' | 'sexual_harassment' | 'cyber_crime'
  | 'fraud' | 'rioting' | 'drug_offense' | 'weapons_act'
  | 'domestic_violence' | 'eve_teasing' | 'murder_attempt' | 'dowry_death';

export type Severity = 'heinous' | 'grave' | 'petty';
export type CrimeStatus = 'under_investigation' | 'solved' | 'closed';
export type SOSCategory = 'women_safety' | 'medical' | 'fire' | 'road_accident' | 'disaster' | 'other';

export interface CrimeIncident {
  ROWID: number;
  firNumber: string;
  category: CrimeCategory;
  subcategory?: string;
  description: string;
  latitude: number;
  longitude: number;
  beat: string;
  jurisdiction: string;
  district: string;
  ward?: string;
  occurredAt: string;
  reportedAt: string;
  dayOfWeek: number;
  timeSlot: string;
  status: CrimeStatus;
  severity: Severity;
  modusOperandi: string;
  propertyLost?: number;
  victimCount: number;
  suspectCount: number;
  arrestedCount: number;
  investigatingOfficer?: string;
  ioiPhone?: string;
  evidenceCount: number;
  cctvAvailable: boolean;
  forensicsRequired: boolean;
  isRepeatLocation: boolean;
  isRepeatOffender: boolean;
  responseTimeMinutes: number;
  aiRiskScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Suspect {
  ROWID: number;
  name: string;
  aliases?: string;
  age?: number;
  gender?: string;
  identification?: string;
  address?: string;
  phone?: string;
  criminalHistory: boolean;
  priorArrests: number;
  knownAssociates?: string;
  modusOperandi?: string;
  photoUrl?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface CrimeSuspectLink {
  ROWID: number;
  crimeId: number;
  suspectId: number;
  role: 'primary' | 'accomplice' | 'associate';
}

export interface PoliceStation {
  ROWID: number;
  name: string;
  address?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  district: string;
  jurisdiction?: string;
  officerCount?: number;
}

export interface PatrolVan {
  ROWID: number;
  vanNumber: string;
  officerInCharge?: string;
  officerPhone?: string;
  district: string;
  zone?: string;
  status: string;
  latitude: number;
  longitude: number;
  shift: string;
  isWomenSafetyUnit: boolean;
  crewCount: number;
  lastUpdated: string;
}

export interface SOSAlert {
  ROWID: number;
  category: SOSCategory;
  description: string;
  latitude: number;
  longitude: number;
  district: string;
  status: string;
  triggeredBy: string;
  triggeredByPhone?: string;
  nearestPoliceStation?: string;
  policeDistance?: number;
  isWomenSafety: boolean;
  audioUrl?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface RiskZone {
  ROWID: number;
  centerLat: number;
  centerLng: number;
  radius: number;
  crimeCount: number;
  density: number;
  category?: string;
  severity?: string;
  district: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface CrimeTrend {
  ROWID: number;
  district: string;
  category: string;
  date: string;
  count: number;
  avgResponseTime?: number;
  clearanceRate?: number;
  createdAt?: string;
}

export interface CrimeFilter {
  district?: string;
  category?: string;
  from?: string;
  to?: string;
  status?: string;
  beat?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}

export interface CrimeStats {
  total: number;
  today: number;
  activeCases: number;
  solvedCases: number;
  clearanceRate: number;
  avgResponseTime: number;
  byCategory: { category: string; count: number }[];
  byTimeSlot: { timeSlot: string; count: number }[];
  byDistrict: { district: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
}

export interface Hotspot {
  centerLat: number;
  centerLng: number;
  radius: number;
  crimeCount: number;
  density: number;
  category: string;
  severity: string;
  district: string;
  beats: string[];
}

export interface Prediction {
  beat: string;
  lat: number;
  lng: number;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  riskScore: number;
  timeSlot: string;
  confidence: number;
  recommendation: string;
  predictedCategories: string[];
}

export interface Anomaly {
  type: 'spike' | 'drop' | 'new_pattern';
  category: string;
  district: string;
  beat?: string;
  changePercent: number;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'suspect' | 'victim' | 'location' | 'vehicle';
  data?: any;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
