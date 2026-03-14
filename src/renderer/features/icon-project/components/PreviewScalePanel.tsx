import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PreviewScalePanelProps {
  readonly previewSizes: readonly number[];
  readonly pipeline: readonly string[];
}

export function PreviewScalePanel({
  previewSizes,
  pipeline,
}: PreviewScalePanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Badge variant="muted">Preview grid</Badge>
        <CardTitle className="text-2xl tracking-[-0.03em]">
          Canonical size field
        </CardTitle>
        <CardDescription>
          The first renderer pass visualizes the shared size ladder the future
          codecs will populate with real decoded assets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {previewSizes.map((size) => (
            <div
              key={size}
              className="rounded-[1.5rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(237,231,221,0.92))] p-3 text-center shadow-sm"
            >
              <div className="mx-auto flex aspect-square items-center justify-center rounded-[1rem] border border-dashed border-primary/25 bg-primary/5 text-xs font-semibold text-primary">
                {size}
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {size}px
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.75rem] border border-border/70 bg-background/75 p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Processing pipeline
          </p>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {pipeline.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
