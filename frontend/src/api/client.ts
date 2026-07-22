const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => request<any>('/health'),
  getCrimes: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/crime/incidents${q}`);
  },
  getCrimeStats: (district?: string) =>
    request<any>(`/crime/stats${district ? `?district=${district}` : ''}`),
  getHotspots: (district = 'Bengaluru Urban', algorithm = 'dbscan') =>
    request<any[]>(`/crime/hotspots?district=${district}&algorithm=${algorithm}`),
  getPredictions: (district = 'Bengaluru Urban') =>
    request<any[]>(`/crime/predict?district=${district}`),
  getAnomalies: (district = 'Bengaluru Urban') =>
    request<any[]>(`/crime/anomalies?district=${district}`),
  getLinks: (depth = 2) => request<any>(`/crime/links?depth=${depth}`),
  getPatrols: (district?: string) =>
    request<any[]>(`/cpr/patrols${district ? `?district=${district}` : ''}`),
  getPoliceStations: (district?: string) =>
    request<any[]>(`/police-stations${district ? `?district=${district}` : ''}`),
  getSOSAlerts: (status?: string) =>
    request<any[]>(`/sos${status ? `?status=${status}` : ''}`),
  createSOS: (data: any) =>
    request<any>('/sos', { method: 'POST', body: JSON.stringify(data) }),
  getAdminStats: () => request<any>('/admin/stats'),
  getPublicDashboard: (district?: string) =>
    request<any>(`/public/dashboard${district ? `?district=${district}` : ''}`),
  getTrends: (district?: string, days = 90) =>
    request<any[]>(`/crime/trends?district=${district || ''}&days=${days}`),
  heatmap: (district?: string, hours = 72) =>
    request<any[]>(`/map/heatmap?district=${district || ''}&hours=${hours}`),
  login: (phone: string, name?: string, role?: string) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, name, role }),
    }),
};
