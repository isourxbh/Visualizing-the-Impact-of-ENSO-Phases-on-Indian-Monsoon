import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Card } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";

interface PanelCardProps {
  title: ReactNode;
  info?: string;
  /** Right-aligned controls in the header, e.g. a view dropdown. */
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * A card that fills its grid cell: fixed header row + a flex-1 body that clips
 * its overflow so the whole dashboard fits one screen without page scrolling.
 */
export function PanelCard({ title, info, actions, className, bodyClassName, children }: PanelCardProps) {
  return (
    <Card className={cn("flex h-full min-h-0 min-w-0 flex-col gap-0 overflow-hidden py-0", className)}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium">{title}</span>
          {info ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  aria-label="More info"
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{info}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn("min-h-0 flex-1 overflow-hidden p-2", bodyClassName)}>{children}</div>
    </Card>
  );
}
