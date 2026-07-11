import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { ColorLegend } from "../ColorLegend";
import { PhaseDonut } from "./PhaseDonut";
import { OniSeasonalMatrix } from "./OniSeasonalMatrix";
import { OniDerivationChart } from "./OniDerivationChart";

interface OniDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  range: [number, number];
  rangeLabel: string;
}

/** Slide-out ONI detail drawer opened by brushing the G2 strip. */
export function OniDetailDrawer({ open, onOpenChange, range, rangeLabel }: OniDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>ONI detail — brushed window</SheetTitle>
          <SheetDescription>{rangeLabel}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="flex flex-col gap-6 p-4">
            <section>
              <h3 className="mb-1">Phase distribution</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                Share of months in El Niño / La Niña / Neutral conditions within the window.
              </p>
              <PhaseDonut range={range} />
            </section>

            <section>
              <h3 className="mb-1">Seasonal intensity — month × year</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                ONI value for every month of each year in the window.
              </p>
              <OniSeasonalMatrix range={range} />
              <ColorLegend
                kind="diverging"
                domain={2.5}
                minLabel="La Niña"
                midLabel="neutral"
                maxLabel="El Niño"
                className="mt-3"
              />
            </section>

            <section>
              <h3 className="mb-1">ONI derivation proof</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                Raw SST minus climatology gives the anomaly; a 3-month running mean of the anomaly is
                the published ONI.
              </p>
              <OniDerivationChart range={range} />
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
