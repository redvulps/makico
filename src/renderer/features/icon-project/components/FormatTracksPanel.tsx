import { Binary, Layers3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { FormatTrackDto } from '@shared/dto/workbenchSnapshot';

interface FormatTracksPanelProps {
  readonly formatTracks: readonly FormatTrackDto[];
}

export function FormatTracksPanel({ formatTracks }: FormatTracksPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Badge>Format architecture</Badge>
        <CardTitle className="text-2xl tracking-[-0.03em]">
          Dedicated codec tracks
        </CardTitle>
        <CardDescription>
          Both containers are first-class citizens, but their parsing and export
          responsibilities stay isolated.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2">
        {formatTracks.map((track) => {
          const Icon = track.format === 'ico' ? Binary : Layers3;

          return (
            <div
              key={track.format}
              className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {track.format}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                    {track.title}
                  </h3>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mb-4 text-sm leading-6 text-muted-foreground">
                {track.emphasis}
              </p>
              <ul className="space-y-3 text-sm text-foreground/88">
                {track.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                {track.exportTargets.map((target) => (
                  <Badge key={target} variant="outline">
                    {target}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
