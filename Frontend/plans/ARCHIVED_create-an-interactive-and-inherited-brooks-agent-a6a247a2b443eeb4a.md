# ENSO × Indian Monsoon — Narrative Visual Analytics Dashboard

Pure-frontend React + Tailwind + recharts dashboard. Synthetic deterministic data. Reuses
the 48 existing shadcn-style components in `src/app/components/ui/`.

## 1. Map approach (decision)

**Recommendation: hand-built inline SVG tile/grid map of India.** Do NOT install
react-simple-maps or d3 (heavy, GeoJSON dependency, harder to theme/dark-mode).

- Use a **tile-grid cartogram**: each meteorological subdivision / state is a rounded
  `<rect>` placed on a fixed 2D grid that roughly mirrors India's geography (North-West top-left,
  South bottom, North-East top-right). Coordinates are hardcoded `{id, row, col, label}` constants.
- Each cell is an SVG `<rect>` whose `fill` comes from the shared diverging color-scale, with
  `onMouseEnter`/`onMouseLeave` driving a tooltip and `onClick` driving cross-filter selection.
- Selected cell gets a `stroke` ring (theme `--ring`). This gives clean color scales, hover
  tooltips, and click selection with zero geo dependencies and perfect dark-mode support.
- A second variant `RegionTileMap` is reused for both the choropleth rainfall anomaly map AND
  (with a finer pixel grid) the SST heatmap, sharing one renderer.

Rationale: ~36 subdivisions render fine as a tile grid; it reads as a recognizable India shape,
is fully responsive, and avoids projection math.

## 2. Data module — `src/app/data/`

All datasets generated deterministically from a seeded PRNG so every view is mutually consistent.

Files:
- `src/app/data/rng.ts` — `mulberry32(seed)` seeded PRNG + `seededNoise(...keys)` helper.
- `src/app/data/constants.ts` — `YEARS` (e.g. 1991..2024), `PHASES = ['El Niño','La Niña','Neutral']`,
  `STATES`, `SUBDIVISIONS` (id+label+gridRow/Col), `MONTHS`, `MONSOON_DAYS` (Jun1–Sep30),
  `KHARIF_WEEKS`, `LAG_FEATURES` (ONI, SST, SOI, IOD, rainfall, NDVI...).
- `src/app/data/generators.ts` — pure functions:
  - `getOniSeries(): {date, oni, phase}[]` — monthly ONI 1991→2024 (sinusoid + seeded noise);
    phase derived from ONI thresholds (>0.5 El Niño, <-0.5 La Niña, else Neutral).
  - `getPhaseDistribution(yearRange): {phase, count}[]` — for donut.
  - `getSeasonalHeatmap(year): {month, region, value}[]` — month×region grid.
  - `getSstGrid(year, resolution): {row,col,sst,lat,lon}[]` — fine grid for SST heatmap.
  - `getRainfallAnomaly(year): {subdivisionId, anomalyPct}[]` — choropleth values, modulated by
    that year's dominant ENSO phase (El Niño → drier, La Niña → wetter).
  - `getMonsoonOnset(year): {subdivisionId, onsetDayIndex}[]` — onset progression for playback.
  - `getCumulativeRainfall(year, subdivisionId): {day, cumMm, normalCumMm}[]`.
  - `getCalendarHeatmap(year, subdivisionId): {date, rainfallMm}[]` (Jun–Sep daily).
  - `getCorrelationMatrix(yearRange): {x,y,r}[]` over LAG_FEATURES.
  - `getScatter(featureX, featureY, yearRange): {x,y,year,phase}[]` + `linearRegression()` util
    returning slope/intercept/r² for the regression line.
  - `getNdviMacro(yearRange): {date, ndvi, rainfall}[]` (dual-axis) and
    `getNdviByRegion(year): {week, regionId, ndviAnomaly}[]` (multi-line).
- `src/app/data/index.ts` — re-exports; optionally memoizes generator results in a `Map` keyed by args.
- `src/app/data/types.ts` — shared TS types for all the above.

All generators accept the cross-filter selection (year(s), phase, region) and return filtered
data so views stay coordinated.

## 3. Cross-filter state — `src/app/context/FilterContext.tsx`

Single React Context, provider mounted in `App.tsx`, consumed via `useFilters()` hook.

```ts
interface FilterState {
  year: number;                 // primary selected year
  compareYear: number;          // for dual-year side-by-side views (module 4)
  phase: Phase | 'All';
  state: string | 'All';
  subdivision: string | 'All';
  selectedRegionId: string | null;   // set by clicking a map tile (coordinated views)
  hoveredRegionId: string | null;    // transient hover highlight
  brushRange: [number, number] | null; // ONI focus+context brush (indices into ONI series)
  playbackDay: number;          // module 5 onset animation cursor (0..MONSOON_DAYS)
  isPlaying: boolean;
}
```
Provider exposes `state` + setter actions (`setYear`, `setCompareYear`, `setPhase`, `setState`,
`setSubdivision`, `selectRegion`, `hoverRegion`, `setBrushRange`, `setPlaybackDay`, `togglePlay`,
`reset`). Use `useReducer` internally; memoize the context value.

Selecting a state auto-narrows the subdivision options; "All" sentinels avoid empty-string Select issues.

## 4. Color-scale utility — `src/app/lib/colorScale.ts`

- `divergingScale(value, min, max)` → blue→white→red (anomalies, ONI, NDVI stress). Interpolate
  in RGB between fixed endpoints; returns an rgb() string usable as SVG fill / div bg.
- `sequentialScale(value, min, max)` → for SST (cool→warm) and rainfall intensity.
- `correlationScale(r)` → diverging for [-1,1] correlation cells.
- `phaseColor(phase)` → maps El Niño/La Niña/Neutral to stable hues for legends/donut.
- `Legend` data helper returning gradient stops for a reusable `<ColorLegend>` component.
Endpoints chosen to look correct in both light and dark mode (avoid pure white in dark — use a
mid-gray neutral midpoint; read via CSS var fallback).

## 5. Layout & navigation

`App.tsx`:
- Wrap everything in `FilterProvider` + `TooltipProvider` + `SidebarProvider`.
- Two-column shell: persistent left `GlobalFilterSidebar` (uses `ui/sidebar.tsx`) + main content.
- Main content uses **Tabs** (`ui/tabs.tsx`) with 7 triggers (one per module) inside a
  `ScrollArea`. Tabs chosen over scroll-sections to keep each heavy module mounted lazily and
  reduce DOM weight; an intro/“narrative” header card sits above the tabs explaining the story.
- Top bar: title, dark-mode toggle (`next-themes` already installed), active-filter `Badge`s,
  and a reset button.

## 6. Component decomposition (`src/app/components/`)

Shared / chrome:
- `GlobalFilterSidebar.tsx` — year `Select`, phase `Select`, state `Select`, subdivision `Select`,
  active-filter `Badge`s, reset `Button`, mini ONI sparkline. Drives FilterContext. Uses
  `ui/sidebar`, `ui/select`, `ui/badge`, `ui/separator`, `ui/button`.
- `DashboardHeader.tsx` — title, narrative blurb, theme toggle (`ui/switch`), filter summary.
- `ColorLegend.tsx` — reusable gradient legend strip for any scale.
- `RegionTooltip.tsx` — floating tooltip content for SVG map/heatmap hover (uses `ui/card` styling).
- `ChartCard.tsx` — wrapper: `ui/card` + title + optional info `ui/tooltip` + children (consistent framing).

Map / heatmap primitives (reused across modules):
- `maps/RegionTileMap.tsx` — the inline SVG tile cartogram. Props: `values` (regionId→number),
  `scale`, `selectedRegionId`, `onSelect`, `onHover`. Used by modules 2, 4, 5.
- `heatmap/GridHeatmap.tsx` — generic CSS-grid div heatmap. Props: `rows`, `cols`, `cell(r,c)→value`,
  `scale`, `onHover`, cell tooltips. Used by SST, calendar, correlation, seasonal heatmaps.

Module 1 — covered by `GlobalFilterSidebar`.

Module 2 — Coordinated overview:
- `modules/OverviewModule.tsx` — composes `RegionTileMap` (selection source) + small linked
  timeline/profile `recharts` `LineChart`s that react to `selectedRegionId`.

Module 3 — ONI Focus+Context:
- `modules/OniTimelineModule.tsx` — recharts `AreaChart` of ONI with `<Brush>` (focus+context),
  phase-colored reference bands; brush updates `brushRange`. A `Button` opens a `Sheet`
  (details-on-demand).
- `oni/OniDetailSheet.tsx` — `ui/sheet` side panel containing:
  - `oni/PhaseDonut.tsx` — recharts `PieChart` donut of phase distribution within brush range.
  - `oni/SeasonalHeatmap.tsx` — `GridHeatmap` month×region for the focused window.

Module 4 — Side-by-side spatial comparison:
- `modules/SpatialCompareModule.tsx` — dual-year `Select`s (year vs compareYear) + a 2×2 grid:
  - `spatial/SstHeatmapPanel.tsx` — `GridHeatmap` SST with a resolution `ui/toggle-group`
    (coarse/fine) to demonstrate resolution comparison; hover tooltips.
  - `spatial/RainfallChoroplethPanel.tsx` — `RegionTileMap` rainfall anomaly per year.
  - Rendered twice (left=year, right=compareYear) so SST and choropleth compare side by side.

Module 5 — Monsoon progress + playback:
- `modules/MonsoonProgressModule.tsx` — orchestrates playback (`playbackDay`, `isPlaying`).
- `monsoon/PlaybackControls.tsx` — play/pause `Button`, `ui/slider` scrubber, speed `ui/select`;
  animation via `useEffect` + `setInterval` advancing `playbackDay` (clear interval on pause/unmount).
- `monsoon/OnsetMap.tsx` — `RegionTileMap` colored by whether each region's onset ≤ playbackDay
  (animated geographical onset sweep).
- `monsoon/CalendarHeatmap.tsx` — `GridHeatmap` week×day daily rainfall for selected region.
- `monsoon/CumulativeLinePlot.tsx` — recharts `LineChart` cumulative vs normal, with a
  `<ReferenceLine x={playbackDay}>` synced to the animation.

Module 6 — Statistical analysis:
- `modules/StatsModule.tsx` — layout (correlation left, scatter right).
- `stats/CorrelationHeatmap.tsx` — `GridHeatmap` feature×feature correlation; clicking a cell
  selects the X/Y pair for the scatter.
- `stats/ScatterRegression.tsx` — recharts `ScatterChart` + a regression `<Line>` (computed
  slope/intercept) + r² label; lag-feature `Select`s.

Module 7 — Agricultural impact:
- `modules/AgricultureModule.tsx` — narrative around Kharif/NDVI.
- `agri/NdviMacroChart.tsx` — recharts `ComposedChart` dual-axis (NDVI line on left axis,
  rainfall on right axis) over the Kharif cycle.
- `agri/RegionalNdviLines.tsx` — recharts multi-`Line` `LineChart` of regional NDVI anomaly,
  synced/highlighted by `selectedRegionId` and the macro chart's hovered week.

## 7. recharts usage notes
- Wrap recharts charts in `ui/chart.tsx` `ChartContainer`/`ChartTooltip` so colors pull from
  `--chart-1..5` and theming/tooltips are consistent.
- Heatmaps are NOT recharts — they are div/SVG grids via `GridHeatmap` + color-scale util.

## 8. Build order
1. `data/` module (rng, constants, types, generators) — foundation everything depends on.
2. `lib/colorScale.ts` + `ColorLegend`.
3. `context/FilterContext.tsx` + `App.tsx` shell (Provider, sidebar, tabs, header).
4. `GlobalFilterSidebar` + `ChartCard` + verify cross-filter wiring with a placeholder chart.
5. Primitives: `RegionTileMap`, `GridHeatmap`, `RegionTooltip`.
6. Module 2 Overview (proves coordinated selection end to end).
7. Module 3 ONI timeline + detail Sheet (brush, donut, seasonal heatmap).
8. Module 4 Spatial compare (dual-year, reuse map + heatmap).
9. Module 5 Monsoon playback (interval animation).
10. Module 6 Stats (correlation + regression).
11. Module 7 Agriculture (dual-axis + multi-line).
12. Polish: legends, dark-mode, empty/“All” states, narrative copy, responsive tab layout.

## Critical files for implementation
- /workspaces/default/code/src/app/App.tsx
- /workspaces/default/code/src/app/context/FilterContext.tsx
- /workspaces/default/code/src/app/data/generators.ts
- /workspaces/default/code/src/app/components/maps/RegionTileMap.tsx
- /workspaces/default/code/src/app/lib/colorScale.ts
