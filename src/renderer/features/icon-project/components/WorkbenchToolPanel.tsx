import {
  Eraser,
  PenTool,
  Pipette,
  Redo2,
  Undo2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { PixelEditorDraftState } from '../hooks/usePixelEditorDraft';

interface WorkbenchToolPanelProps {
  readonly isUpdatingProject: boolean;
  readonly pixelEditor: PixelEditorDraftState;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onUndo: () => Promise<void> | void;
  readonly onRedo: () => Promise<void> | void;
}

export function WorkbenchToolPanel({
  isUpdatingProject,
  pixelEditor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: WorkbenchToolPanelProps) {
  const isBusy =
    isUpdatingProject || pixelEditor.isApplying || pixelEditor.isHydrating;

  return (
    <aside className="flex min-h-0 flex-col bg-[#cfcdca]">
      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <ToolToggleButton
            icon={PenTool}
            isActive={pixelEditor.activeTool === 'pen'}
            disabled={!pixelEditor.canEdit || isBusy}
            title="Pen"
            onClick={() => {
              pixelEditor.setActiveTool('pen');
            }}
          />
          <ToolToggleButton
            icon={Eraser}
            isActive={pixelEditor.activeTool === 'eraser'}
            disabled={!pixelEditor.canEdit || isBusy}
            title="Eraser"
            onClick={() => {
              pixelEditor.setActiveTool('eraser');
            }}
          />
          <ToolToggleButton
            icon={Pipette}
            isActive={pixelEditor.activeTool === 'eyedropper'}
            disabled={!pixelEditor.canEdit || isBusy}
            title="Pick"
            onClick={() => {
              pixelEditor.setActiveTool('eyedropper');
            }}
          />
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <PanelLabel label="Ink" value={pixelEditor.colorHex} />
            <label className="flex h-11 items-center gap-3 border border-black/18 bg-[#d9d7d4] px-3">
              <input
                className="size-7 border border-black/20 bg-transparent p-0"
                disabled={!pixelEditor.canEdit || isBusy}
                onChange={(event) => {
                  pixelEditor.setColorHex(event.target.value);
                }}
                type="color"
                value={pixelEditor.colorHex}
              />
              <span className="text-sm text-[#403f3c]">
                Solid RGBA stroke color
              </span>
            </label>
          </div>

          <div className="grid gap-2">
            <PanelLabel label="Brush" value={`${pixelEditor.brushSize}px`} />
            <input
              className="h-2 w-full cursor-pointer appearance-none bg-[#b0aeab] accent-[#4b4b4a] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/20 [&::-webkit-slider-thumb]:bg-[#4b4b4a]"
              disabled={!pixelEditor.canEdit || isBusy}
              max={6}
              min={1}
              onChange={(event) => {
                pixelEditor.setBrushSize(Number(event.target.value));
              }}
              onWheel={(event) => {
                event.preventDefault();
                const delta = event.deltaY < 0 ? 1 : -1;
                const next = Math.max(1, Math.min(6, pixelEditor.brushSize + delta));
                pixelEditor.setBrushSize(next);
              }}
              step={1}
              type="range"
              value={pixelEditor.brushSize}
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-black/14 pt-4">
          {pixelEditor.error ? (
            <p className="border border-[#b56e62] bg-[#ead3ce] px-3 py-2 text-sm text-[#6c352f]">
              {pixelEditor.error}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={cn(
                'flex h-11 items-center justify-center gap-2 border border-black/18 bg-[#d9d7d4] text-sm font-semibold text-[#343330] transition-colors',
                !canUndo || isBusy
                  ? 'cursor-not-allowed opacity-55'
                  : 'hover:bg-[#e1dfdc]',
              )}
              disabled={!canUndo || isBusy}
              onClick={() => void onUndo()}
              type="button"
            >
              <Undo2 className="size-4" />
              Undo
            </button>
            <button
              className={cn(
                'flex h-11 items-center justify-center gap-2 border border-black/18 bg-[#d9d7d4] text-sm font-semibold text-[#343330] transition-colors',
                !canRedo || isBusy
                  ? 'cursor-not-allowed opacity-55'
                  : 'hover:bg-[#e1dfdc]',
              )}
              disabled={!canRedo || isBusy}
              onClick={() => void onRedo()}
              type="button"
            >
              <Redo2 className="size-4" />
              Redo
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}


function ToolToggleButton({
  icon: Icon,
  isActive,
  disabled,
  title,
  onClick,
}: {
  readonly icon: typeof PenTool;
  readonly isActive: boolean;
  readonly disabled: boolean;
  readonly title: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'flex h-10 items-center justify-center border border-black/18 transition-colors',
        isActive
          ? 'bg-[#4b4b4a] text-white'
          : 'bg-[#d9d7d4] text-[#343330] hover:bg-[#e1dfdc]',
        disabled ? 'cursor-not-allowed opacity-55' : null,
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      <Icon className="size-4" />
    </button>
  );
}

function PanelLabel({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#666461]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
