import { PanelRightOpen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { buttonVariants } from "../ui/button";
import { cn } from "../ui/utils";
import { ColorLegend } from "../ColorLegend";
import { PhaseDonut } from "./PhaseDonut";
import { SeasonalHeatmap } from "./SeasonalHeatmap";

interface OniDetailSheetProps {
  range: [number, number];
  rangeLabel: string;
  focusYear: number;
}

export function OniDetailSheet({ range, rangeLabel, focusYear }: OniDetailSheetProps) {
  return (
    <Sheet>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
        <PanelRightOpen className="size-3.5" />
        Details
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Details on demand</SheetTitle>
          <SheetDescription>{rangeLabel}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="flex flex-col gap-6 p-4">
            <section>
              <h3 className="mb-1">Phase distribution</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                Share of months in El Niño / La Niña / Neutral conditions within the brushed window.
              </p>
              <PhaseDonut range={range} />
            </section>

            <section>
              <h3 className="mb-1">Seasonal rainfall heatmap — {focusYear}</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                Month × region rainfall anomaly for the focus year.
              </p>
              <SeasonalHeatmap year={focusYear} />
              <ColorLegend
                kind="rainfall"
                domain={40}
                minLabel="drier"
                midLabel="normal"
                maxLabel="wetter"
                className="mt-3"
              />
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
