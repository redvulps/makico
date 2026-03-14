import { FilePlus2, FileType2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { IcoProjectDto } from '@shared/dto/iconProject';

interface IcoEntriesPanelProps {
  readonly project: IcoProjectDto;
  readonly selectedEntryId: string | null;
  readonly isUpdatingProject: boolean;
  readonly onSelectEntry: (entryId: string) => void;
  readonly onAddEntry: () => Promise<void>;
}

export function IcoEntriesPanel({
  project,
  selectedEntryId,
  isUpdatingProject,
  onSelectEntry,
  onAddEntry,
}: IcoEntriesPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge>Imported ICO</Badge>
            <CardTitle className="mt-3 text-2xl tracking-[-0.03em]">
              {project.entryCount} real entries loaded from disk
            </CardTitle>
            <CardDescription className="mt-2">
              Select an entry to inspect and edit it. New PNG entries append
              after the current selection so directory order stays explicit
              instead of hidden.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Button
              disabled={isUpdatingProject}
              onClick={() => void onAddEntry()}
              type="button"
              variant="outline"
            >
              {isUpdatingProject ? 'Working...' : 'Add PNG entry'}
              <FilePlus2 />
            </Button>
            <span className="hidden size-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary sm:flex">
              <FileType2 className="size-6" />
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.entries.map((entry) => {
          const isSelected = entry.id === selectedEntryId;

          return (
            <button
              key={entry.id}
              className={cn(
                'grid w-full gap-3 rounded-[1.5rem] border px-4 py-4 text-left transition-colors md:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))]',
                isSelected
                  ? 'border-primary/45 bg-primary/8 shadow-sm'
                  : 'border-border/70 bg-background/75 hover:border-primary/25 hover:bg-background/90',
              )}
              onClick={() => onSelectEntry(entry.id)}
              type="button"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Entry {entry.index + 1}
                  </p>
                  {isSelected ? (
                    <Badge variant="outline">Selected</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-foreground">
                  {entry.width} x {entry.height}px
                </p>
              </div>
              <Metric label="Payload" value={entry.payloadKind.toUpperCase()} />
              <Metric
                label="Bit depth"
                value={entry.bitCount ? `${entry.bitCount}-bit` : 'Unknown'}
              />
              <Metric label="Planes" value={String(entry.planes)} />
              <Metric label="Bytes" value={formatBytes(entry.bytesInRes)} />
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
