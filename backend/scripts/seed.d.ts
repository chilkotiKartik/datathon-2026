export function generateFIR(startDate: Date, endDate: Date): Record<string, any>;
export function runSeed(totalRecords?: number): Record<string, any>[];
export const CATEGORIES: Record<string, { weight: number; severity: string; slots: string[] }>;
export const LOCATIONS: { name: string; lat: number; lng: number; weight: number }[];
