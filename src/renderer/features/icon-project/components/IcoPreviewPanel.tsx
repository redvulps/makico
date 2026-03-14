import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  RefreshCcw,
  Replace,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { IcoEntryDto, IcoProjectDto } from '@shared/dto/iconProject';

interface IcoPreviewPanelProps {
  readonly project: IcoProjectDto;
  readonly selectedEntry: IcoEntryDto | null;
  readonly isUpdatingProject: boolean;
  readonly onMoveSelectedEntryUp: () => Promise<void>;
  readonly onMoveSelectedEntryDown: () => Promise<void>;
  readonly onReplaceSelectedEntry: () => Promise<void>;
  readonly onRemoveSelectedEntry: () => Promise<void>;
  readonly onResetProject: () => Promise<void>;
}

export function IcoPreviewPanel({
  project,
  selectedEntry,
  isUpdatingProject,
  onMoveSelectedEntryUp,
  onMoveSelectedEntryDown,
  onReplaceSelectedEntry,
  onRemoveSelectedEntry,
  onResetProject,
}: IcoPreviewPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="muted">Preview + edit</Badge>
            <CardTitle className="mt-3 text-2xl tracking-[-0.03em]">
              Selected entry editor
            </CardTitle>
            <CardDescription className="mt-2">
              Replacement, insertion order, removal, and reset all act on the
              main-process working session while the renderer stays state-light.
            </CardDescription>
          </div>
          <span className="hidden size-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary sm:flex">
            <ImageIcon className="size-6" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {selectedEntry ? (
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-border/70 bg-background/75 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge>
                  {selectedEntry.width} x {selectedEntry.height}
                </Badge>
                <Badge variant="outline">
                  {selectedEntry.payloadKind.toUpperCase()}
                </Badge>
                <Badge variant="muted">
                  {selectedEntry.bitCount
                    ? `${selectedEntry.bitCount}-bit`
                    : 'Unknown depth'}
                </Badge>
              </div>
              <div className="flex aspect-square items-center justify-center rounded-[1.5rem] border border-dashed border-primary/20 bg-primary/5 p-5">
                {selectedEntry.previewDataUrl ? (
                  <img
                    alt={`${selectedEntry.width} by ${selectedEntry.height} ICO entry`}
                    className="max-h-full max-w-full object-contain"
                    src={selectedEntry.previewDataUrl}
                  />
                ) : (
                  <div className="text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Preview unavailable
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PreviewMetric
                  label="Color count"
                  value={
                    selectedEntry.colorCount
                      ? String(selectedEntry.colorCount)
                      : 'Derived'
                  }
                />
                <PreviewMetric
                  label="Planes"
                  value={String(selectedEntry.planes)}
                />
                <PreviewMetric
                  label="Bytes"
                  value={formatBytes(selectedEntry.bytesInRes)}
                />
                <PreviewMetric
                  label="Project state"
                  value={project.isDirty ? 'Unsaved changes' : 'Saved'}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isUpdatingProject || selectedEntry.index <= 0}
                onClick={() => void onMoveSelectedEntryUp()}
                type="button"
                variant="outline"
              >
                Move earlier
                <ArrowUp />
              </Button>
              <Button
                disabled={
                  isUpdatingProject ||
                  selectedEntry.index >= project.entryCount - 1
                }
                onClick={() => void onMoveSelectedEntryDown()}
                type="button"
                variant="outline"
              >
                Move later
                <ArrowDown />
              </Button>
              <Button
                disabled={isUpdatingProject}
                onClick={() => void onReplaceSelectedEntry()}
                type="button"
              >
                {isUpdatingProject ? 'Working...' : 'Replace with PNG'}
                <Replace />
              </Button>
              <Button
                disabled={isUpdatingProject || project.entryCount <= 1}
                onClick={() => void onRemoveSelectedEntry()}
                type="button"
                variant="outline"
              >
                Remove entry
                <Trash2 />
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
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-border/70 bg-background/75 p-6 text-sm text-muted-foreground">
            Select an ICO entry to preview and edit it.
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

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  return `${(value / 1024).toFixed(1)} KB`;
}
