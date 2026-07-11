# Interactive Climate Impact Dashboard — Frontend

A React + Vite single-page dashboard visualizing the impact of ENSO phases on the Indian Monsoon.

## Tech Stack

- **React 18** with TypeScript
- **Vite** (dev server + build)
- **Recharts** — chart library (area, line, scatter, pie, composed)
- **Tailwind CSS 4** — utility-first styling
- **shadcn/ui** — 48 Radix-based UI components
- **next-themes** — light/dark mode

## Running

```bash
# Install dependencies
npm install
# or
pnpm install

# Start dev server (frontend only — client-side data)
npm run dev

# Start with backend API (run backend first on :8000)
# The Vite proxy forwards /api/* to http://127.0.0.1:8000
npm run dev
```

The frontend works **fully offline** using bundled real data (NOAA ONI, IMD rainfall) and deterministic generators. When the FastAPI backend is running on port 8000, panels transparently switch to backend-served data via the `useApiData` hook.

## Architecture

```
src/
├── main.tsx                   ← Entry point
├── styles/                    ← CSS (Tailwind, theme, fonts)
└── app/
    ├── App.tsx                ← Root: providers + 12-col grid layout
    ├── context/
    │   └── FilterContext.tsx  ← Global cross-filter state (year, phase, brush, compare)
    ├── data/
    │   ├── api.ts             ← Backend fetch wrappers (all /api/* endpoints)
    │   ├── useApiData.ts      ← Hook: try API → fallback to generator
    │   ├── generators.ts      ← Client-side data generators
    │   ├── realData.ts        ← Parse bundled ONI/rainfall CSVs
    │   ├── sstNino34.ts       ← Modeled SST grids for Niño 3.4
    │   ├── monsoonDaily.ts    ← Daily monsoon rainfall model
    │   └── constants.ts       ← Years, states, regions, features
    ├── components/
    │   ├── graphs/            ← Main panels: G1–G6 + Phase + Seasonal
    │   ├── monsoon/           ← Animated map, playback, cumulative chart
    │   ├── oni/               ← Phase donut, seasonal matrix, derivation
    │   ├── stats/             ← Scatter, sensitivity heatmap
    │   ├── maps/              ← IndiaChoropleth (SVG)
    │   ├── heatmap/           ← GridHeatmap (div-based)
    │   ├── single/            ← PanelCard, ChartBox, ViewSelect
    │   └── ui/                ← 48 shadcn/ui base components
    └── lib/
        └── colorScale.ts      ← Diverging, sequential, phase color scales
```

## Panels

| Panel | Component | Description |
|-------|-----------|-------------|
| G1 | `SstComparePanel` | SST anomaly heatmap (event selector / compare mode) |
| G2 | `OniStripPanel` | ONI diverging area chart with brush selector |
| G3 | `MonsoonHeroPanel` | Animated monsoon onset choropleth + cumulative chart |
| G4 | `RainfallAnomalyPanel` | Static seasonal rainfall anomaly choropleth |
| G5 | `OniRainfallStatsPanel` | ONI vs rainfall scatter / state sensitivity heatmap |
| G6 | `NdviOniPanel` | NDVI vs ONI dual-axis chart by region |
| — | `PhaseDistributionPanel` | Phase distribution donut (brush-reactive) |
| — | `SeasonalIntensityPanel` | Month × year ONI intensity heatmap (brush-reactive) |

## Backend API Integration

The frontend uses `/api/*` endpoints via a Vite dev proxy. See `vite.config.ts` for proxy configuration and `src/app/data/api.ts` for typed fetch wrappers.

## Design Origin

Originally designed in Figma: [Interactive Climate Impact Dashboard](https://www.figma.com/design/tjCnmKdgEYNHIYaRFWjBD2/Interactive-Climate-Impact-Dashboard)