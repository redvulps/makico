import { ScanSearch } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { IcnsProjectDto } from '@shared/dto/iconProject';

interface IcnsChunksPanelProps {
  readonly project: IcnsProjectDto;
  readonly selectedChunkId: string | null;
  readonly onSelectChunk: (chunkId: string) => void;
}

export function IcnsChunksPanel({
  project,
  selectedChunkId,
  onSelectChunk,
}: IcnsChunksPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge>Imported ICNS</Badge>
            <CardTitle className="mt-3 text-2xl tracking-[-0.03em]">
              {project.chunkCount} scanned chunks with{' '}
              {project.supportedSlotCount} supported PNG-backed slots
            </CardTitle>
            <CardDescription className="mt-2">
              Select a chunk to inspect its semantic slot mapping, payload
              family, and preview availability. Unsupported families stay
              visible instead of being dropped.
            </CardDescription>
          </div>
          <span className="hidden size-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary sm:flex">
            <ScanSearch className="size-6" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.chunks.map((chunk) => {
          const isSelected = chunk.id === selectedChunkId;

          return (
            <button
              key={chunk.id}
              className={cn(
                'grid w-full gap-3 rounded-[1.5rem] border px-4 py-4 text-left transition-colors md:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.85fr))]',
                isSelected
                  ? 'border-primary/45 bg-primary/8 shadow-sm'
                  : 'border-border/70 bg-background/75 hover:border-primary/25 hover:bg-background/90',
              )}
              onClick={() => onSelectChunk(chunk.id)}
              type="button"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Chunk {chunk.index + 1}
                  </p>
                  <Badge variant="outline">{chunk.type}</Badge>
                  {isSelected ? (
                    <Badge variant="outline">Selected</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-foreground">
                  {chunk.slot ? chunk.slot.label : 'No slot mapping'}
                </p>
              </div>
              <Metric label="Family" value={chunk.payloadFamily} />
              <Metric
                label="Pixels"
                value={
                  chunk.slot
                    ? `${chunk.slot.pixelWidth} x ${chunk.slot.pixelHeight}`
                    : 'N/A'
                }
              />
              <Metric
                label="State"
                value={chunk.isSupported ? 'Supported' : 'Inspect only'}
              />
              <Metric label="Bytes" value={formatBytes(chunk.byteLength)} />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface MetricProps {
  readonly label: string;
  readonly value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  return `${(value / 1024).toFixed(1)} KB`;
}
