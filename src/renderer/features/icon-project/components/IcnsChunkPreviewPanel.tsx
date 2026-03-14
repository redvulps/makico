import { ImageIcon, Layers3, RefreshCcw, Replace } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { IcnsChunkDto, IcnsProjectDto } from '@shared/dto/iconProject';

interface IcnsChunkPreviewPanelProps {
  readonly project: IcnsProjectDto;
  readonly selectedChunk: IcnsChunkDto | null;
  readonly isUpdatingProject: boolean;
  readonly onReplaceSelectedChunk: () => Promise<void>;
  readonly onResetProject: () => Promise<void>;
}

export function IcnsChunkPreviewPanel({
  project,
  selectedChunk,
  isUpdatingProject,
  onReplaceSelectedChunk,
  onResetProject,
}: IcnsChunkPreviewPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="muted">Preview + diagnostics</Badge>
            <CardTitle className="mt-3 text-2xl tracking-[-0.03em]">
              Selected ICNS chunk inspector
            </CardTitle>
            <CardDescription className="mt-2">
              Slot-mapped chunks can now be replaced with normalized PNG inputs.
              JPEG 2000, legacy RGB, ARGB, mask, and unknown families still stay
              visible with explicit notes.
            </CardDescription>
          </div>
          <span className="hidden size-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary sm:flex">
            <ImageIcon className="size-6" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {selectedChunk ? (
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-border/70 bg-background/75 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge>{selectedChunk.type}</Badge>
                <Badge variant="outline">{selectedChunk.payloadFamily}</Badge>
                <Badge
                  variant={selectedChunk.isSupported ? 'default' : 'muted'}
                >
                  {selectedChunk.isSupported ? 'Supported' : 'Inspect only'}
                </Badge>
              </div>
              <div className="flex aspect-square items-center justify-center rounded-[1.5rem] border border-dashed border-primary/20 bg-primary/5 p-5">
                {selectedChunk.previewDataUrl ? (
                  <img
                    alt={`ICNS chunk ${selectedChunk.type}`}
                    className="max-h-full max-w-full object-contain"
                    src={selectedChunk.previewDataUrl}
                  />
                ) : (
                  <div className="space-y-2 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <div>Preview unavailable</div>
                    <div>{selectedChunk.payloadFamily}</div>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PreviewMetric
                  label="Slot"
                  value={selectedChunk.slot?.label ?? 'No slot mapping'}
                />
                <PreviewMetric
                  label="Pixels"
                  value={
                    selectedChunk.slot
                      ? `${selectedChunk.slot.pixelWidth} x ${selectedChunk.slot.pixelHeight}`
                      : 'N/A'
                  }
                />
                <PreviewMetric
                  label="Offset"
                  value={`0x${selectedChunk.offset.toString(16).toUpperCase()}`}
                />
                <PreviewMetric
                  label="Chunk bytes"
                  value={formatBytes(selectedChunk.byteLength)}
                />
                <PreviewMetric
                  label="Project state"
                  value={project.isDirty ? 'Unsaved changes' : 'Saved'}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isUpdatingProject || !selectedChunk.slot}
                onClick={() => void onReplaceSelectedChunk()}
                type="button"
              >
                {isUpdatingProject ? 'Working...' : 'Replace slot with PNG'}
                <Replace />
              </Button>
              <Button
                disabled={isUpdatingProject || !project.isDirty}
                onClick={() => void onResetProject()}
                type="button"
                variant="ghost"
              >
                Discard changes
                <RefreshCcw />
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <InfoCard
                icon={Layers3}
                title="Semantic mapping"
                body={
                  selectedChunk.slot
                    ? selectedChunk.slot.isCanonical
                      ? `Mapped to ${selectedChunk.slot.label} (${selectedChunk.slot.chunkType}), which is part of the canonical Apple app icon set.`
                      : `Mapped to ${selectedChunk.slot.label} (${selectedChunk.slot.chunkType}), which is recognized but outside the canonical Apple app icon set.`
                    : 'This chunk does not map to a known semantic ICNS slot yet.'
                }
              />
              <InfoCard
                icon={ImageIcon}
                title="Chunk note"
                body={
                  selectedChunk.note ??
                  'This chunk is supported in the current ICNS import slice.'
                }
              />
            </div>

            {project.diagnostics.length > 0 ? (
              <div className="rounded-[1.5rem] border border-border/70 bg-background/75 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  File diagnostics
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {project.diagnostics.map((diagnostic) => (
                    <li key={diagnostic}>{diagnostic}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-border/70 bg-background/75 p-6 text-sm text-muted-foreground">
            Select an ICNS chunk to inspect its preview and diagnostics.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PreviewMetricProps {
  readonly label: string;
  readonly value: string;
}

function PreviewMetric({ label, value }: PreviewMetricProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

interface InfoCardProps {
  readonly icon: typeof ImageIcon;
  readonly title: string;
  readonly body: string;
}

function InfoCard({ icon: Icon, title, body }: InfoCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/75 p-5">
      <div className="flex items-center gap-3 text-sm font-medium text-foreground">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        {title}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  return `${(value / 1024).toFixed(1)} KB`;
}
