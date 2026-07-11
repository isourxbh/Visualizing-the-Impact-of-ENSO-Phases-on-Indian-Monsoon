export type Phase = "El Niño" | "La Niña" | "Neutral";

export interface OniPoint {
  /** ISO-ish label e.g. "2015-07" */
  date: string;
  year: number;
  monthIndex: number; // 0-11
  oni: number;
  phase: Phase;
}

export interface PhaseCount {
  phase: Phase;
  count: number;
}

export interface HeatCell {
  row: number;
  col: number;
  value: number;
}

export interface SstCell extends HeatCell {
  lat: number;
  lon: number;
  sst: number;
}

export interface RainfallAnomaly {
  regionId: string;
  regionName: string;
  anomalyPct: number;
}

export interface OnsetDatum {
  regionId: string;
  regionName: string;
  onsetDay: number; // index into monsoon season days
}

export interface CumulativePoint {
  day: number;
  date: string;
  cumMm: number;
  normalCumMm: number;
}

export interface CalendarDay {
  day: number; // 0-based index across the monsoon season
  weekIndex: number;
  weekday: number; // 0-6
  date: string;
  rainfallMm: number;
}

export interface CorrelationCell {
  xFeature: string;
  yFeature: string;
  row: number;
  col: number;
  r: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  year: number;
  phase: Phase;
}

export interface Regression {
  slope: number;
  intercept: number;
  r2: number;
}

export interface NdviMacroPoint {
  date: string;
  weekIndex: number;
  ndvi: number;
  rainfall: number;
}

export interface NdviRegionPoint {
  weekIndex: number;
  weekLabel: string;
  [regionId: string]: number | string;
}
