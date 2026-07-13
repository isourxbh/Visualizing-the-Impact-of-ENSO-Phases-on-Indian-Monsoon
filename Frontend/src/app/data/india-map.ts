// Realistic India map: pre-projected SVG paths for all states & union territories.
// Source data (@svg-maps/india) bundled locally as `india-map-raw.js`.
// @ts-ignore - raw data module shipped without type declarations
import mapData from "./india-map-raw.js";

export interface IndiaLocation {
  /** Full display name, e.g. "Tamil Nadu" */
  name: string;
  /** Short id, e.g. "tn" */
  id: string;
  /** SVG path data in the map's viewBox coordinate space */
  path: string;
}

export interface IndiaMapData {
  label: string;
  viewBox: string;
  locations: IndiaLocation[];
}

export const INDIA_MAP = mapData as IndiaMapData;
export const INDIA_LOCATIONS: IndiaLocation[] = INDIA_MAP.locations;
