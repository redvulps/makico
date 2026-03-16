import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  IcnsChunkDto,
  IconProjectDto,
  IcoEntryDto,
} from '@shared/dto/iconProject';

import type { PixelEditorDraftState } from '../hooks/usePixelEditorDraft';

interface WorkbenchCanvasProps {
  readonly project: IconProjectDto | null;
  readonly selectedIcoEntry: IcoEntryDto | null;
  readonly selectedIcnsChunk: IcnsChunkDto | null;
  readonly selectedSummary: string | null;
  readonly pixelateSmallPreviews: boolean;
  readonly showPixelGrid: boolean;
  readonly pixelEditor: PixelEditorDraftState;
}

export function WorkbenchCanvas({
  project,
  selectedIcoEntry,
  selectedIcnsChunk,
  selectedSummary,
  pixelateSmallPreviews,
  showPixelGrid,
  pixelEditor,
}: WorkbenchCanvasProps) {
  const canvasState = getCanvasState(
    project,
    selectedIcoEntry,
    selectedIcnsChunk,
    pixelEditor,
  );

  const effectivePixelGrid =
    showPixelGrid && pixelEditor.resource
      ? pixelEditor.zoom >= 3 ||
        Math.max(pixelEditor.resource.width, pixelEditor.resource.height) < 512
      : false;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panOriginRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const zoomRef = useRef(pixelEditor.zoom);
  zoomRef.current = pixelEditor.zoom;

  // Scroll wheel → zoom towards pointer
  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || !pixelEditor.canEdit) {
      return;
    }

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault();

      const oldZoom = zoomRef.current;
      const direction = event.deltaY < 0 ? 1 : event.deltaY > 0 ? -1 : 0;

      if (direction === 0) {
        return;
      }

      const newZoom = Math.max(1, Math.min(28, oldZoom + direction));

      if (newZoom === oldZoom) {
        return;
      }

      // Mouse position relative to the scroll container viewport
      const rect = container.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;

      // Point in content-space under the pointer before zoom
      const contentX = pointerX + container.scrollLeft;
      const contentY = pointerY + container.scrollTop;

      // Scale that content point to the new zoom level
      const scale = newZoom / oldZoom;
      const newContentX = contentX * scale;
      const newContentY = contentY * scale;

      // Force React to commit DOM changes synchronously so the container
      // dimensions, canvas transform, and background grid are all updated
      // before we adjust scroll — everything paints in a single frame.
      flushSync(() => {
        pixelEditor.setZoom(newZoom);
      });

      container.scrollLeft = newContentX - pointerX;
      container.scrollTop = newContentY - pointerY;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [pixelEditor.canEdit, pixelEditor.setZoom]);

  // Middle-click → pan (scroll mode)
  const handlePanPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (event.button !== 1) {
        return;
      }

      event.preventDefault();
      const container = scrollContainerRef.current;

      if (!container) {
        return;
      }

      setIsPanning(true);
      panOriginRef.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };

      container.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handlePanPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (!isPanning) {
        return;
      }

      const container = scrollContainerRef.current;

      if (!container) {
        return;
      }

      const deltaX = event.clientX - panOriginRef.current.x;
      const deltaY = event.clientY - panOriginRef.current.y;
      container.scrollLeft = panOriginRef.current.scrollLeft - deltaX;
      container.scrollTop = panOriginRef.current.scrollTop - deltaY;
    },
    [isPanning],
  );

  const handlePanPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (event.button !== 1) {
        return;
      }

      setIsPanning(false);
      scrollContainerRef.current?.releasePointerCapture(event.pointerId);
    },
    [],
  );

  return (
    <section className="flex min-h-0 flex-col bg-secondary">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {canvasState.header}
          </p>
          <p className="mt-1 text-sm text-foreground/70">
            {selectedSummary ?? canvasState.subHeader}
          </p>
        </div>
        {project ? (
          <div className="text-right text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <div>{project.format.toUpperCase()}</div>
            <div className="mt-1">
              {project.isDirty ? 'Unsaved changes' : 'Saved'}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative flex-1">
        <div
          ref={scrollContainerRef}
          className={cn(
            'absolute inset-0 overflow-auto',
            effectivePixelGrid ? 'pixel-stage' : null,
            isPanning ? 'cursor-grab' : null,
          )}
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          style={{
            contain: 'layout style',
            ...(effectivePixelGrid
              ? {
                  backgroundSize: `${pixelEditor.zoom}px ${pixelEditor.zoom}px, ${pixelEditor.zoom}px ${pixelEditor.zoom}px`,
                }
              : undefined),
          }}
        >
          <div className="min-h-full min-w-full p-6"
            style={{ display: 'grid', placeItems: 'center' }}
          >
            {pixelEditor.canEdit && pixelEditor.resource ? (
              <div
                style={{
                  width: pixelEditor.resource.width * pixelEditor.zoom,
                  height: pixelEditor.resource.height * pixelEditor.zoom,
                  contain: 'strict',
                }}
              >
                <canvas
                  ref={pixelEditor.canvasRef}
                  className={cn(
                    'touch-none border border-border bg-transparent [image-rendering:pixelated]',
                    getCanvasCursor(pixelEditor.activeTool),
                  )}
                  height={pixelEditor.resource.height}
                  onPointerDown={pixelEditor.handlePointerDown}
                  onPointerLeave={pixelEditor.handlePointerLeave}
                  onPointerMove={pixelEditor.handlePointerMove}
                  onPointerUp={pixelEditor.handlePointerUp}
                  style={{
                    width: pixelEditor.resource.width,
                    height: pixelEditor.resource.height,
                    transform: `scale(${pixelEditor.zoom})`,
                    transformOrigin: 'top left',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                  }}
                  width={pixelEditor.resource.width}
                />
              </div>
            ) : canvasState.previewDataUrl ? (
              <img
                alt={canvasState.alt}
                className={cn(
                  'max-h-full max-w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.12)]',
                  pixelateSmallPreviews && canvasState.usePixelatedPreview
                    ? '[image-rendering:pixelated]'
                    : null,
                )}
                src={canvasState.previewDataUrl}
              />
            ) : (
              <div className="max-w-md text-center text-muted-foreground">
                <p className="text-[34px] leading-tight tracking-[-0.05em]">
                  Preview / Drawing Canvas
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.24em] text-muted-foreground/70">
                  Pixel grid
                </p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {pixelEditor.editorMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        {pixelEditor.canEdit ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
            <div className="pointer-events-auto flex items-center rounded-full border border-border/80 bg-background/60 p-1 shadow-lg backdrop-blur-sm">
              <button
                className="flex size-8 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-accent"
                onClick={pixelEditor.decreaseZoom}
                title="Zoom out"
                type="button"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-[52px] text-center text-xs font-semibold text-secondary-foreground">
                {pixelEditor.zoom}x
              </span>
              <button
                className="flex size-8 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-accent"
                onClick={pixelEditor.increaseZoom}
                title="Zoom in"
                type="button"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

    </section>
  );
}

function getCanvasState(
  project: IconProjectDto | null,
  selectedIcoEntry: IcoEntryDto | null,
  selectedIcnsChunk: IcnsChunkDto | null,
  pixelEditor: PixelEditorDraftState,
) {
  if (!project) {
    return {
      header: 'Canvas',
      subHeader: 'Open an ICO or ICNS file to populate the editor surface.',
      selectionFallback: 'No asset loaded',
      payloadLabel: 'No active container',
      viewportLabel: 'Ready for import',
      previewDataUrl: null,
      alt: 'Empty Makico canvas',
      usePixelatedPreview: false,
    };
  }

  if (project.format === 'ico') {
    return {
      header: pixelEditor.canEdit ? 'ICO editor' : 'ICO preview',
      subHeader: pixelEditor.canEdit
        ? pixelEditor.editorMessage
        : 'Selected bitmap or PNG payload',
      selectionFallback: selectedIcoEntry
        ? `${selectedIcoEntry.width}x${selectedIcoEntry.height}`
        : 'No ICO entry selected',
      payloadLabel: selectedIcoEntry
        ? `${selectedIcoEntry.payloadKind.toUpperCase()} ${selectedIcoEntry.bitCount}-bit`
        : 'No ICO payload selected',
      viewportLabel: pixelEditor.resource
        ? `${pixelEditor.resource.width} x ${pixelEditor.resource.height}px @ ${pixelEditor.zoom}x`
        : selectedIcoEntry
          ? `${selectedIcoEntry.width} x ${selectedIcoEntry.height}px`
          : 'Waiting for selection',
      previewDataUrl: selectedIcoEntry?.previewDataUrl ?? null,
      alt: selectedIcoEntry
        ? `ICO entry ${selectedIcoEntry.width} by ${selectedIcoEntry.height}`
        : 'Empty ICO preview',
      usePixelatedPreview:
        (selectedIcoEntry?.width ?? 0) <= 64 &&
        (selectedIcoEntry?.height ?? 0) <= 64,
    };
  }

  return {
    header: pixelEditor.canEdit ? 'ICNS editor' : 'ICNS preview',
    subHeader: pixelEditor.canEdit
      ? pixelEditor.editorMessage
      : 'Selected slot or chunk preview',
    selectionFallback: selectedIcnsChunk?.type ?? 'No ICNS chunk selected',
    payloadLabel: selectedIcnsChunk
      ? `${selectedIcnsChunk.payloadFamily} payload`
      : 'No ICNS payload selected',
    viewportLabel: pixelEditor.resource
      ? `${pixelEditor.resource.width} x ${pixelEditor.resource.height}px @ ${pixelEditor.zoom}x`
      : selectedIcnsChunk?.slot
        ? `${selectedIcnsChunk.slot.pixelWidth} x ${selectedIcnsChunk.slot.pixelHeight}px`
        : selectedIcnsChunk
          ? 'Inspect-only chunk'
          : 'Waiting for selection',
    previewDataUrl: selectedIcnsChunk?.previewDataUrl ?? null,
    alt: selectedIcnsChunk
      ? `ICNS chunk ${selectedIcnsChunk.type}`
      : 'Empty ICNS preview',
    usePixelatedPreview:
      (selectedIcnsChunk?.slot?.pixelWidth ?? 0) <= 64 &&
      (selectedIcnsChunk?.slot?.pixelHeight ?? 0) <= 64,
  };
}

function getCanvasCursor(tool: PixelEditorDraftState['activeTool']): string {
  if (tool === 'eyedropper') {
    return 'cursor-copy';
  }

  if (tool === 'eraser') {
    return 'cursor-cell';
  }

  return 'cursor-crosshair';
}
