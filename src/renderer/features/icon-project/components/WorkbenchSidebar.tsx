import type { ComponentType } from 'react';

import {
  AppWindow,
  Binary,
  CheckCircle2,
  Cpu,
  FolderTree,
  Orbit,
  Save,
  ScanSearch,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AppInfoDto } from '@shared/dto/appInfo';
import type { IconProjectDto } from '@shared/dto/iconProject';
import type { WorkbenchSnapshotDto } from '@shared/dto/workbenchSnapshot';

interface WorkbenchSidebarProps {
  readonly appInfo: AppInfoDto;
  readonly snapshot: WorkbenchSnapshotDto;
  readonly project: IconProjectDto | null;
  readonly selectedSummary: string | null;
  readonly lastExportPath: string | null;
}

export function WorkbenchSidebar({
  appInfo,
  snapshot,
  project,
  selectedSummary,
  lastExportPath,
}: WorkbenchSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Badge>Runtime</Badge>
          <CardTitle className="text-2xl tracking-[-0.03em]">
            Process boundary check
          </CardTitle>
          <CardDescription>
            Renderer stays presentation-only. Main owns desktop lifecycle.
            Preload exposes a narrow typed bridge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            <SidebarMetric icon={AppWindow} label="App" value={appInfo.name} />
            <SidebarMetric
              icon={Orbit}
              label="Platform"
              value={appInfo.platform}
            />
            <SidebarMetric
              icon={Binary}
              label="Electron"
              value={appInfo.versions.electron}
            />
            <SidebarMetric
              icon={Cpu}
              label="Node"
              value={appInfo.versions.node}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant={project ? 'default' : 'muted'}>
            {project
              ? project.format === 'ico'
                ? 'Active ICO project'
                : 'Active ICNS project'
              : 'Project status'}
          </Badge>
          <CardTitle className="text-xl tracking-[-0.03em]">
            {project ? project.name : 'No icon file imported yet'}
          </CardTitle>
          <CardDescription>
            {project
              ? project.format === 'ico'
                ? 'The current ICO session keeps a saved baseline and a working entry set in main-process memory so reset and dirty-state stay reliable.'
                : 'The current ICNS session keeps a saved baseline and a working chunk set in main-process memory so slot replacement, reset, and canonical export stay reliable.'
              : 'Import an ICO or ICNS file to populate the workbench with real container data and previews.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {project ? (
            <>
              <SidebarDetail
                icon={FolderTree}
                label="Source"
                value={project.sourcePath ?? 'Session-only import'}
              />
              <SidebarDetail
                icon={Binary}
                label={project.format === 'ico' ? 'Entries' : 'Chunks'}
                value={
                  project.format === 'ico'
                    ? String(project.entryCount)
                    : String(project.chunkCount)
                }
              />
              <SidebarDetail
                icon={CheckCircle2}
                label="State"
                value={project.isDirty ? 'Unsaved changes' : 'Saved'}
              />
              <SidebarDetail
                icon={Save}
                label="Last export"
                value={lastExportPath ?? 'No export yet'}
              />
              {project.format === 'icns' ? (
                <SidebarDetail
                  icon={ScanSearch}
                  label="Diagnostics"
                  value={
                    project.diagnostics.length > 0
                      ? `${project.diagnostics.length} surfaced`
                      : 'None'
                  }
                />
              ) : null}
              <SidebarDetail
                label="Selected"
                value={selectedSummary ?? 'No resource selected'}
              />
            </>
          ) : (
            <p>
              Use the import actions in the header to load a real ICO or ICNS
              container.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="muted">Next</Badge>
          <CardTitle className="text-xl tracking-[-0.03em]">
            Implementation slices
          </CardTitle>
          <CardDescription>
            The next passes stay format-specific and avoid collapsing parsing,
            validation, and export into a single service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {snapshot.nextSlices.map((slice, index) => (
              <li key={slice} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{slice}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

interface SidebarMetricProps {
  readonly icon: ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
}

function SidebarMetric({ icon: Icon, label, value }: SidebarMetricProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface SidebarDetailProps {
  readonly icon?: ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
}

function SidebarDetail({ icon: Icon, label, value }: SidebarDetailProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      {Icon ? (
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 break-all text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
