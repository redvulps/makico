import type { AppInfoDto } from '@shared/dto/appInfo';
import type {
  AddIcnsSlotResultDto,
  AddIcoEntryResultDto,
  ExportIcoResultDto,
  ExportIcnsResultDto,
  IconProjectDto,
  IcoProjectDto,
  IcnsProjectDto,
} from '@shared/dto/iconProject';
import type { WindowStateDto } from '@shared/dto/windowState';
import type { RecentProjectDto } from '@shared/dto/appSettings';
import type { WorkbenchSettingsDto } from '@shared/dto/workbenchSettings';
import type { WorkbenchSnapshotDto } from '@shared/dto/workbenchSnapshot';

export type IcoEntryMoveDirection = 'up' | 'down';
export type WorkbenchCommand =
  | 'importIco'
  | 'importIcns'
  | 'saveProject'
  | 'saveCopy'
  | 'newProject'
  | 'undo'
  | 'redo'
  | 'deleteSelected';
export type CreateProjectFormat = 'ico' | 'icns';

/** Channel names for request/response IPC between renderer and main process. */
export const IPC_CHANNELS = {
  getAppInfo: 'app:get-info',
  getWorkbenchSnapshot: 'workbench:get-snapshot',
  getWorkbenchSettings: 'workbench:get-settings',
  getRecentProjects: 'workbench:get-recent-projects',
  updateWorkbenchSettings: 'workbench:update-settings',
  newWorkspace: 'workbench:newWorkspace',
  createProject: 'workbench:createProject',
  createProjectFromImage: 'workbench:createProjectFromImage',
  openRecentProject: 'workbench:openRecentProject',
  importDroppedProject: 'workbench:importDroppedProject',
  importIco: 'iconProject:importIco',
  importIcns: 'iconProject:importIcns',
  exportIco: 'iconProject:exportIco',
  exportIcns: 'iconProject:exportIcns',
  addIcoEntryFromPng: 'iconProject:addIcoEntryFromPng',
  addBlankIcoEntry: 'iconProject:addBlankIcoEntry',
  addIcnsSlotFromPng: 'iconProject:addIcnsSlotFromPng',
  addBlankIcnsSlot: 'iconProject:addBlankIcnsSlot',
  removeIcoEntry: 'iconProject:removeIcoEntry',
  removeIcnsChunk: 'iconProject:removeIcnsChunk',
  moveIcoEntry: 'iconProject:moveIcoEntry',
  replaceIcoEntryWithPng: 'iconProject:replaceIcoEntryWithPng',
  replaceIcoEntryWithPngBytes: 'iconProject:replaceIcoEntryWithPngBytes',
  replaceIcnsChunkWithPng: 'iconProject:replaceIcnsChunkWithPng',
  replaceIcnsChunkWithPngBytes: 'iconProject:replaceIcnsChunkWithPngBytes',
  undoIconProject: 'iconProject:undo',
  redoIconProject: 'iconProject:redo',
  resetIcoProject: 'iconProject:resetIcoProject',
  resetIcnsProject: 'iconProject:resetIcnsProject',
  windowMinimize: 'window:minimize',
  windowGetState: 'window:getState',
  windowToggleMaximize: 'window:toggleMaximize',
  windowClose: 'window:close',
} as const;

/** Channel names for one-way event broadcasts from main to renderer. */
export const IPC_EVENTS = {
  runWorkbenchCommand: 'workbench:runCommand',
  windowStateChanged: 'window:stateChanged',
} as const;

/** Type-safe contract for all IPC methods exposed to the renderer via contextBridge. */
export interface AppApi {
  getAppInfo(): Promise<AppInfoDto>;
  getWorkbenchSnapshot(): Promise<WorkbenchSnapshotDto>;
  getWorkbenchSettings(): Promise<WorkbenchSettingsDto>;
  getRecentProjects(): Promise<readonly RecentProjectDto[]>;
  updateWorkbenchSettings(
    patch: Partial<WorkbenchSettingsDto>,
  ): Promise<WorkbenchSettingsDto>;
  newWorkspace(): Promise<boolean>;
  createProject(format: CreateProjectFormat): Promise<IconProjectDto | null>;
  createProjectFromImage(
    format: CreateProjectFormat,
  ): Promise<IconProjectDto | null>;
  openRecentProject(filePath: string): Promise<IconProjectDto | null>;
  importDroppedProject(
    fileName: string,
    bytes: Uint8Array,
  ): Promise<IconProjectDto | null>;
  importIco(): Promise<IcoProjectDto | null>;
  importIcns(): Promise<IcnsProjectDto | null>;
  exportIco(projectId: string): Promise<ExportIcoResultDto | null>;
  exportIcns(projectId: string): Promise<ExportIcnsResultDto | null>;
  addIcoEntryFromPng(
    projectId: string,
    afterEntryId: string | null,
  ): Promise<AddIcoEntryResultDto | null>;
  addBlankIcoEntry(
    projectId: string,
    size: number,
    afterEntryId: string | null,
  ): Promise<AddIcoEntryResultDto>;
  addIcnsSlotFromPng(
    projectId: string,
    chunkType: string,
  ): Promise<AddIcnsSlotResultDto | null>;
  addBlankIcnsSlot(
    projectId: string,
    chunkType: string,
  ): Promise<AddIcnsSlotResultDto>;
  removeIcoEntry(projectId: string, entryId: string): Promise<IcoProjectDto>;
  removeIcnsChunk(projectId: string, chunkId: string): Promise<IcnsProjectDto>;
  moveIcoEntry(
    projectId: string,
    entryId: string,
    direction: IcoEntryMoveDirection,
  ): Promise<IcoProjectDto>;
  replaceIcoEntryWithPng(
    projectId: string,
    entryId: string,
  ): Promise<IcoProjectDto | null>;
  replaceIcoEntryWithPngBytes(
    projectId: string,
    entryId: string,
    bytes: Uint8Array,
  ): Promise<IcoProjectDto>;
  resetIcoProject(projectId: string): Promise<IcoProjectDto>;
  replaceIcnsChunkWithPng(
    projectId: string,
    chunkId: string,
  ): Promise<IcnsProjectDto | null>;
  replaceIcnsChunkWithPngBytes(
    projectId: string,
    chunkId: string,
    bytes: Uint8Array,
  ): Promise<IcnsProjectDto>;
  undoIconProject(
    projectId: string,
    format: IconProjectDto['format'],
  ): Promise<IconProjectDto>;
  redoIconProject(
    projectId: string,
    format: IconProjectDto['format'],
  ): Promise<IconProjectDto>;
  resetIcnsProject(projectId: string): Promise<IcnsProjectDto>;
  minimizeWindow(): Promise<void>;
  getWindowState(): Promise<WindowStateDto>;
  toggleMaximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  addWorkbenchCommandListener(
    listener: (command: WorkbenchCommand) => void,
  ): void;
  removeWorkbenchCommandListener(
    listener: (command: WorkbenchCommand) => void,
  ): void;
  addWindowStateListener(listener: (state: WindowStateDto) => void): void;
  removeWindowStateListener(listener: (state: WindowStateDto) => void): void;
}
