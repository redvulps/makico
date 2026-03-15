import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type CreateProjectFormat,
  type IcoEntryMoveDirection,
  type WorkbenchCommand,
} from '@shared/contracts/ipc';
import type { RecentProjectDto } from '@shared/dto/appSettings';
import type { AppInfoDto } from '@shared/dto/appInfo';
import type {
  IcnsChunkDto,
  IconProjectDto,
  IcoEntryDto,
} from '@shared/dto/iconProject';
import type { WorkbenchSnapshotDto } from '@shared/dto/workbenchSnapshot';

interface WorkbenchBootstrapState {
  readonly appInfo: AppInfoDto | null;
  readonly snapshot: WorkbenchSnapshotDto | null;
  readonly project: IconProjectDto | null;
  readonly selectedIcoEntry: IcoEntryDto | null;
  readonly selectedIcnsChunk: IcnsChunkDto | null;
  readonly selectedResourceId: string | null;
  readonly isLoading: boolean;
  readonly importingFormat: 'ico' | 'icns' | null;
  readonly isExporting: boolean;
  readonly isUpdatingProject: boolean;
  readonly error: string | null;
  readonly lastExportPath: string | null;
  readonly recentProjects: readonly RecentProjectDto[];
  readonly newWorkspace: () => Promise<void>;
  readonly createProject: (format: CreateProjectFormat) => Promise<boolean>;
  readonly createProjectFromImage: (
    format: CreateProjectFormat,
  ) => Promise<boolean>;
  readonly openRecentProject: (filePath: string) => Promise<void>;
  readonly importDroppedProject: (file: File) => Promise<void>;
  readonly importIco: () => Promise<void>;
  readonly importIcns: () => Promise<void>;
  readonly exportIco: () => Promise<void>;
  readonly exportIcns: () => Promise<void>;
  readonly selectProjectResource: (resourceId: string) => void;
  readonly addIcoEntryFromPng: () => Promise<void>;
  readonly addBlankIcoEntry: (size: number) => Promise<void>;
  readonly moveSelectedEntryUp: () => Promise<void>;
  readonly moveSelectedEntryDown: () => Promise<void>;
  readonly removeSelectedEntry: () => Promise<void>;
  readonly removeSelectedIcnsChunk: () => Promise<void>;
  readonly addIcnsSlotFromPng: (chunkType: string) => Promise<void>;
  readonly addBlankIcnsSlot: (chunkType: string) => Promise<void>;
  readonly commitSelectedBitmapEdits: (pngBytes: Uint8Array) => Promise<void>;
  readonly undoProject: () => Promise<void>;
  readonly redoProject: () => Promise<void>;
}

interface WorkbenchBootstrapData {
  readonly appInfo: AppInfoDto | null;
  readonly snapshot: WorkbenchSnapshotDto | null;
  readonly project: IconProjectDto | null;
  readonly selectedResourceId: string | null;
  readonly isLoading: boolean;
  readonly importingFormat: 'ico' | 'icns' | null;
  readonly isExporting: boolean;
  readonly isUpdatingProject: boolean;
  readonly error: string | null;
  readonly lastExportPath: string | null;
  readonly recentProjects: readonly RecentProjectDto[];
}

const initialDataState: WorkbenchBootstrapData = {
  appInfo: null,
  snapshot: null,
  project: null,
  selectedResourceId: null,
  isLoading: true,
  importingFormat: null,
  isExporting: false,
  isUpdatingProject: false,
  error: null,
  lastExportPath: null,
  recentProjects: [],
};

export function useWorkbenchBootstrap(): WorkbenchBootstrapState {
  const [dataState, setDataState] =
    useState<WorkbenchBootstrapData>(initialDataState);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap(): Promise<void> {
      try {
        const [appInfo, snapshot, recentProjects] = await Promise.all([
          window.appApi.getAppInfo(),
          window.appApi.getWorkbenchSnapshot(),
          window.appApi.getRecentProjects(),
        ]);

        if (!isMounted) {
          return;
        }

        setDataState((previousState) => ({
          ...previousState,
          appInfo,
          snapshot,
          recentProjects,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDataState((previousState) => ({
          ...previousState,
          isLoading: false,
          error: toErrorMessage(error, 'Unknown bootstrap failure.'),
        }));
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const bootstrapCommandHandler = useCallback(
    (command: WorkbenchCommand): void => {
      if (command === 'importIco') {
        void importIco();
        return;
      }

      if (command === 'importIcns') {
        void importIcns();
      }
    },
    [importIco, importIcns],
  );

  const bootstrapCommandHandlerRef = useRef(bootstrapCommandHandler);
  bootstrapCommandHandlerRef.current = bootstrapCommandHandler;

  useEffect(() => {
    const stableHandler = (command: WorkbenchCommand): void => {
      bootstrapCommandHandlerRef.current(command);
    };

    window.appApi.addWorkbenchCommandListener(stableHandler);

    return () => {
      window.appApi.removeWorkbenchCommandListener(stableHandler);
    };
  }, []);

  const selectedIcoEntry = useMemo(() => {
    if (dataState.project?.format !== 'ico') {
      return null;
    }

    if (!dataState.selectedResourceId) {
      return dataState.project.entries[0] ?? null;
    }

    return (
      dataState.project.entries.find(
        (entry) => entry.id === dataState.selectedResourceId,
      ) ??
      dataState.project.entries[0] ??
      null
    );
  }, [dataState.project, dataState.selectedResourceId]);

  const selectedIcnsChunk = useMemo(() => {
    if (dataState.project?.format !== 'icns') {
      return null;
    }

    if (!dataState.selectedResourceId) {
      return getDefaultIcnsChunk(dataState.project);
    }

    return (
      dataState.project.chunks.find(
        (chunk) => chunk.id === dataState.selectedResourceId,
      ) ?? getDefaultIcnsChunk(dataState.project)
    );
  }, [dataState.project, dataState.selectedResourceId]);

  useEffect(() => {
    if (!dataState.project) {
      if (dataState.selectedResourceId !== null) {
        setDataState((previousState) => ({
          ...previousState,
          selectedResourceId: null,
        }));
      }

      return;
    }

    const nextSelectedResourceId =
      dataState.project.format === 'ico'
        ? (selectedIcoEntry?.id ?? null)
        : (selectedIcnsChunk?.id ?? null);

    if (nextSelectedResourceId !== dataState.selectedResourceId) {
      setDataState((previousState) => ({
        ...previousState,
        selectedResourceId: nextSelectedResourceId,
      }));
    }
  }, [
    dataState.project,
    dataState.selectedResourceId,
    selectedIcoEntry,
    selectedIcnsChunk,
  ]);

  async function importIco(): Promise<void> {
    setDataState((previousState) => ({
      ...previousState,
      importingFormat: 'ico',
      error: null,
    }));

    try {
      const importedProject = await window.appApi.importIco();
      const recentProjects = importedProject
        ? await window.appApi.getRecentProjects()
        : undefined;

      setDataState((previousState) => ({
        ...previousState,
        project: importedProject ?? previousState.project,
        recentProjects: recentProjects ?? previousState.recentProjects,
        selectedResourceId: importedProject
          ? getDefaultSelectionId(importedProject)
          : previousState.selectedResourceId,
        importingFormat: null,
        lastExportPath: importedProject ? null : previousState.lastExportPath,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        importingFormat: null,
        error: toErrorMessage(error, 'ICO import failed.'),
      }));
    }
  }

  async function importIcns(): Promise<void> {
    setDataState((previousState) => ({
      ...previousState,
      importingFormat: 'icns',
      error: null,
    }));

    try {
      const importedProject = await window.appApi.importIcns();
      const recentProjects = importedProject
        ? await window.appApi.getRecentProjects()
        : undefined;

      setDataState((previousState) => ({
        ...previousState,
        project: importedProject ?? previousState.project,
        recentProjects: recentProjects ?? previousState.recentProjects,
        selectedResourceId: importedProject
          ? getDefaultSelectionId(importedProject)
          : previousState.selectedResourceId,
        importingFormat: null,
        lastExportPath: importedProject ? null : previousState.lastExportPath,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        importingFormat: null,
        error: toErrorMessage(error, 'ICNS import failed.'),
      }));
    }
  }

  async function exportIco(): Promise<void> {
    if (dataState.project?.format !== 'ico') {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isExporting: true,
      error: null,
    }));

    try {
      const result = await window.appApi.exportIco(dataState.project.id);
      const recentProjects = result
        ? await window.appApi.getRecentProjects()
        : undefined;

      setDataState((previousState) => ({
        ...previousState,
        project: result?.project ?? previousState.project,
        recentProjects: recentProjects ?? previousState.recentProjects,
        selectedResourceId: result?.project
          ? reconcileSelectedResourceId(
              result.project,
              previousState.selectedResourceId,
            )
          : previousState.selectedResourceId,
        isExporting: false,
        lastExportPath: result?.outputPath ?? previousState.lastExportPath,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isExporting: false,
        error: toErrorMessage(error, 'ICO export failed.'),
      }));
    }
  }

  async function exportIcns(): Promise<void> {
    if (dataState.project?.format !== 'icns') {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isExporting: true,
      error: null,
    }));

    try {
      const result = await window.appApi.exportIcns(dataState.project.id);
      const recentProjects = result
        ? await window.appApi.getRecentProjects()
        : undefined;

      setDataState((previousState) => ({
        ...previousState,
        project: result?.project ?? previousState.project,
        recentProjects: recentProjects ?? previousState.recentProjects,
        selectedResourceId: result?.project
          ? reconcileSelectedResourceId(
              result.project,
              previousState.selectedResourceId,
            )
          : previousState.selectedResourceId,
        isExporting: false,
        lastExportPath: result?.outputPath ?? previousState.lastExportPath,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isExporting: false,
        error: toErrorMessage(error, 'ICNS export failed.'),
      }));
    }
  }

  function selectProjectResource(resourceId: string): void {
    setDataState((previousState) => ({
      ...previousState,
      selectedResourceId: resourceId,
    }));
  }

  async function newWorkspace(): Promise<void> {
    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const didResetWorkspace = await window.appApi.newWorkspace();

      setDataState((previousState) => ({
        ...previousState,
        project: didResetWorkspace ? null : previousState.project,
        selectedResourceId: didResetWorkspace
          ? null
          : previousState.selectedResourceId,
        lastExportPath: didResetWorkspace ? null : previousState.lastExportPath,
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'Unable to start a new workspace.'),
      }));
    }
  }

  async function createProject(format: CreateProjectFormat): Promise<boolean> {
    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const nextProject = await window.appApi.createProject(format);

      setDataState((previousState) => ({
        ...previousState,
        project: nextProject ?? previousState.project,
        selectedResourceId: nextProject
          ? getDefaultSelectionId(nextProject)
          : previousState.selectedResourceId,
        lastExportPath: nextProject ? null : previousState.lastExportPath,
        isUpdatingProject: false,
      }));

      return nextProject !== null;
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'Unable to create a new project.'),
      }));

      return false;
    }
  }

  async function createProjectFromImage(
    format: CreateProjectFormat,
  ): Promise<boolean> {
    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const nextProject =
        await window.appApi.createProjectFromImage(format);

      setDataState((previousState) => ({
        ...previousState,
        project: nextProject ?? previousState.project,
        selectedResourceId: nextProject
          ? getDefaultSelectionId(nextProject)
          : previousState.selectedResourceId,
        lastExportPath: nextProject ? null : previousState.lastExportPath,
        isUpdatingProject: false,
      }));

      return nextProject !== null;
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(
          error,
          'Unable to create a project from the source image.',
        ),
      }));

      return false;
    }
  }

  async function openRecentProject(filePath: string): Promise<void> {
    const importingFormat = filePath.toLowerCase().endsWith('.icns')
      ? 'icns'
      : 'ico';

    setDataState((previousState) => ({
      ...previousState,
      importingFormat,
      error: null,
    }));

    try {
      const importedProject = await window.appApi.openRecentProject(filePath);
      const recentProjects = await window.appApi.getRecentProjects();

      setDataState((previousState) => ({
        ...previousState,
        project: importedProject ?? previousState.project,
        recentProjects,
        selectedResourceId: importedProject
          ? getDefaultSelectionId(importedProject)
          : previousState.selectedResourceId,
        importingFormat: null,
        lastExportPath: importedProject ? null : previousState.lastExportPath,
      }));
    } catch (error) {
      const recentProjects = await window.appApi.getRecentProjects();

      setDataState((previousState) => ({
        ...previousState,
        importingFormat: null,
        recentProjects,
        error: toErrorMessage(error, 'Recent project import failed.'),
      }));
    }
  }

  async function importDroppedProject(file: File): Promise<void> {
    const normalizedFileName = file.name.toLowerCase();
    const importingFormat = normalizedFileName.endsWith('.ico')
      ? 'ico'
      : normalizedFileName.endsWith('.icns')
        ? 'icns'
        : null;

    if (!importingFormat) {
      setDataState((previousState) => ({
        ...previousState,
        error: 'Dropped files must use the .ico or .icns extension.',
      }));

      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      importingFormat,
      error: null,
    }));

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const importedProject = await window.appApi.importDroppedProject(
        file.name,
        bytes,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: importedProject ?? previousState.project,
        selectedResourceId: importedProject
          ? getDefaultSelectionId(importedProject)
          : previousState.selectedResourceId,
        importingFormat: null,
        lastExportPath: importedProject ? null : previousState.lastExportPath,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        importingFormat: null,
        error: toErrorMessage(error, 'Dropped file import failed.'),
      }));
    }
  }

  async function addIcoEntryFromPng(): Promise<void> {
    if (dataState.project?.format !== 'ico') {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const result = await window.appApi.addIcoEntryFromPng(
        dataState.project.id,
        selectedIcoEntry?.id ?? null,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: result?.project ?? previousState.project,
        selectedResourceId:
          result?.addedEntryId ?? previousState.selectedResourceId,
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'ICO entry insertion failed.'),
      }));
    }
  }

  async function addBlankIcoEntry(size: number): Promise<void> {
    if (dataState.project?.format !== 'ico') {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const result = await window.appApi.addBlankIcoEntry(
        dataState.project.id,
        size,
        selectedIcoEntry?.id ?? null,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: result.project,
        selectedResourceId: result.addedEntryId,
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'Blank ICO entry creation failed.'),
      }));
    }
  }

  async function moveSelectedIcoEntry(
    direction: IcoEntryMoveDirection,
  ): Promise<void> {
    if (dataState.project?.format !== 'ico' || !selectedIcoEntry) {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const updatedProject = await window.appApi.moveIcoEntry(
        dataState.project.id,
        selectedIcoEntry.id,
        direction,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: updatedProject,
        selectedResourceId: selectedIcoEntry.id,
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'ICO entry reordering failed.'),
      }));
    }
  }

  async function removeSelectedEntry(): Promise<void> {
    if (dataState.project?.format !== 'ico' || !selectedIcoEntry) {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const updatedProject = await window.appApi.removeIcoEntry(
        dataState.project.id,
        selectedIcoEntry.id,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: updatedProject,
        selectedResourceId: reconcileSelectedResourceId(
          updatedProject,
          previousState.selectedResourceId,
        ),
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'ICO entry removal failed.'),
      }));
    }
  }

  async function removeSelectedIcnsChunk(): Promise<void> {
    if (dataState.project?.format !== 'icns' || !selectedIcnsChunk) {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const updatedProject = await window.appApi.removeIcnsChunk(
        dataState.project.id,
        selectedIcnsChunk.id,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: updatedProject,
        selectedResourceId: reconcileSelectedResourceId(
          updatedProject,
          previousState.selectedResourceId,
        ),
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'ICNS chunk removal failed.'),
      }));
    }
  }

  async function commitSelectedBitmapEdits(
    pngBytes: Uint8Array,
  ): Promise<void> {
    if (dataState.project?.format === 'ico') {
      if (!selectedIcoEntry) {
        return;
      }

      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: true,
        error: null,
      }));

      try {
        const updatedProject = await window.appApi.replaceIcoEntryWithPngBytes(
          dataState.project.id,
          selectedIcoEntry.id,
          pngBytes,
        );

        setDataState((previousState) => ({
          ...previousState,
          project: updatedProject,
          selectedResourceId: reconcileSelectedResourceId(
            updatedProject,
            selectedIcoEntry.id,
          ),
          isUpdatingProject: false,
        }));
      } catch (error) {
        setDataState((previousState) => ({
          ...previousState,
          isUpdatingProject: false,
          error: toErrorMessage(error, 'ICO bitmap update failed.'),
        }));
      }

      return;
    }

    if (dataState.project?.format === 'icns') {
      if (!selectedIcnsChunk) {
        return;
      }

      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: true,
        error: null,
      }));

      try {
        const updatedProject = await window.appApi.replaceIcnsChunkWithPngBytes(
          dataState.project.id,
          selectedIcnsChunk.id,
          pngBytes,
        );

        setDataState((previousState) => ({
          ...previousState,
          project: updatedProject,
          selectedResourceId: reconcileSelectedResourceId(
            updatedProject,
            selectedIcnsChunk.id,
          ),
          isUpdatingProject: false,
        }));
      } catch (error) {
        setDataState((previousState) => ({
          ...previousState,
          isUpdatingProject: false,
          error: toErrorMessage(error, 'ICNS bitmap update failed.'),
        }));
      }
    }
  }

  async function addIcnsSlotFromPng(chunkType: string): Promise<void> {
    if (dataState.project?.format !== 'icns') {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const result = await window.appApi.addIcnsSlotFromPng(
        dataState.project.id,
        chunkType,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: result?.project ?? previousState.project,
        selectedResourceId:
          result?.addedChunkId ?? previousState.selectedResourceId,
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'ICNS slot creation failed.'),
      }));
    }
  }

  async function addBlankIcnsSlot(chunkType: string): Promise<void> {
    if (dataState.project?.format !== 'icns') {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const result = await window.appApi.addBlankIcnsSlot(
        dataState.project.id,
        chunkType,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: result.project,
        selectedResourceId: result.addedChunkId,
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'Blank ICNS slot creation failed.'),
      }));
    }
  }

  async function undoProject(): Promise<void> {
    if (!dataState.project || !dataState.project.canUndo) {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const updatedProject = await window.appApi.undoIconProject(
        dataState.project.id,
        dataState.project.format,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: updatedProject,
        selectedResourceId: reconcileSelectedResourceId(
          updatedProject,
          previousState.selectedResourceId,
        ),
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'Project undo failed.'),
      }));
    }
  }

  async function redoProject(): Promise<void> {
    if (!dataState.project || !dataState.project.canRedo) {
      return;
    }

    setDataState((previousState) => ({
      ...previousState,
      isUpdatingProject: true,
      error: null,
    }));

    try {
      const updatedProject = await window.appApi.redoIconProject(
        dataState.project.id,
        dataState.project.format,
      );

      setDataState((previousState) => ({
        ...previousState,
        project: updatedProject,
        selectedResourceId: reconcileSelectedResourceId(
          updatedProject,
          previousState.selectedResourceId,
        ),
        isUpdatingProject: false,
      }));
    } catch (error) {
      setDataState((previousState) => ({
        ...previousState,
        isUpdatingProject: false,
        error: toErrorMessage(error, 'Project redo failed.'),
      }));
    }
  }

  return {
    ...dataState,
    selectedIcoEntry,
    selectedIcnsChunk,
    newWorkspace,
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
    moveSelectedEntryUp: () => moveSelectedIcoEntry('up'),
    moveSelectedEntryDown: () => moveSelectedIcoEntry('down'),
    removeSelectedEntry,
    removeSelectedIcnsChunk,
    commitSelectedBitmapEdits,
    undoProject,
    redoProject,
  };
}

function getDefaultSelectionId(project: IconProjectDto): string | null {
  if (project.format === 'ico') {
    return project.entries[0]?.id ?? null;
  }

  return getDefaultIcnsChunk(project)?.id ?? null;
}

function getDefaultIcnsChunk(
  project: Extract<IconProjectDto, { format: 'icns' }>,
) {
  return (
    project.chunks.find((chunk) => chunk.isSupported) ??
    project.chunks.find((chunk) => chunk.previewDataUrl) ??
    project.chunks.find((chunk) => chunk.isImageChunk) ??
    project.chunks[0] ??
    null
  );
}

function reconcileSelectedResourceId(
  project: IconProjectDto,
  preferredResourceId: string | null,
): string | null {
  if (project.format === 'ico') {
    if (
      preferredResourceId &&
      project.entries.some((entry) => entry.id === preferredResourceId)
    ) {
      return preferredResourceId;
    }

    return project.entries[0]?.id ?? null;
  }

  if (
    preferredResourceId &&
    project.chunks.some((chunk) => chunk.id === preferredResourceId)
  ) {
    return preferredResourceId;
  }

  return getDefaultSelectionId(project);
}

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}
