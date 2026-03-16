import { useEffect, useRef, useState } from 'react';

import { ArrowDown, ArrowUp, CirclePlus, MoreHorizontal, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { IcnsProjectDto, IconProjectDto } from '@shared/dto/iconProject';
import type { IcnsSlotDto } from '@shared/dto/workbenchSnapshot';

interface WorkbenchResourceRailProps {
  readonly project: IconProjectDto | null;
  readonly previewSizes: readonly number[];
  readonly icnsSlots: readonly IcnsSlotDto[];
  readonly selectedResourceId: string | null;
  readonly isUpdatingProject: boolean;
  readonly onSelectResource: (resourceId: string) => void;
  readonly onMoveSelectedIcoEntryUp: () => Promise<void>;
  readonly onMoveSelectedIcoEntryDown: () => Promise<void>;
  readonly onRemoveSelectedIcoEntry: () => Promise<void>;
  readonly onRemoveSelectedIcnsChunk: () => Promise<void>;
  readonly onAddIcoEntry: () => Promise<void>;
  readonly onAddBlankIcoEntry: (size: number) => Promise<void>;
  readonly onAddIcnsSlot: (chunkType: string) => Promise<void>;
  readonly onAddBlankIcnsSlot: (chunkType: string) => Promise<void>;
}

export function WorkbenchResourceRail({
  project,
  previewSizes,
  icnsSlots,
  selectedResourceId,
  isUpdatingProject,
  onSelectResource,
  onMoveSelectedIcoEntryUp,
  onMoveSelectedIcoEntryDown,
  onRemoveSelectedIcoEntry,
  onRemoveSelectedIcnsChunk,
  onAddIcoEntry,
  onAddBlankIcoEntry,
  onAddIcnsSlot,
  onAddBlankIcnsSlot,
}: WorkbenchResourceRailProps) {
  const resources = getResourceItems(project);
  const icoProject = project?.format === 'ico' ? project : null;
  const icoEntryCount = icoProject?.entryCount ?? 0;
  const selectedResource =
    resources.find((resource) => resource.id === selectedResourceId) ?? null;
  const [openMenuResourceId, setOpenMenuResourceId] = useState<string | null>(
    null,
  );
  const openMenuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuResourceId) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (openMenuContainerRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpenMenuResourceId(null);
    }

    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openMenuResourceId]);

  useEffect(() => {
    if (!openMenuResourceId || !project) {
      return;
    }

    const resourceStillExists =
      project.format === 'ico'
        ? project.entries.some((entry) => entry.id === openMenuResourceId)
        : project.chunks.some((chunk) => chunk.id === openMenuResourceId);

    if (!resourceStillExists) {
      setOpenMenuResourceId(null);
    }
  }, [openMenuResourceId, project]);

  return (
    <aside className="flex min-h-0 flex-col border-r border-border/80 bg-muted">
      <div className="border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {project
          ? project.format === 'ico'
            ? 'ICO entries'
            : 'ICNS chunks'
          : 'Preview ladder'}
      </div>
      {project && selectedResource ? (
        <div className="border-b border-border/50 bg-secondary px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-foreground">
                {selectedResource.label}
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {selectedResource.meta}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {selectedResource.kind === 'ico' ? (
                <>
                  <RailActionButton
                    ariaLabel="Move selected entry earlier"
                    disabled={isUpdatingProject || selectedResource.index <= 0}
                    icon={ArrowUp}
                    onClick={() => void onMoveSelectedIcoEntryUp()}
                  />
                  <RailActionButton
                    ariaLabel="Move selected entry later"
                    disabled={
                      isUpdatingProject ||
                      selectedResource.index >= icoEntryCount - 1
                    }
                    icon={ArrowDown}
                    onClick={() => void onMoveSelectedIcoEntryDown()}
                  />
                </>
              ) : null}
              <RailActionButton
                ariaLabel={
                  selectedResource.kind === 'ico'
                    ? 'Remove selected entry'
                    : 'Remove selected chunk'
                }
                disabled={
                  isUpdatingProject ||
                  (selectedResource.kind === 'ico' ? icoEntryCount <= 1 : false)
                }
                icon={Trash2}
                onClick={() =>
                  void (selectedResource.kind === 'ico'
                    ? onRemoveSelectedIcoEntry()
                    : onRemoveSelectedIcnsChunk())
                }
              />
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex-1 space-y-2 overflow-auto px-3 py-3">
        {project && resources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary px-3 py-4 text-xs leading-5 text-muted-foreground">
            {project.format === 'ico'
              ? 'No ICO entries yet. Use the toolbox to create a blank bitmap or import the first PNG entry.'
              : 'No ICNS chunks yet. Create a blank canonical slot or import one from the toolbox to start drawing.'}
          </div>
        ) : project ? (
          resources.map((resource) => {
            const isSelected = resource.id === selectedResourceId;
            const isIcoResource = resource.kind === 'ico';
            const isMenuOpen = openMenuResourceId === resource.id;
            const canOpenMenu = isSelected;

            return (
              <div
                key={resource.id}
                className="relative"
                onContextMenu={(event) => {
                  event.preventDefault();
                  onSelectResource(resource.id);
                  setOpenMenuResourceId(resource.id);
                }}
                ref={isMenuOpen ? openMenuContainerRef : null}
              >
                <button
                  className={cn(
                    'flex w-full items-center gap-3 pr-9 text-left transition-colors',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                  )}
                  onClick={() => {
                    setOpenMenuResourceId(null);
                    onSelectResource(resource.id);
                  }}
                  type="button"
                >
                  <div
                    className={cn(
                      'flex size-[52px] shrink-0 items-center justify-center border border-border bg-background text-xs text-muted-foreground',
                      isSelected ? 'ring-2 ring-primary/50' : null,
                    )}
                  >
                    {resource.previewDataUrl ? (
                      <img
                        alt={resource.label}
                        className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
                        src={resource.previewDataUrl}
                      />
                    ) : (
                      <span className="px-1 text-center text-[10px] leading-3">
                        Preview
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight tracking-[-0.02em]">
                      {resource.label}
                    </p>
                    <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {resource.meta}
                    </p>
                  </div>
                </button>

                {canOpenMenu ? (
                  <button
                    aria-label="Open entry actions"
                    className={cn(
                      'absolute top-1 right-0 flex size-7 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground transition-colors',
                      isUpdatingProject
                        ? 'cursor-not-allowed opacity-55'
                        : 'hover:bg-accent',
                    )}
                    disabled={isUpdatingProject}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuResourceId((currentValue) => {
                        return currentValue === resource.id
                          ? null
                          : resource.id;
                      });
                    }}
                    type="button"
                  >
                    <MoreHorizontal className="size-3" />
                  </button>
                ) : null}

                {isMenuOpen ? (
                  <div className="absolute top-1 right-9 z-20 w-44 rounded-xl border border-border/80 bg-card p-1 shadow-lg">
                    {isIcoResource ? (
                      <>
                        <ResourceMenuButton
                          disabled={isUpdatingProject || resource.index <= 0}
                          icon={ArrowUp}
                          label="Move earlier"
                          onClick={() =>
                            handleMenuAction(
                              setOpenMenuResourceId,
                              onMoveSelectedIcoEntryUp,
                            )
                          }
                        />
                        <ResourceMenuButton
                          disabled={
                            isUpdatingProject ||
                            resource.index >= icoEntryCount - 1
                          }
                          icon={ArrowDown}
                          label="Move later"
                          onClick={() =>
                            handleMenuAction(
                              setOpenMenuResourceId,
                              onMoveSelectedIcoEntryDown,
                            )
                          }
                        />
                        <div className="my-1 border-t border-border" />
                      </>
                    ) : null}
                    <ResourceMenuButton
                      disabled={
                        isUpdatingProject ||
                        (isIcoResource ? icoEntryCount <= 1 : false)
                      }
                      icon={Trash2}
                      label={isIcoResource ? 'Remove entry' : 'Remove chunk'}
                      onClick={() =>
                        handleMenuAction(
                          setOpenMenuResourceId,
                          isIcoResource
                            ? onRemoveSelectedIcoEntry
                            : onRemoveSelectedIcnsChunk,
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        ) : !project ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Open or create a project to populate entries.
          </p>
        ) : null}
      </div>
      {project ? (
        <AddResourceSection
          project={project}
          previewSizes={previewSizes}
          icnsSlots={icnsSlots}
          isUpdatingProject={isUpdatingProject}
          onAddIcoEntry={onAddIcoEntry}
          onAddBlankIcoEntry={onAddBlankIcoEntry}
          onAddIcnsSlot={onAddIcnsSlot}
          onAddBlankIcnsSlot={onAddBlankIcnsSlot}
        />
      ) : null}
    </aside>
  );
}

function RailActionButton({
  ariaLabel,
  disabled,
  icon: Icon,
  onClick,
}: {
  readonly ariaLabel: string;
  readonly disabled: boolean;
  readonly icon: typeof ArrowUp;
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        'flex size-7 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground transition-colors',
        disabled ? 'cursor-not-allowed opacity-55' : 'hover:bg-accent/80',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-3" />
    </button>
  );
}

function ResourceMenuButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  readonly icon: typeof ArrowUp;
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 transition-colors',
        disabled ? 'cursor-not-allowed opacity-55' : 'hover:bg-accent hover:text-accent-foreground',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <Icon className="size-4 text-muted-foreground" />
    </button>
  );
}

async function handleMenuAction(
  setOpenMenuResourceId: (resourceId: string | null) => void,
  action: () => Promise<void>,
): Promise<void> {
  setOpenMenuResourceId(null);
  await action();
}

interface ResourceItem {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
  readonly previewDataUrl: string | null;
  readonly kind: 'ico' | 'icns';
  readonly index: number;
}

function getResourceItems(
  project: IconProjectDto | null,
): readonly ResourceItem[] {
  if (!project) {
    return [];
  }

  if (project.format === 'ico') {
    return project.entries.map((entry) => ({
      id: entry.id,
      label: `${entry.width}x${entry.height}`,
      meta: entry.payloadKind.toUpperCase(),
      previewDataUrl: entry.previewDataUrl,
      kind: 'ico' as const,
      index: entry.index,
    }));
  }

  const visibleChunks =
    project.chunks.filter((chunk) => chunk.isImageChunk || chunk.slot) ??
    project.chunks;

  return visibleChunks.map((chunk) => ({
    id: chunk.id,
    label: chunk.slot
      ? `${chunk.slot.pixelWidth}x${chunk.slot.pixelHeight}`
      : chunk.type,
    meta: chunk.slot ? chunk.slot.label : chunk.payloadFamily,
    previewDataUrl: chunk.previewDataUrl,
    kind: 'icns' as const,
    index: chunk.index,
  }));
}

function getMissingIcnsSlots(
  project: IcnsProjectDto,
  icnsSlots: readonly IcnsSlotDto[],
) {
  return icnsSlots.filter((slot) => {
    return !project.chunks.some(
      (chunk) => chunk.slot?.chunkType === slot.chunkType,
    );
  });
}

function AddResourceSection({
  project,
  previewSizes,
  icnsSlots,
  isUpdatingProject,
  onAddIcoEntry,
  onAddBlankIcoEntry,
  onAddIcnsSlot,
  onAddBlankIcnsSlot,
}: {
  readonly project: IconProjectDto;
  readonly previewSizes: readonly number[];
  readonly icnsSlots: readonly IcnsSlotDto[];
  readonly isUpdatingProject: boolean;
  readonly onAddIcoEntry: () => Promise<void>;
  readonly onAddBlankIcoEntry: (size: number) => Promise<void>;
  readonly onAddIcnsSlot: (chunkType: string) => Promise<void>;
  readonly onAddBlankIcnsSlot: (chunkType: string) => Promise<void>;
}) {
  const blankIcoSizes = previewSizes.filter((size) => size <= 256);
  const missingCanonicalSlots =
    project.format === 'icns' ? getMissingIcnsSlots(project, icnsSlots) : [];

  return (
    <div className="border-t border-border/60 px-3 py-3 space-y-2">
      {project.format === 'ico' ? (
        <>
          <button
            className={cn(
              'flex h-9 w-full items-center justify-center gap-2 rounded-full bg-primary text-xs font-medium text-primary-foreground transition-colors',
              isUpdatingProject
                ? 'cursor-not-allowed opacity-55'
                : 'hover:bg-primary/90',
            )}
            disabled={isUpdatingProject}
            onClick={() => void onAddIcoEntry()}
            type="button"
          >
            <CirclePlus className="size-3" />
            Add from PNG
          </button>
          <div className="grid grid-cols-3 gap-1">
            {blankIcoSizes.map((size) => (
              <button
                key={size}
                className={cn(
                  'rounded-lg border border-border bg-secondary py-1.5 text-[11px] font-medium text-secondary-foreground transition-colors',
                  isUpdatingProject
                    ? 'cursor-not-allowed opacity-55'
                    : 'hover:bg-accent',
                )}
                disabled={isUpdatingProject}
                onClick={() => void onAddBlankIcoEntry(size)}
                type="button"
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {project.format === 'icns' && missingCanonicalSlots.length > 0 ? (
        <div className="space-y-1">
          {missingCanonicalSlots.map((slot) => (
            <div
              key={slot.chunkType}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1"
            >
              <div className="flex items-center rounded-lg border border-border bg-accent px-2 text-[11px] text-secondary-foreground">
                <div>
                  <div className="truncate">{slot.label}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {slot.chunkType}
                  </div>
                </div>
              </div>
              <button
                className={cn(
                  'rounded-lg border border-border bg-secondary px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground transition-colors',
                  isUpdatingProject
                    ? 'cursor-not-allowed opacity-55'
                    : 'hover:bg-accent',
                )}
                disabled={isUpdatingProject}
                onClick={() => void onAddBlankIcnsSlot(slot.chunkType)}
                type="button"
              >
                Blank
              </button>
              <button
                className={cn(
                  'rounded-lg border border-border bg-secondary px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground transition-colors',
                  isUpdatingProject
                    ? 'cursor-not-allowed opacity-55'
                    : 'hover:bg-accent',
                )}
                disabled={isUpdatingProject}
                onClick={() => void onAddIcnsSlot(slot.chunkType)}
                type="button"
              >
                PNG
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
