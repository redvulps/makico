import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  ChevronDown,
  CircleHelp,
  Copy,
  Maximize2,
  Minus,
  Plus,
  Save,
  Settings2,
  Square,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { IconProjectDto } from '@shared/dto/iconProject';
import type { RecentProjectDto } from '@shared/dto/appSettings';

interface WindowTitleBarProps {
  readonly project: IconProjectDto | null;
  readonly importingFormat: 'ico' | 'icns' | null;
  readonly isExporting: boolean;
  readonly isUpdatingProject: boolean;
  readonly isWindowMaximized: boolean;
  readonly recentProjects: readonly RecentProjectDto[];
  readonly onOpenNewProjectModal: () => void;
  readonly onOpenIco: () => Promise<void>;
  readonly onOpenIcns: () => Promise<void>;
  readonly onOpenRecentProject: (filePath: string) => Promise<void>;
  readonly onSaveProject: () => Promise<void>;
  readonly onOpenSettingsModal: () => void;
  readonly onOpenHelpModal: () => void;
  readonly onMinimizeWindow: () => Promise<void>;
  readonly onToggleMaximizeWindow: () => Promise<void>;
  readonly onCloseWindow: () => Promise<void>;
}

export function WindowTitleBar({
  project,
  importingFormat,
  isExporting,
  isUpdatingProject,
  isWindowMaximized,
  recentProjects,
  onOpenNewProjectModal,
  onOpenIco,
  onOpenIcns,
  onOpenRecentProject,
  onSaveProject,
  onOpenSettingsModal,
  onOpenHelpModal,
  onMinimizeWindow,
  onToggleMaximizeWindow,
  onCloseWindow,
}: WindowTitleBarProps) {
  const [isOpenMenuVisible, setIsOpenMenuVisible] = useState(false);
  const openMenuRef = useRef<HTMLDivElement | null>(null);
  const isBusy = importingFormat !== null || isExporting || isUpdatingProject;
  const canSave =
    (project?.format === 'ico' && project.entryCount > 0) ||
    (project?.format === 'icns' && project.canonicalExportSlotCount > 0);

  useEffect(() => {
    if (!isOpenMenuVisible) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (openMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpenMenuVisible(false);
    }

    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpenMenuVisible]);

  return (
    <header className="app-drag flex h-14 items-center justify-between border-b border-black/20 bg-[#b3b2b0] px-4 text-[#2d2d2d]">
      <div className="app-no-drag flex items-center gap-2">
        <TitleBarActionButton disabled={isBusy} onClick={onOpenNewProjectModal}>
          <Plus className="size-4" />
          New
        </TitleBarActionButton>
        <div className="relative" ref={openMenuRef}>
          <TitleBarActionButton
            disabled={isBusy}
            onClick={() => {
              setIsOpenMenuVisible((currentValue) => !currentValue);
            }}
          >
            Open
            <ChevronDown className="size-4" />
          </TitleBarActionButton>
          {isOpenMenuVisible ? (
            <div className="absolute top-[calc(100%+8px)] left-0 z-40 w-72 rounded-sm border border-black/20 bg-[#d7d5d2] p-1 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.5)]">
              <OpenMenuButton
                label={
                  importingFormat === 'ico' ? 'Opening ICO...' : 'Open ICO'
                }
                onClick={() => {
                  setIsOpenMenuVisible(false);
                  void onOpenIco();
                }}
              />
              <OpenMenuButton
                label={
                  importingFormat === 'icns' ? 'Opening ICNS...' : 'Open ICNS'
                }
                onClick={() => {
                  setIsOpenMenuVisible(false);
                  void onOpenIcns();
                }}
              />
              {recentProjects.length > 0 ? (
                <>
                  <div className="my-1 border-t border-black/10" />
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6966]">
                    Recent files
                  </p>
                  {recentProjects.slice(0, 6).map((project) => (
                    <OpenMenuButton
                      key={project.path}
                      label={getRecentProjectLabel(project)}
                      onClick={() => {
                        setIsOpenMenuVisible(false);
                        void onOpenRecentProject(project.path);
                      }}
                      secondaryLabel={project.format.toUpperCase()}
                      title={project.path}
                    />
                  ))}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <TitleBarActionButton
          disabled={!canSave || isBusy}
          onClick={() => void onSaveProject()}
        >
          <Save className="size-4" />
          {isExporting ? 'Saving...' : 'Save'}
        </TitleBarActionButton>
        <TitleBarIconButton
          isActive={false}
          onClick={onOpenSettingsModal}
          title="Settings"
        >
          <Settings2 className="size-4" />
        </TitleBarIconButton>
        <TitleBarIconButton
          isActive={false}
          onClick={onOpenHelpModal}
          title="Help"
        >
          <CircleHelp className="size-4" />
        </TitleBarIconButton>
      </div>

      <div className="pointer-events-none absolute inset-x-0 flex justify-center">
        <div className="max-w-[44ch] truncate px-40 pt-4 text-sm font-medium tracking-[-0.02em] text-[#4a4a49]">
          {project?.name ?? 'Makico'}
        </div>
      </div>

      <div className="app-no-drag ml-auto flex items-center gap-1">
        <WindowControlButton
          onClick={() => void onMinimizeWindow()}
          title="Minimize"
        >
          <Minus className="size-4" />
        </WindowControlButton>
        <WindowControlButton
          onClick={() => void onToggleMaximizeWindow()}
          title={isWindowMaximized ? 'Restore' : 'Maximize'}
        >
          {isWindowMaximized ? (
            <Copy className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </WindowControlButton>
        <WindowControlButton
          className="hover:bg-[#a03f3f] hover:text-white"
          onClick={() => void onCloseWindow()}
          title="Close"
        >
          <X className="size-4" />
        </WindowControlButton>
      </div>
    </header>
  );
}

interface TitleBarActionButtonProps {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

function TitleBarActionButton({
  children,
  disabled = false,
  onClick,
}: TitleBarActionButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-sm border border-black/30 bg-[#4b4b4a] px-4 text-sm font-semibold text-white transition-colors',
        disabled ? 'cursor-not-allowed opacity-55' : 'hover:bg-[#3f3f3e]',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

interface TitleBarIconButtonProps {
  readonly children: ReactNode;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly title: string;
}

function TitleBarIconButton({
  children,
  isActive,
  onClick,
  title,
}: TitleBarIconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full border border-transparent text-[#4a4a49] transition-colors hover:bg-black/8',
        isActive ? 'bg-black/10 text-[#252525]' : null,
      )}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

interface OpenMenuButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly secondaryLabel?: string;
  readonly title?: string;
}

function OpenMenuButton({
  label,
  onClick,
  secondaryLabel,
  title,
}: OpenMenuButtonProps) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-[#2e2e2d] transition-colors hover:bg-black/7"
      onClick={onClick}
      title={title}
      type="button"
    >
      <Square className="size-3.5" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {secondaryLabel ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6966]">
          {secondaryLabel}
        </span>
      ) : null}
    </button>
  );
}

interface WindowControlButtonProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly onClick: () => void;
  readonly title: string;
}

function WindowControlButton({
  children,
  className,
  onClick,
  title,
}: WindowControlButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-sm text-[#393938] transition-colors hover:bg-black/8',
        className,
      )}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function getRecentProjectLabel(project: RecentProjectDto): string {
  const segments = project.path.split(/[\\/]/);

  return segments[segments.length - 1] || project.path;
}
