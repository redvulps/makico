import { Grid2X2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { IcnsProjectDto } from '@shared/dto/iconProject';
import type { IcnsSlotDto } from '@shared/dto/workbenchSnapshot';

interface SlotMatrixPanelProps {
  readonly icnsSlots: readonly IcnsSlotDto[];
  readonly project?: IcnsProjectDto | null;
  readonly isUpdatingProject?: boolean;
  readonly onAddMissingSlot?: (chunkType: string) => Promise<void>;
}

export function SlotMatrixPanel({
  icnsSlots,
  project = null,
  isUpdatingProject = false,
  onAddMissingSlot,
}: SlotMatrixPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge>ICNS slot matrix</Badge>
            <CardTitle className="mt-3 text-2xl tracking-[-0.03em]">
              Semantic slots stay visible
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl">
              Same pixel dimensions can map to different macOS semantic slots,
              so the workbench keeps slot identity explicit before export.
            </CardDescription>
          </div>
          <span className="hidden size-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary sm:flex">
            <Grid2X2 className="size-6" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {icnsSlots.map((slot) => {
            const matchingChunk =
              project?.chunks.find(
                (chunk) => chunk.slot?.chunkType === slot.chunkType,
              ) ?? null;
            const status = matchingChunk
              ? matchingChunk.isSupported
                ? 'Ready'
                : 'Needs PNG'
              : 'Missing';

            return (
              <div
                key={slot.chunkType}
                className="rounded-[1.5rem] border border-border/70 bg-background/80 px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {slot.chunkType}
                    </p>
                    <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-foreground">
                      {slot.label}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(status)}>
                    {status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {slot.pixels}px payload
                </p>
                {status === 'Missing' && project && onAddMissingSlot ? (
                  <Button
                    className="mt-4 w-full"
                    disabled={isUpdatingProject}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void onAddMissingSlot(slot.chunkType);
                    }}
                  >
                    Add slot from PNG
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadgeVariant(
  status: 'Ready' | 'Needs PNG' | 'Missing',
): 'default' | 'muted' | 'outline' {
  switch (status) {
    case 'Ready':
      return 'default';
    case 'Needs PNG':
      return 'muted';
    default:
      return 'outline';
  }
}
