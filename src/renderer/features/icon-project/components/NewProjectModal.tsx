import { FileImage, ImagePlus, Layers3 } from 'lucide-react';

import { WorkbenchModalShell } from './WorkbenchModalShell';

interface NewProjectModalProps {
  readonly isBusy: boolean;
  readonly onClose: () => void;
  readonly onCreateIcoProject: () => Promise<void>;
  readonly onCreateIcnsProject: () => Promise<void>;
  readonly onCreateIcoFromImage: () => Promise<void>;
  readonly onCreateIcnsFromImage: () => Promise<void>;
}

export function NewProjectModal({
  isBusy,
  onClose,
  onCreateIcoProject,
  onCreateIcnsProject,
  onCreateIcoFromImage,
  onCreateIcnsFromImage,
}: NewProjectModalProps) {
  return (
    <WorkbenchModalShell onClose={onClose} title="New Project">
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <ProjectCard
          description="Pick a source PNG and auto-generate all standard ICO sizes (16 to 256)."
          icon={ImagePlus}
          isBusy={isBusy}
          label="New ICO from image"
          onClick={() => void onCreateIcoFromImage()}
        />
        <ProjectCard
          description="Pick a source PNG and auto-generate all canonical ICNS slots."
          icon={ImagePlus}
          isBusy={isBusy}
          label="New ICNS from image"
          onClick={() => void onCreateIcnsFromImage()}
        />
        <ProjectCard
          description="Start with an empty Windows icon container and add PNG entries manually."
          icon={FileImage}
          isBusy={isBusy}
          label="Empty ICO project"
          onClick={() => void onCreateIcoProject()}
        />
        <ProjectCard
          description="Start with an empty Apple icon container and build canonical slot coverage step by step."
          icon={Layers3}
          isBusy={isBusy}
          label="Empty ICNS project"
          onClick={() => void onCreateIcnsProject()}
        />
      </div>
    </WorkbenchModalShell>
  );
}

function ProjectCard({
  label,
  description,
  onClick,
  isBusy,
  icon: Icon,
}: {
  readonly label: string;
  readonly description: string;
  readonly onClick: () => void;
  readonly isBusy: boolean;
  readonly icon: typeof FileImage;
}) {
  return (
    <button
      className="flex min-h-52 flex-col items-start rounded-xl border border-border bg-muted p-5 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-55"
      disabled={isBusy}
      onClick={onClick}
      type="button"
    >
      <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-5 text-xl font-semibold tracking-[-0.04em] text-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </button>
  );
}
