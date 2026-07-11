# ENSO × Monsoon — 6-Graph Landscape Dashboard (v3 implementation)

## Context

The user hand-authored a detailed v3 spec (`src/imports/dashboard_graphs_plan.md`) that reshapes the
existing bento dashboard into a **T-shaped, single-viewport landscape dashboard** built around 6 named
graphs (G1–G6), a **slide-out ONI detail drawer**, an **animated two-layer monsoon choropleth**, and a
**global "⚡ Compare" mode** that makes all 6 graphs react to Year A vs Year B.

Two decisions were confirmed with the user:
1. **Generate new mock datasets literally** to match the spec (fake OISST 0.25° grid, dated Nov
   2015/2020/2023 SST snapshots, extended year coverage) rather than only reusing the real 1950–2015
   observed data.
2. **Full global compare mode** — one header toggle drives dual maps (G3/G4), overlaid lines (G6),
   and highlighted markers (G5).

The current app is a 5-panel bento (`src/app/App.tsx` + `src/app/components/single/*`). We reuse the
plumbing (`FilterContext`, `PanelCard`, `ViewSelect`, `GridHeatmap`, `IndiaChoropleth`,
`PlaybackControls`, `linearRegression`, color scales, `realData` observed ONI/rainfall) and layer the
6-graph structure on top. Recharts children must each carry an explicit `key` (see
`memory/recharts-duplicate-key-null.md`).

---

## 1. Data layer (new + extended)

### New constants — `src/app/data/constants.ts`
- `MONSOON_ANIM_DAYS` — Jun 1 → Oct 31 window (~153 days) for the G3 animation (distinct from the
  existing Jun–Sep `MONSOON_DAYS`).
- `REGION_GROUPS` — `{ id: "N"|"S"|"E"|"W"|"C"; label; stateIds: string[] }[]` mapping existing
  `STATES` ids into North/South/East/West/Central for G6. Add `REGION_GROUP_BY_ID` lookup.
- `SST_EVENTS` — `[{ id:"2015", label:"Nov 2015 (El Niño)", oniAnom:+2.4 }, {id:"2020", label:"Nov 2020 (La Niña)", oniAnom:-1.2}, {id:"2023", label:"Nov 2023 (El Niño)", oniAnom:+1.9}]`.

### New file — `src/app/data/sstNino34.ts`
- `getNino34Grid(eventId, dataset: "ersst"|"oisst")` → `{ rows, cols, cells:{row,col,lat,lon,sst,anom}[] }`
  over the Niño 3.4 box (5°N–5°S, 170°W–120°W ≡ 190–240°E).
  - `ersst` = coarse 2° grid (~5×13 cells); `oisst` = fine 0.5° grid (~20×50 cells — visually dramatic
    contrast, still renderable as divs). *(0.25° would be ~8k cells → too heavy; 0.5° is the pragmatic
    substitute; noted as a deliberate deviation.)*
  - Base SST ≈ 26.8 °C + event `oniAnom` + `seededNoise("nino34", eventId, dataset, row, col)`. The
    fine grid adds higher-frequency eddy noise so the coarse grid reads as "smoother/more stable".
  - `anom` = sst − climatology(26.8) for the shared diverging RdBu scale.

### New file — `src/app/data/monsoonDaily.ts`
- `getStateDailySeason(year, regionId)` → `{ day, date, dayMm, cumMm, normalCumMm }[]` across
  `MONSOON_ANIM_DAYS`. Anchored to `getYearPhase`/`getYearOni`/`getMonsoonOnset` (delay by onset day)
  and per-state rainfall anomaly; for years ≤2015 bias toward `realData.stateMonthlyRainfall`, for
  >2015 (2020/2023) fall back to the seeded model so any year works.
- `getSeasonMapFrame(year, day, windowDays = 14)` → `Record<regionId, { cumMm, currentMm }>` for
  coloring the animated map at a frame (`currentMm` = trailing-window rainfall = "raining now").
- `dayLabelAnim(day)` frame label helper ("Jun 15 – Jun 30, YYYY" style, bi-weekly buckets).

### Extend `src/app/data/generators.ts`
- `getOniDerivation(range: [number,number])` → per month in the brushed range:
  `{ date, rawSst, climatology, anomaly, runningMean }`. `anomaly` from `getOniSeries()` (already real),
  `climatology` ≈ 26.8, `rawSst = climatology + anomaly + seededNoise`, `runningMean` = 3-month mean of
  anomaly (≈ the plotted ONI). Powers the "ONI Derivation Proof" chart.
- `getOniMonthYearMatrix(range)` → `{ years:number[], cells:{row,col,value}[] }` (row=year, col=month,
  value=ONI) for the seasonal-intensity heatmap in the drawer.
- `getStateOniCorrelation()` → `{ regionId, name, r, n }[]`: Pearson r between JJAS ONI (`getYearOni`)
  and each state's JJAS rainfall anomaly across `YEARS`. Reuse the Pearson math already in
  `getCorrelationMatrix`.
- `getStateOniScatter(regionId)` → `{ year, oni, anomaly, phase }[]` per year for the G5 scatter.
- `pValue(r, n)` helper — two-tailed t-approx `t = r*sqrt((n-2)/(1-r²))` → p (small rational approx).
- `getNdviOniSeries(groupId, year)` → `{ week, date, ndvi, oni }[]` over Kharif weeks: average member
  states via `getNdviByRegion`, map monthly ONI onto weeks. Used single- and dual-year (compare).
- `getRainfallAnomalyDetail(year)` → `Record<regionId,{pct,actualMm,lpaMm}>` for the G4 tooltip
  (extend the existing anomaly path in `realData`/generators).

---

## 2. Context & header

### `src/app/context/FilterContext.tsx`
- Add `compareMode: boolean` (default `false`) to `FilterState` + `toggleCompareMode(v?: boolean)`
  action/dispatcher. `year` = Year A, `compareYear` = Year B (both already exist).
- Everything else (brushRange, playbackDay, selectedRegionId, phase) is reused as-is.

### `src/app/components/DashboardHeader.tsx`
- Left: Year A + (when compare on) Year B selectors + ENSO phase (reuse sidebar's existing selects or
  mirror them). Center: title. Right: **⚡ Compare** toggle (`ui/switch` + label) bound to
  `compareMode`. Keep `GlobalFilterSidebar` as-is for the fuller filter set.

---

## 3. Components — one panel per graph (`src/app/components/graphs/`)

Reuse `PanelCard` (header + clipped body), `ViewSelect`, `GridHeatmap`. Each panel reads compare state
from context.

- **G1 `SstComparePanel.tsx`** — `SST_EVENTS` dropdown in header; body = two stacked `GridHeatmap`s
  (ERSST coarse top / OISST fine bottom) from `getNino34Grid`, **shared** diverging color range
  (`divergingScale` on `anom`), °C tooltips, one shared `ColorLegend`. *(True synced pan/zoom is out of
  scope for the div-based heatmap; note in-panel.)*

- **G2 `OniStripPanel.tsx`** — full-width diverging ONI area + `<Brush>` (adapt existing
  `TimelinePanel` logic). Brushing sets `brushRange`, which opens/updates the drawer.
  - **`OniDetailDrawer.tsx`** — `ui/sheet` from the right, containing three sub-charts:
    - `oni/PhaseDonut.tsx` (exists — reuse),
    - `oni/OniSeasonalMatrix.tsx` (new — `GridHeatmap` year×month from `getOniMonthYearMatrix`),
    - `oni/OniDerivationChart.tsx` (new — recharts 4-line: rawSst / climatology / anomaly / runningMean
      from `getOniDerivation`).

- **G3 (HERO) `MonsoonHeroPanel.tsx`** — the centerpiece.
  - **Extend `src/app/components/maps/IndiaChoropleth.tsx`**: add optional
    `patternById?: Record<string,"none"|"light"|"medium"|"heavy">`. Render `<defs>` with a dot pattern
    and diagonal-hatch patterns; overlay a second `<path>` per region filled with the chosen pattern.
    Backward compatible (no `patternById` → unchanged).
  - **`monsoon/RainfallAnimatedMap.tsx`** — for a given `year`, colors states by `cumMm` (sequential
    yellow→teal→blue) and sets `patternById` from `currentMm`, using `getSeasonMapFrame(year, playbackDay)`.
    Tooltip shows cumulative + current mm; in compare mode a Δ tooltip (`Year A vs Year B, Δ mm / %`).
  - **`monsoon/SeasonCumulativeChart.tsx`** — multi-line cumulative for the selected state with a
    `<ReferenceLine x={playbackDay}>`; compare mode adds the Year B line + dashed LPA.
  - **Extend `PlaybackControls`** with an optional `totalDays` prop (default `MONSOON_DAYS`) so G3 can
    animate the longer `MONSOON_ANIM_DAYS` window; keep existing speed options.
  - Compare mode → render **two** `RainfallAnimatedMap`s side by side (Year A / Year B), one shared
    `PlaybackControls`, synced `playbackDay`.

- **G4 `RainfallAnomalyPanel.tsx`** — static `IndiaChoropleth` colored by `rainfallScale` (brown↔green)
  from `getRainfallAnomalyDetail`; rich tooltip (actual/LPA/%). Compare mode → two mini choropleths
  (Year A / Year B).

- **G5 `OniRainfallStatsPanel.tsx`** — `ViewSelect` tab toggle Scatter / Heatmap.
  - `stats/OniRainfallScatter.tsx` — per-state ONI vs rainfall-anomaly scatter, OLS line (reuse
    `linearRegression`), Pearson r + p (`pValue`); state dropdown; compare mode highlights Year A/B dots.
  - `stats/StateSensitivityHeatmap.tsx` — states×r single-column `GridHeatmap` from
    `getStateOniCorrelation` (diverging); clicking a cell selects that state + switches to Scatter.

- **G6 `NdviOniPanel.tsx`** — dual-axis recharts line: NDVI (left, green) + ONI (right, shaded
  red/blue) from `getNdviOniSeries`; `REGION_GROUPS` dropdown + event toggle; Kharif window shaded.
  Compare mode overlays both years' NDVI lines.

---

## 4. Layout — `src/app/App.tsx` (T-shape, single viewport)

Replace the current 5-panel bento with the T-shape. `SidebarInset` stays `h-screen overflow-hidden`.
Main area = CSS grid, `grid-cols-12`, three rows sized to fit without page scroll, e.g.
`lg:grid-rows-[0.9fr_2.4fr_1.7fr]`:

- Row 1 (strip): **G2** `col-span-12`.
- Row 2 (hero band): **G1** `col-span-3` · **G3** `col-span-6` · **G4** `col-span-3`.
- Row 3 (bottom band): **G5** `col-span-3` · **G6** `col-span-9`.

`OniDetailDrawer` overlays (does not reflow) when `brushRange` is active.

**Cleanup:** remove the superseded `single/HeroMapPanel|TimelinePanel|OceanYearsPanel|RelationshipsPanel|VegetationPanel`
files once their logic is migrated into the `graphs/` panels; **keep** `single/PanelCard.tsx` and
`single/ViewSelect.tsx` (import from `graphs/` or leave in place).

---

## Critical files

| File | Change |
|---|---|
| `src/app/data/constants.ts` | `MONSOON_ANIM_DAYS`, `REGION_GROUPS`, `SST_EVENTS` |
| `src/app/data/sstNino34.ts` *(new)* | ERSST/OISST Niño-3.4 grids per event |
| `src/app/data/monsoonDaily.ts` *(new)* | per-state daily season + `getSeasonMapFrame` |
| `src/app/data/generators.ts` | ONI derivation, month×year matrix, state–ONI correlation/scatter, `pValue`, NDVI–ONI, anomaly detail |
| `src/app/context/FilterContext.tsx` | `compareMode` + `toggleCompareMode` |
| `src/app/components/DashboardHeader.tsx` | Year A/B, phase, ⚡ Compare toggle |
| `src/app/components/maps/IndiaChoropleth.tsx` | optional `patternById` hatch/dot overlay |
| `src/app/components/monsoon/PlaybackControls.tsx` | optional `totalDays` prop |
| `src/app/components/graphs/*` *(new)* | G1–G6 panels + sub-charts (`oni/`, `monsoon/`, `stats/` leaves) |
| `src/app/App.tsx` | T-shape grid; drawer overlay; remove old bento panels |

---

## Verification (preview only — do NOT run build/dev)

Auto-reload on the Figma Make preview surface, then confirm:
1. **Layout** fits one viewport, no page scroll; T-shape reads G2 strip → G1/G3/G4 → G5/G6.
2. **G1** shows coarse ERSST vs fine OISST with shared color range; event dropdown swaps 2015/2020/2023.
3. **G2** diverging area + brush; brushing opens the right drawer with donut + year×month heatmap +
   4-line derivation chart.
4. **G3** plays: fill color = cumulative, hatch/dot overlay = current-period rain; scrubber + speed
   work; embedded cumulative chart marker tracks the frame; clicking a state re-targets it.
5. **G4** static anomaly choropleth; tooltip shows actual/LPA/%.
6. **G5** scatter (r + p) ↔ state-sensitivity heatmap; clicking a heatmap cell drills into that state.
7. **G6** NDVI (left) vs ONI (right) dual-axis; region + event dropdowns work.
8. **⚡ Compare toggle** → G3/G4 split into Year A/B maps, G6 overlays both NDVI lines, G5 highlights
   both year markers; all stay in sync.
9. No console errors; recharts children all keyed (no "duplicate key null" warnings).
