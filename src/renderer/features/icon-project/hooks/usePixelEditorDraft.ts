import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

import type {
  IcnsChunkDto,
  IcoEntryDto,
  IconProjectDto,
} from '@shared/dto/iconProject';

const MIN_ZOOM = 1;
const MAX_ZOOM = 28;
const DEFAULT_COLOR = '#1f6f78';

export type PixelEditorTool = 'pen' | 'eraser' | 'eyedropper';

export interface EditableBitmapResource {
  readonly id: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly previewDataUrl: string;
  readonly format: 'ico' | 'icns';
}

interface PixelDraft {
  sourceSignature: string;
  sourceImageData: ImageData;
  draftImageData: ImageData;
  undoStack: ImageData[];
  redoStack: ImageData[];
  isDirty: boolean;
}

interface UsePixelEditorDraftInput {
  readonly project: IconProjectDto | null;
  readonly selectedIcoEntry: IcoEntryDto | null;
  readonly selectedIcnsChunk: IcnsChunkDto | null;
  readonly onCommitPngBytes: (pngBytes: Uint8Array) => Promise<void>;
}

export interface PixelEditorDraftState {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly resource: EditableBitmapResource | null;
  readonly activeTool: PixelEditorTool;
  readonly brushSize: number;
  readonly colorHex: string;
  readonly zoom: number;
  readonly canEdit: boolean;
  readonly isHydrating: boolean;
  readonly isApplying: boolean;
  readonly hasDraftChanges: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly draftStatusLabel: string;
  readonly editorMessage: string;
  readonly error: string | null;
  readonly setActiveTool: (tool: PixelEditorTool) => void;
  readonly setBrushSize: (nextBrushSize: number) => void;
  readonly setColorHex: (nextColorHex: string) => void;
  readonly setZoom: (nextZoom: number) => void;
  readonly increaseZoom: () => void;
  readonly decreaseZoom: () => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly applyDraft: () => Promise<void>;
  readonly revertDraft: () => void;
  readonly handlePointerDown: (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => void;
  readonly handlePointerMove: (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => void;
  readonly handlePointerUp: (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => void;
  readonly handlePointerLeave: (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => void;
}

export function usePixelEditorDraft({
  project,
  selectedIcoEntry,
  selectedIcnsChunk,
  onCommitPngBytes,
}: UsePixelEditorDraftInput): PixelEditorDraftState {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draftsRef = useRef(new Map<string, PixelDraft>());
  const activeResourceIdRef = useRef<string | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [activeTool, setActiveTool] = useState<PixelEditorTool>('pen');
  const [brushSize, setBrushSize] = useState(1);
  const [colorHex, setColorHexState] = useState(DEFAULT_COLOR);
  const [zoom, setZoomState] = useState(12);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const resource = useMemo(() => {
    return getEditableBitmapResource(
      project,
      selectedIcoEntry,
      selectedIcnsChunk,
    );
  }, [project, selectedIcoEntry, selectedIcnsChunk]);
  const canEdit = resource !== null;
  const resourceDraft = resource
    ? (draftsRef.current.get(resource.id) ?? null)
    : null;
  const hasDraftChanges = resourceDraft?.isDirty ?? false;
  const canUndo = (resourceDraft?.undoStack.length ?? 0) > 0;
  const canRedo = (resourceDraft?.redoStack.length ?? 0) > 0;
  const draftStatusLabel = hasDraftChanges ? 'Draft modified' : 'Draft synced';
  const editorMessage = getEditorMessage(project, resource, isHydrating, error);

  const renderDraft = useCallback((): void => {
    const activeResourceId = activeResourceIdRef.current;

    if (!activeResourceId) {
      return;
    }

    const activeDraft = draftsRef.current.get(activeResourceId);
    const canvas = canvasRef.current;

    if (!activeDraft || !canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    canvas.width = activeDraft.draftImageData.width;
    canvas.height = activeDraft.draftImageData.height;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(activeDraft.draftImageData, 0, 0);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateDraft(): Promise<void> {
      activeResourceIdRef.current = resource?.id ?? null;
      isDrawingRef.current = false;
      lastPointRef.current = null;
      setError(null);

      if (!resource) {
        setIsHydrating(false);
        setDraftVersion((previousVersion) => previousVersion + 1);
        return;
      }

      const sourceSignature = `${resource.id}:${resource.previewDataUrl}`;
      const cachedDraft = draftsRef.current.get(resource.id);

      if (cachedDraft && cachedDraft.sourceSignature === sourceSignature) {
        setZoomState(
          (previousZoom) => previousZoom || getDefaultZoom(resource),
        );
        setDraftVersion((previousVersion) => previousVersion + 1);
        return;
      }

      setIsHydrating(true);

      try {
        const imageData = await dataUrlToImageData(resource.previewDataUrl);

        if (isCancelled) {
          return;
        }

        draftsRef.current.set(resource.id, {
          sourceSignature,
          sourceImageData: cloneImageData(imageData),
          draftImageData: cloneImageData(imageData),
          undoStack: [],
          redoStack: [],
          isDirty: false,
        });
        setZoomState(getDefaultZoom(resource));
        setDraftVersion((previousVersion) => previousVersion + 1);
      } catch (hydrateError) {
        if (isCancelled) {
          return;
        }

        setError(
          toErrorMessage(
            hydrateError,
            'The selected bitmap could not be loaded into the drawing canvas.',
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsHydrating(false);
        }
      }
    }

    void hydrateDraft();

    return () => {
      isCancelled = true;
    };
  }, [resource]);

  useEffect(() => {
    renderDraft();
  }, [draftVersion, renderDraft]);

  const setColorHex = useCallback((nextColorHex: string): void => {
    setColorHexState(nextColorHex.toUpperCase());
  }, []);

  const setZoom = useCallback((nextZoom: number): void => {
    setZoomState(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const increaseZoom = useCallback((): void => {
    setZoomState((previousZoom) => clamp(previousZoom + 1, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const decreaseZoom = useCallback((): void => {
    setZoomState((previousZoom) => clamp(previousZoom - 1, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const updateCurrentDraft = useCallback(
    (mutateDraft: (draft: PixelDraft) => void): void => {
      const activeResourceId = activeResourceIdRef.current;

      if (!activeResourceId) {
        return;
      }

      const activeDraft = draftsRef.current.get(activeResourceId);

      if (!activeDraft) {
        return;
      }

      mutateDraft(activeDraft);
      renderDraft();
      setDraftVersion((previousVersion) => previousVersion + 1);
    },
    [renderDraft],
  );

  const pushCurrentDraftToUndo = useCallback((): void => {
    const activeResourceId = activeResourceIdRef.current;

    if (!activeResourceId) {
      return;
    }

    const activeDraft = draftsRef.current.get(activeResourceId);

    if (!activeDraft) {
      return;
    }

    activeDraft.undoStack = [
      ...activeDraft.undoStack,
      cloneImageData(activeDraft.draftImageData),
    ];
    activeDraft.redoStack = [];
    setDraftVersion((previousVersion) => previousVersion + 1);
  }, []);

  const undo = useCallback((): void => {
    const activeResourceId = activeResourceIdRef.current;

    if (!activeResourceId) {
      return;
    }

    const activeDraft = draftsRef.current.get(activeResourceId);

    if (!activeDraft || activeDraft.undoStack.length === 0) {
      return;
    }

    const previousImageData =
      activeDraft.undoStack.at(-1) ?? activeDraft.draftImageData;

    activeDraft.undoStack = activeDraft.undoStack.slice(0, -1);
    activeDraft.redoStack = [
      ...activeDraft.redoStack,
      cloneImageData(activeDraft.draftImageData),
    ];
    activeDraft.draftImageData = cloneImageData(previousImageData);
    activeDraft.isDirty = !imageDataEquals(
      activeDraft.draftImageData,
      activeDraft.sourceImageData,
    );
    renderDraft();
    setDraftVersion((previousVersion) => previousVersion + 1);
  }, [renderDraft]);

  const redo = useCallback((): void => {
    const activeResourceId = activeResourceIdRef.current;

    if (!activeResourceId) {
      return;
    }

    const activeDraft = draftsRef.current.get(activeResourceId);

    if (!activeDraft || activeDraft.redoStack.length === 0) {
      return;
    }

    const nextImageData =
      activeDraft.redoStack.at(-1) ?? activeDraft.draftImageData;

    activeDraft.redoStack = activeDraft.redoStack.slice(0, -1);
    activeDraft.undoStack = [
      ...activeDraft.undoStack,
      cloneImageData(activeDraft.draftImageData),
    ];
    activeDraft.draftImageData = cloneImageData(nextImageData);
    activeDraft.isDirty = !imageDataEquals(
      activeDraft.draftImageData,
      activeDraft.sourceImageData,
    );
    renderDraft();
    setDraftVersion((previousVersion) => previousVersion + 1);
  }, [renderDraft]);

  const applyDraft = useCallback(async (): Promise<void> => {
    const activeResourceId = activeResourceIdRef.current;

    if (!activeResourceId) {
      return;
    }

    const activeDraft = draftsRef.current.get(activeResourceId);

    if (!activeDraft || !activeDraft.isDirty) {
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const pngBytes = await imageDataToPngBytes(activeDraft.draftImageData);
      await onCommitPngBytes(pngBytes);
      activeDraft.sourceImageData = cloneImageData(activeDraft.draftImageData);
      activeDraft.undoStack = [];
      activeDraft.redoStack = [];
      activeDraft.isDirty = false;
      setDraftVersion((previousVersion) => previousVersion + 1);
    } catch (applyError) {
      setError(
        toErrorMessage(applyError, 'The edited bitmap could not be applied.'),
      );
    } finally {
      setIsApplying(false);
    }
  }, [onCommitPngBytes]);

  const revertDraft = useCallback((): void => {
    updateCurrentDraft((draft) => {
      draft.draftImageData = cloneImageData(draft.sourceImageData);
      draft.undoStack = [];
      draft.redoStack = [];
      draft.isDirty = false;
    });
  }, [updateCurrentDraft]);

  const beginStroke = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): void => {
      if (event.button !== 0) {
        return;
      }

      if (!resource || isHydrating || isApplying) {
        return;
      }

      const point = getCanvasPoint(event, resource);

      if (!point) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      lastPointRef.current = point;

      // Alt+click picks a color regardless of the active tool
      const useEyedropper = activeTool === 'eyedropper' || event.altKey;

      isDrawingRef.current = !useEyedropper;

      if (useEyedropper) {
        const sampledColor = getSampledPixelColor(
          resource.id,
          point.x,
          point.y,
        );

        if (sampledColor) {
          setColorHex(sampledColor);
        }

        return;
      }

      pushCurrentDraftToUndo();
      updateCurrentDraft((draft) => {
        paintLine(draft.draftImageData, point, point, {
          tool: activeTool,
          brushSize,
          colorHex,
        });
        draft.isDirty = true;
      });
    },
    [
      activeTool,
      brushSize,
      colorHex,
      isApplying,
      isHydrating,
      pushCurrentDraftToUndo,
      resource,
      setColorHex,
      updateCurrentDraft,
    ],
  );

  const continueStroke = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): void => {
      if (!resource || !isDrawingRef.current || !lastPointRef.current) {
        return;
      }

      const point = getCanvasPoint(event, resource);

      if (!point) {
        return;
      }

      const previousPoint = lastPointRef.current;
      lastPointRef.current = point;

      updateCurrentDraft((draft) => {
        paintLine(draft.draftImageData, previousPoint, point, {
          tool: activeTool,
          brushSize,
          colorHex,
        });
        draft.isDirty = true;
      });
    },
    [activeTool, brushSize, colorHex, resource, updateCurrentDraft],
  );

  const endStroke = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): void => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      isDrawingRef.current = false;
      lastPointRef.current = null;
    },
    [],
  );

  return {
    canvasRef,
    resource,
    activeTool,
    brushSize,
    colorHex,
    zoom,
    canEdit,
    isHydrating,
    isApplying,
    hasDraftChanges,
    canUndo,
    canRedo,
    draftStatusLabel,
    editorMessage,
    error,
    setActiveTool,
    setBrushSize: (nextBrushSize: number) => {
      setBrushSize(clamp(Math.round(nextBrushSize), 1, 6));
    },
    setColorHex,
    setZoom,
    increaseZoom,
    decreaseZoom,
    undo,
    redo,
    applyDraft,
    revertDraft,
    handlePointerDown: beginStroke,
    handlePointerMove: continueStroke,
    handlePointerUp: endStroke,
    handlePointerLeave: endStroke,
  };

  function getSampledPixelColor(
    resourceId: string,
    x: number,
    y: number,
  ): string | null {
    const activeDraft = draftsRef.current.get(resourceId);

    if (!activeDraft) {
      return null;
    }

    const pixelOffset = (y * activeDraft.draftImageData.width + x) * 4;
    const red = activeDraft.draftImageData.data[pixelOffset] ?? 0;
    const green = activeDraft.draftImageData.data[pixelOffset + 1] ?? 0;
    const blue = activeDraft.draftImageData.data[pixelOffset + 2] ?? 0;
    const alpha = activeDraft.draftImageData.data[pixelOffset + 3] ?? 0;

    if (alpha === 0) {
      return '#FFFFFF';
    }

    return rgbToHex(red, green, blue);
  }
}

function getEditableBitmapResource(
  project: IconProjectDto | null,
  selectedIcoEntry: IcoEntryDto | null,
  selectedIcnsChunk: IcnsChunkDto | null,
): EditableBitmapResource | null {
  if (!project) {
    return null;
  }

  if (project.format === 'ico') {
    if (!selectedIcoEntry?.previewDataUrl) {
      return null;
    }

    return {
      id: selectedIcoEntry.id,
      label: `${selectedIcoEntry.width}x${selectedIcoEntry.height} ICO`,
      width: selectedIcoEntry.width,
      height: selectedIcoEntry.height,
      previewDataUrl: selectedIcoEntry.previewDataUrl,
      format: 'ico',
    };
  }

  if (!selectedIcnsChunk?.previewDataUrl || !selectedIcnsChunk.slot) {
    return null;
  }

  return {
    id: selectedIcnsChunk.id,
    label: selectedIcnsChunk.slot.label,
    width: selectedIcnsChunk.slot.pixelWidth,
    height: selectedIcnsChunk.slot.pixelHeight,
    previewDataUrl: selectedIcnsChunk.previewDataUrl,
    format: 'icns',
  };
}

function getEditorMessage(
  project: IconProjectDto | null,
  resource: EditableBitmapResource | null,
  isHydrating: boolean,
  error: string | null,
): string {
  if (error) {
    return error;
  }

  if (isHydrating) {
    return 'Loading the selected bitmap into the canvas.';
  }

  if (!project) {
    return 'Open or create an icon project to start editing pixels.';
  }

  if (!resource) {
    if (project.format === 'ico') {
      return 'Select an ICO entry with a previewable bitmap, or import one from an image.';
    }

    return 'Select a slot-backed ICNS bitmap, or add one from an image before drawing.';
  }

  return `Editing ${resource.label} at ${resource.width}x${resource.height} pixels.`;
}

function getDefaultZoom(resource: EditableBitmapResource): number {
  const maxDimension = Math.max(resource.width, resource.height);

  if (maxDimension <= 16) {
    return 22;
  }

  if (maxDimension <= 32) {
    return 16;
  }

  if (maxDimension <= 64) {
    return 12;
  }

  return 8;
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
}

function cloneImageData(source: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(source.data),
    source.width,
    source.height,
  );
}

function imageDataEquals(left: ImageData, right: ImageData): boolean {
  if (left.width !== right.width || left.height !== right.height) {
    return false;
  }

  if (left.data.length !== right.data.length) {
    return false;
  }

  for (let index = 0; index < left.data.length; index += 1) {
    if (left.data[index] !== right.data[index]) {
      return false;
    }
  }

  return true;
}

async function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Makico could not allocate a 2D canvas context.');
  }

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, canvas.width, canvas.height);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('The selected preview image could not be decoded.'));
    };
    image.src = src;
  });
}

async function imageDataToPngBytes(imageData: ImageData): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Makico could not allocate a 2D canvas context.');
  }

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  context.imageSmoothingEnabled = false;
  context.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }

      reject(new Error('Makico could not encode the edited bitmap as PNG.'));
    }, 'image/png');
  });
  const bytes = await blob.arrayBuffer();

  return new Uint8Array(bytes);
}

function getCanvasPoint(
  event: ReactPointerEvent<HTMLCanvasElement>,
  resource: EditableBitmapResource,
): { x: number; y: number } | null {
  const rect = event.currentTarget.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const normalizedX = clamp(
    (event.clientX - rect.left) / rect.width,
    0,
    0.999999,
  );
  const normalizedY = clamp(
    (event.clientY - rect.top) / rect.height,
    0,
    0.999999,
  );

  return {
    x: Math.floor(normalizedX * resource.width),
    y: Math.floor(normalizedY * resource.height),
  };
}

function paintLine(
  imageData: ImageData,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: {
    readonly tool: PixelEditorTool;
    readonly brushSize: number;
    readonly colorHex: string;
  },
): void {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY), 1);

  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(from.x + (deltaX * step) / steps);
    const y = Math.round(from.y + (deltaY * step) / steps);

    paintBrush(imageData, x, y, options);
  }
}

function paintBrush(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  options: {
    readonly tool: Exclude<PixelEditorTool, 'eyedropper'> | PixelEditorTool;
    readonly brushSize: number;
    readonly colorHex: string;
  },
): void {
  const radius = Math.floor(options.brushSize / 2);
  const color = options.tool === 'eraser' ? null : hexToRgba(options.colorHex);

  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const pixelX = centerX + offsetX;
      const pixelY = centerY + offsetY;

      if (
        pixelX < 0 ||
        pixelX >= imageData.width ||
        pixelY < 0 ||
        pixelY >= imageData.height
      ) {
        continue;
      }

      const pixelOffset = (pixelY * imageData.width + pixelX) * 4;

      if (!color) {
        imageData.data[pixelOffset] = 0;
        imageData.data[pixelOffset + 1] = 0;
        imageData.data[pixelOffset + 2] = 0;
        imageData.data[pixelOffset + 3] = 0;
        continue;
      }

      imageData.data[pixelOffset] = color.red;
      imageData.data[pixelOffset + 1] = color.green;
      imageData.data[pixelOffset + 2] = color.blue;
      imageData.data[pixelOffset + 3] = 255;
    }
  }
}

function hexToRgba(colorHex: string) {
  const normalized = colorHex.replace('#', '');
  const sanitized =
    normalized.length === 3
      ? normalized
          .split('')
          .map((segment) => `${segment}${segment}`)
          .join('')
      : normalized.padEnd(6, '0').slice(0, 6);

  return {
    red: Number.parseInt(sanitized.slice(0, 2), 16),
    green: Number.parseInt(sanitized.slice(2, 4), 16),
    blue: Number.parseInt(sanitized.slice(4, 6), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}
