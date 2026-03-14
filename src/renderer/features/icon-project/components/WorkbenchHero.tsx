import { Download, FileCog, FolderUp, Layers3, ScanSearch } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IconProjectDto } from '@shared/dto/iconProject';
import type { WorkbenchSnapshotDto } from '@shared/dto/workbenchSnapshot';

interface WorkbenchHeroProps {
  readonly snapshot: WorkbenchSnapshotDto;
  readonly project: IconProjectDto | null;
  readonly selectedSummary: string | null;
  readonly importingFormat: 'ico' | 'icns' | null;
  readonly isExporting: boolean;
  readonly lastExportPath: string | null;
  readonly onImportIco: () => Promise<void>;
  readonly onImportIcns: () => Promise<void>;
  readonly onExportIco: () => Promise<void>;
  readonly onExportIcns: () => Promise<void>;
}

export function WorkbenchHero({
  snapshot,
  project,
  selectedSummary,
  importingFormat,
  isExporting,
  lastExportPath,
  onImportIco,
  onImportIcns,
  onExportIco,
  onExportIcns,
}: WorkbenchHeroProps) {
  const primaryHeadline = getPrimaryHeadline(project);
  const summary = getSummary(project, snapshot.summary);
  const isBusyImporting = importingFormat !== null;
  const canExportProject =
    project?.format === 'ico' ||
    (project?.format === 'icns' && project.canonicalExportSlotCount > 0);

  return (
    <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(15,90,79,0.12),rgba(255,255,255,0.88)_45%,rgba(201,115,53,0.12))]">
      <CardHeader className="gap-4 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Makico</Badge>
          <Badge variant="outline">
            {project
              ? project.format === 'ico'
                ? 'ICO editor slice online'
                : 'ICNS editor slice online'
              : snapshot.phaseLabel}
          </Badge>
          <Badge variant="muted">Electron + React + TypeScript</Badge>
          {project ? (
            <Badge variant={project.isDirty ? 'default' : 'outline'}>
              {project.isDirty ? 'Unsaved changes' : 'Saved state'}
            </Badge>
          ) : null}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <CardTitle className="max-w-3xl text-4xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              {primaryHeadline}
            </CardTitle>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {summary}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isBusyImporting || isExporting}
                onClick={() => void onImportIco()}
                type="button"
              >
                {importingFormat === 'ico' ? 'Importing ICO...' : 'Import ICO'}
                <FolderUp />
              </Button>
              <Button
                disabled={isBusyImporting || isExporting}
                onClick={() => void onImportIcns()}
                type="button"
                variant="outline"
              >
                {importingFormat === 'icns'
                  ? 'Importing ICNS...'
                  : 'Import ICNS'}
                <ScanSearch />
              </Button>
              <Button
                disabled={!canExportProject || isBusyImporting || isExporting}
                onClick={() => {
                  if (project?.format === 'icns') {
                    void onExportIcns();
                    return;
                  }

                  void onExportIco();
                }}
                type="button"
                variant="outline"
              >
                {getExportLabel(project, isExporting)}
                <Download />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 rounded-[2rem] border border-border/70 bg-background/70 p-5 shadow-inner">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground/90">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                {project ? (
                  <Layers3 className="size-5" />
                ) : (
                  <FileCog className="size-5" />
                )}
              </span>
              {project
                ? 'Current icon session'
                : 'First implementation checkpoint'}
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {project ? (
                <>
                  <p>
                    Source path:{' '}
                    {project.sourcePath ?? 'Imported from an in-memory source.'}
                  </p>
                  <p>
                    Selected asset:{' '}
                    {selectedSummary ?? 'No resource selected yet.'}
                  </p>
                  <p>
                    {lastExportPath
                      ? `Last export: ${lastExportPath}`
                      : project.format === 'ico'
                        ? 'No export written yet.'
                        : project.diagnostics.length > 0
                          ? `${project.diagnostics.length} ICNS diagnostics surfaced.`
                          : 'No ICNS diagnostics surfaced for this file.'}
                  </p>
                </>
              ) : (
                <>
                  <p>Typed IPC online.</p>
                  <p>Renderer shell online.</p>
                  <p>ICO editor and ICNS inspector tracks are separated.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pt-2">
        {snapshot.principles.map((principle) => (
          <Badge key={principle} variant="outline">
            {principle}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}

function getPrimaryHeadline(project: IconProjectDto | null): string {
  if (!project) {
    return 'Cross-platform icon editing starts with slot-aware container workflows, not a one-file demo.';
  }

  if (project.format === 'ico') {
    return `Loaded ${project.entryCount} ICO entries from ${project.name}`;
  }

  return `Loaded ${project.chunkCount} ICNS chunks from ${project.name}`;
}

function getSummary(
  project: IconProjectDto | null,
  fallbackSummary: string,
): string {
  if (!project) {
    return fallbackSummary;
  }

  if (project.format === 'ico') {
    return 'This ICO slice supports real editing flow: add PNG entries, reorder them explicitly, replace selected payloads, remove entries, discard changes, and export a rebuilt container through the dedicated writer.';
  }

  return 'This ICNS slice scans the big-endian chunk stream, maps semantic slot identities for modern Apple icon chunks, lets slot-mapped chunks be replaced with normalized PNG payloads, and exports a canonical PNG-backed ICNS file.';
}

function getExportLabel(
  project: IconProjectDto | null,
  isExporting: boolean,
): string {
  if (isExporting) {
    return project?.format === 'icns'
      ? 'Exporting ICNS...'
      : 'Exporting ICO...';
  }

  if (project?.format === 'ico') {
    return project.isDirty ? 'Save changes as ICO' : 'Export ICO';
  }

  if (project?.format === 'icns') {
    return project.isDirty ? 'Save canonical ICNS' : 'Export canonical ICNS';
  }

  return 'Export';
}
