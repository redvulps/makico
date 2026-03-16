import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpModal } from '@/features/icon-project/components/HelpModal';
import { NewProjectModal } from '@/features/icon-project/components/NewProjectModal';
import { SettingsModal } from '@/features/icon-project/components/SettingsModal';
import { WindowTitleBar } from '@/features/icon-project/components/WindowTitleBar';
import { WorkbenchCanvas } from '@/features/icon-project/components/WorkbenchCanvas';
import { WorkbenchResourceRail } from '@/features/icon-project/components/WorkbenchResourceRail';
import { WorkbenchToolPanel } from '@/features/icon-project/components/WorkbenchToolPanel';
import { useWorkbenchBootstrap } from '@/features/icon-project/hooks/useWorkbenchBootstrap';
import { usePixelEditorDraft } from '@/features/icon-project/hooks/usePixelEditorDraft';
import { useWorkbenchPreferences } from '@/features/icon-project/hooks/useWorkbenchPreferences';
import type { WorkbenchCommand } from '@shared/contracts/ipc';
import type { IconProjectDto } from '@shared/dto/iconProject';
import type { WindowStateDto } from '@shared/dto/windowState';

export function EditorPage() {
  const {
    appInfo,
    snapshot,
    project,
    selectedIcoEntry,
    selectedIcnsChunk,
    selectedResourceId,
    isLoading,
    importingFormat,
    isExporting,
    isUpdatingProject,
    error,
    recentProjects,
    createProject,
    createProjectFromImage,
    openRecentProject,
    importDroppedProject,
    importIco,
    importIcns,
    exportIco,
    exportIcns,
    selectProjectResource,
    addIcoEntryFromPng,
    addBlankIcoEntry,
    addIcnsSlotFromPng,
    addBlankIcnsSlot,
    moveSelectedEntryUp,
    moveSelectedEntryDown,
    removeSelectedEntry,
    removeSelectedIcnsChunk,
    commitSelectedBitmapEdits,
    undoProject,
    redoProject,
  } = useWorkbenchBootstrap();
  const [isDragActive, setIsDragActive] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'newProject' | 'settings' | 'help' | null
  >(null);
  const [windowState, setWindowState] = useState<WindowStateDto>({
    isMaximized: false,
  });
  const dragDepthRef = useRef(0);
  const { preferences, updatePreference } = useWorkbenchPreferences();
  const pixelEditor = usePixelEditorDraft({
    project,
    selectedIcoEntry,
    selectedIcnsChunk,
    onCommitPngBytes: commitSelectedBitmapEdits,
  });
  const canUndo = pixelEditor.canUndo || (project?.canUndo ?? false);
  const canRedo = pixelEditor.canRedo || (project?.canRedo ?? false);

  const editorCommandHandler = useCallback(
    (command: WorkbenchCommand): void => {
      if (command === 'newProject') {
        setActiveModal('newProject');
        return;
      }

      if (command === 'saveProject' || command === 'saveCopy') {
        if (project?.format === 'icns') {
          void exportIcns();
          return;
        }

        if (project?.format === 'ico') {
          void exportIco();
        }

        return;
      }

      if (command === 'undo') {
        if (pixelEditor.canUndo) {
          pixelEditor.undo();
          return;
        }

        if (project?.canUndo) {
          void undoProject();
        }

        return;
      }

      if (command === 'redo') {
        if (pixelEditor.canRedo) {
          pixelEditor.redo();
          return;
        }

        if (project?.canRedo) {
          void redoProject();
        }

        return;
      }

      if (command === 'deleteSelected') {
        if (
          project?.format === 'ico' &&
          selectedIcoEntry &&
          project.entryCount > 1
        ) {
          void removeSelectedEntry();
          return;
        }

        if (project?.format === 'icns' && selectedIcnsChunk) {
          void removeSelectedIcnsChunk();
        }
      }
    },
    [
      exportIco,
      exportIcns,
      pixelEditor,
      project,
      redoProject,
      removeSelectedIcnsChunk,
      removeSelectedEntry,
      selectedIcnsChunk,
      selectedIcoEntry,
      undoProject,
    ],
  );

  const editorCommandHandlerRef = useRef(editorCommandHandler);
  editorCommandHandlerRef.current = editorCommandHandler;

  useEffect(() => {
    const stableHandler = (command: WorkbenchCommand): void => {
      editorCommandHandlerRef.current(command);
    };

    window.appApi.addWorkbenchCommandListener(stableHandler);

    return () => {
      window.appApi.removeWorkbenchCommandListener(stableHandler);
    };
  }, []);

  // Tool and global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'F1') {
        event.preventDefault();
        setActiveModal('help');
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === 'b' || event.key === 'B') {
        pixelEditor.setActiveTool('pen');
        return;
      }

      if (event.key === 'e' || event.key === 'E') {
        pixelEditor.setActiveTool('eraser');
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pixelEditor.setActiveTool]);

  useEffect(() => {
    let isMounted = true;

    void window.appApi.getWindowState().then((nextWindowState) => {
      if (!isMounted) {
        return;
      }

      setWindowState(nextWindowState);
    });

    const handleWindowStateChange = (nextWindowState: WindowStateDto): void => {
      setWindowState(nextWindowState);
    };

    window.appApi.addWindowStateListener(handleWindowStateChange);

    return () => {
      isMounted = false;
      window.appApi.removeWindowStateListener(handleWindowStateChange);
    };
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Booting Makico workbench</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Starting Electron main, preload bridge, and renderer composition.
          </CardContent>
        </Card>
      </main>
    );
  }

  if ((!appInfo || !snapshot) && error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-xl border-destructive/40">
          <CardHeader>
            <CardTitle>Workbench bootstrap failed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-destructive">{error}</CardContent>
        </Card>
      </main>
    );
  }

  if (!appInfo || !snapshot) {
    return null;
  }

  return (
    <main
      className="relative min-h-screen bg-background"
      onDragEnter={(event) => {
        if (!containsFileTransfer(event)) {
          return;
        }

        event.preventDefault();
        dragDepthRef.current += 1;
        setIsDragActive(true);
      }}
      onDragLeave={(event) => {
        if (!containsFileTransfer(event)) {
          return;
        }

        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

        if (dragDepthRef.current === 0) {
          setIsDragActive(false);
        }
      }}
      onDragOver={(event) => {
        if (!containsFileTransfer(event)) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setIsDragActive(true);
      }}
      onDrop={(event) => {
        if (!containsFileTransfer(event)) {
          return;
        }

        event.preventDefault();
        dragDepthRef.current = 0;
        setIsDragActive(false);

        const droppedFile = event.dataTransfer.files[0];

        if (!droppedFile) {
          return;
        }

        setActiveModal(null);
        void importDroppedProject(droppedFile);
      }}
    >
      {isDragActive ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-card px-10 py-9 text-center shadow-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Drop to import
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground">
              Release an ICO or ICNS file
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The dropped file will run through the same guarded main-process
              import flow as the titlebar Open action.
            </p>
          </div>
        </div>
      ) : null}

      {activeModal === 'newProject' ? (
        <NewProjectModal
          isBusy={isUpdatingProject}
          onClose={() => {
            setActiveModal(null);
          }}
          onCreateIcnsProject={async () => {
            const didCreateProject = await createProject('icns');

            if (didCreateProject) {
              setActiveModal(null);
            }
          }}
          onCreateIcoProject={async () => {
            const didCreateProject = await createProject('ico');

            if (didCreateProject) {
              setActiveModal(null);
            }
          }}
          onCreateIcoFromImage={async () => {
            const didCreateProject = await createProjectFromImage('ico');

            if (didCreateProject) {
              setActiveModal(null);
            }
          }}
          onCreateIcnsFromImage={async () => {
            const didCreateProject = await createProjectFromImage('icns');

            if (didCreateProject) {
              setActiveModal(null);
            }
          }}
        />
      ) : null}
      {activeModal === 'settings' ? (
        <SettingsModal
          onClose={() => {
            setActiveModal(null);
          }}
          onPreferenceChange={updatePreference}
          preferences={preferences}
        />
      ) : null}
      {activeModal === 'help' ? (
        <HelpModal
          onClose={() => {
            setActiveModal(null);
          }}
        />
      ) : null}

      <div className="flex min-h-screen flex-col overflow-hidden border border-border bg-card shadow-2xl">
        <WindowTitleBar
          importingFormat={importingFormat}
          isExporting={isExporting}
          isUpdatingProject={isUpdatingProject}
          isWindowMaximized={windowState.isMaximized}
          onCloseWindow={() => window.appApi.closeWindow()}
          onMinimizeWindow={() => window.appApi.minimizeWindow()}
          onOpenHelpModal={() => {
            setActiveModal('help');
          }}
          onOpenIco={async () => {
            setActiveModal(null);
            await importIco();
          }}
          onOpenIcns={async () => {
            setActiveModal(null);
            await importIcns();
          }}
          onOpenRecentProject={async (filePath) => {
            setActiveModal(null);
            await openRecentProject(filePath);
          }}
          onOpenNewProjectModal={() => {
            setActiveModal('newProject');
          }}
          onOpenSettingsModal={() => {
            setActiveModal('settings');
          }}
          onSaveCopy={async () => {
            if (project?.format === 'icns') {
              await exportIcns();
              return;
            }

            if (project?.format === 'ico') {
              await exportIco();
            }
          }}
          onSaveProject={async () => {
            if (project?.format === 'icns') {
              await exportIcns();
              return;
            }

            if (project?.format === 'ico') {
              await exportIco();
            }
          }}
          onToggleMaximizeWindow={() => window.appApi.toggleMaximizeWindow()}
          project={project}
          recentProjects={recentProjects}
        />

        {error ? (
          <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(0,1fr)_220px]">
          <WorkbenchResourceRail
            icnsSlots={snapshot.icnsSlots}
            isUpdatingProject={isUpdatingProject}
            onAddBlankIcnsSlot={addBlankIcnsSlot}
            onAddBlankIcoEntry={addBlankIcoEntry}
            onAddIcnsSlot={addIcnsSlotFromPng}
            onAddIcoEntry={addIcoEntryFromPng}
            onRemoveSelectedIcnsChunk={removeSelectedIcnsChunk}
            onMoveSelectedIcoEntryDown={moveSelectedEntryDown}
            onMoveSelectedIcoEntryUp={moveSelectedEntryUp}
            onRemoveSelectedIcoEntry={removeSelectedEntry}
            onSelectResource={selectProjectResource}
            previewSizes={snapshot.previewSizes}
            project={project}
            selectedResourceId={selectedResourceId}
          />
          <WorkbenchCanvas
            project={project}
            pixelEditor={pixelEditor}
            selectedIcnsChunk={selectedIcnsChunk}
            selectedIcoEntry={selectedIcoEntry}
            selectedSummary={getSelectedSummary(
              project,
              selectedIcoEntry,
              selectedIcnsChunk,
            )}
            pixelateSmallPreviews={preferences.pixelateSmallPreviews}
            showPixelGrid={preferences.showPixelGrid}
          />
          <WorkbenchToolPanel
            canRedo={canRedo}
            canUndo={canUndo}
            isUpdatingProject={isUpdatingProject}
            onRedo={() => {
              if (pixelEditor.canRedo) {
                pixelEditor.redo();
                return;
              }

              return redoProject();
            }}
            pixelEditor={pixelEditor}
            onUndo={() => {
              if (pixelEditor.canUndo) {
                pixelEditor.undo();
                return;
              }

              return undoProject();
            }}
          />
        </div>
      </div>
    </main>
  );
}

function containsFileTransfer(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files');
}

function getSelectedSummary(
  project: IconProjectDto | null,
  selectedIcoEntry: ReturnType<
    typeof useWorkbenchBootstrap
  >['selectedIcoEntry'],
  selectedIcnsChunk: ReturnType<
    typeof useWorkbenchBootstrap
  >['selectedIcnsChunk'],
): string | null {
  if (!project) {
    return null;
  }

  if (project.format === 'ico') {
    return selectedIcoEntry
      ? `${selectedIcoEntry.width} x ${selectedIcoEntry.height} ${selectedIcoEntry.payloadKind.toUpperCase()}`
      : null;
  }

  return selectedIcnsChunk
    ? `${selectedIcnsChunk.type}${selectedIcnsChunk.slot ? ` ${selectedIcnsChunk.slot.label}` : ''} ${selectedIcnsChunk.payloadFamily}`
    : null;
}
