import { useFilters } from "../../context/FilterContext";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { useData } from "../../context/DataProvider";
import { ChartCard } from "../ChartCard";
import { Card, CardContent } from "../ui/card";

import { NdviMacroChart } from "../agri/NdviMacroChart";
import { RegionalNdviLines } from "../agri/RegionalNdviLines";

export function AgricultureModule() {
  const { state } = useFilters();
  const { getYearPhase } = useData();
  const { year, selectedRegionId } = state;
  const phase = getYearPhase(year);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="text-muted-foreground py-3 text-sm">
          The Kharif crop cycle (sown with the monsoon, harvested in autumn) lives or dies by
          rainfall. In a <strong>{phase}</strong> year like <strong>{year}</strong>, watch how the
          national NDVI greening curve tracks — and lags — cumulative rainfall, and how individual
          states diverge.
          {selectedRegionId ? (
            <>
              {" "}
              <strong>{STATE_NAME_BY_ID[selectedRegionId]}</strong> is highlighted below.
            </>
          ) : (
            " Select a state on any map to highlight it below."
          )}
        </CardContent>
      </Card>

      <ChartCard
        title={`National vegetation vs. rainfall — Kharif ${year}`}
        description="Dual-axis: NDVI greening (line) against weekly rainfall (bars)"
        info="NDVI (Normalized Difference Vegetation Index) proxies crop canopy greenness. It responds to rainfall with a ~3-week lag as crops establish."
      >
        <NdviMacroChart year={year} />
      </ChartCard>

      <ChartCard
        title={`Regional NDVI anomaly — Kharif ${year}`}
        description="Vegetation stress relative to normal across key crop states"
        info="Positive = greener than normal, negative = vegetation stress. Drier El Niño years push major belts into negative anomaly. The selected state is emphasized."
      >
        <RegionalNdviLines year={year} selectedRegionId={selectedRegionId} />
      </ChartCard>
    </div>
  );
}
