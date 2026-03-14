import { ipcRenderer, type IpcRendererEvent } from 'electron';

import { IPC_CHANNELS, IPC_EVENTS } from '@shared/contracts/ipc';
import type { AppApi, WorkbenchCommand } from '@shared/contracts/ipc';
import type { WindowStateDto } from '@shared/dto/windowState';

type WorkbenchCommandListener = (command: WorkbenchCommand) => void;
type WindowStateListener = (state: WindowStateDto) => void;

const workbenchCommandListeners = new Map<
  WorkbenchCommandListener,
  (_event: IpcRendererEvent, command: WorkbenchCommand) => void
>();
const windowStateListeners = new Map<
  WindowStateListener,
  (_event: IpcRendererEvent, state: WindowStateDto) => void
>();

export const appApi: AppApi = {
  getAppInfo() {
    return ipcRenderer.invoke(IPC_CHANNELS.getAppInfo);
  },
  getWorkbenchSnapshot() {
    return ipcRenderer.invoke(IPC_CHANNELS.getWorkbenchSnapshot);
  },
  getWorkbenchSettings() {
    return ipcRenderer.invoke(IPC_CHANNELS.getWorkbenchSettings);
  },
  getRecentProjects() {
    return ipcRenderer.invoke(IPC_CHANNELS.getRecentProjects);
  },
  updateWorkbenchSettings(patch) {
    return ipcRenderer.invoke(IPC_CHANNELS.updateWorkbenchSettings, patch);
  },
  newWorkspace() {
    return ipcRenderer.invoke(IPC_CHANNELS.newWorkspace);
  },
  createProject(format) {
    return ipcRenderer.invoke(IPC_CHANNELS.createProject, format);
  },
  createProjectFromImage(format) {
    return ipcRenderer.invoke(IPC_CHANNELS.createProjectFromImage, format);
  },
  openRecentProject(filePath) {
    return ipcRenderer.invoke(IPC_CHANNELS.openRecentProject, filePath);
  },
  importDroppedProject(fileName, bytes) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.importDroppedProject,
      fileName,
      bytes,
    );
  },
  importIco() {
    return ipcRenderer.invoke(IPC_CHANNELS.importIco);
  },
  importIcns() {
    return ipcRenderer.invoke(IPC_CHANNELS.importIcns);
  },
  exportIco(projectId) {
    return ipcRenderer.invoke(IPC_CHANNELS.exportIco, projectId);
  },
  exportIcns(projectId) {
    return ipcRenderer.invoke(IPC_CHANNELS.exportIcns, projectId);
  },
  addIcoEntryFromPng(projectId, afterEntryId) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.addIcoEntryFromPng,
      projectId,
      afterEntryId,
    );
  },
  addBlankIcoEntry(projectId, size, afterEntryId) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.addBlankIcoEntry,
      projectId,
      size,
      afterEntryId,
    );
  },
  addIcnsSlotFromPng(projectId, chunkType) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.addIcnsSlotFromPng,
      projectId,
      chunkType,
    );
  },
  addBlankIcnsSlot(projectId, chunkType) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.addBlankIcnsSlot,
      projectId,
      chunkType,
    );
  },
  removeIcoEntry(projectId, entryId) {
    return ipcRenderer.invoke(IPC_CHANNELS.removeIcoEntry, projectId, entryId);
  },
  removeIcnsChunk(projectId, chunkId) {
    return ipcRenderer.invoke(IPC_CHANNELS.removeIcnsChunk, projectId, chunkId);
  },
  moveIcoEntry(projectId, entryId, direction) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.moveIcoEntry,
      projectId,
      entryId,
      direction,
    );
  },
  replaceIcoEntryWithPng(projectId, entryId) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.replaceIcoEntryWithPng,
      projectId,
      entryId,
    );
  },
  replaceIcoEntryWithPngBytes(projectId, entryId, bytes) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.replaceIcoEntryWithPngBytes,
      projectId,
      entryId,
      bytes,
    );
  },
  resetIcoProject(projectId) {
    return ipcRenderer.invoke(IPC_CHANNELS.resetIcoProject, projectId);
  },
  replaceIcnsChunkWithPng(projectId, chunkId) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.replaceIcnsChunkWithPng,
      projectId,
      chunkId,
    );
  },
  replaceIcnsChunkWithPngBytes(projectId, chunkId, bytes) {
    return ipcRenderer.invoke(
      IPC_CHANNELS.replaceIcnsChunkWithPngBytes,
      projectId,
      chunkId,
      bytes,
    );
  },
  undoIconProject(projectId, format) {
    return ipcRenderer.invoke(IPC_CHANNELS.undoIconProject, projectId, format);
  },
  redoIconProject(projectId, format) {
    return ipcRenderer.invoke(IPC_CHANNELS.redoIconProject, projectId, format);
  },
  resetIcnsProject(projectId) {
    return ipcRenderer.invoke(IPC_CHANNELS.resetIcnsProject, projectId);
  },
  minimizeWindow() {
    return ipcRenderer.invoke(IPC_CHANNELS.windowMinimize);
  },
  getWindowState() {
    return ipcRenderer.invoke(IPC_CHANNELS.windowGetState);
  },
  toggleMaximizeWindow() {
    return ipcRenderer.invoke(IPC_CHANNELS.windowToggleMaximize);
  },
  closeWindow() {
    return ipcRenderer.invoke(IPC_CHANNELS.windowClose);
  },
  addWorkbenchCommandListener(listener) {
    const wrappedListener = (
      _event: IpcRendererEvent,
      command: WorkbenchCommand,
    ) => {
      listener(command);
    };

    workbenchCommandListeners.set(listener, wrappedListener);
    ipcRenderer.on(IPC_EVENTS.runWorkbenchCommand, wrappedListener);
  },
  removeWorkbenchCommandListener(listener) {
    const wrappedListener = workbenchCommandListeners.get(listener);

    if (!wrappedListener) {
      return;
    }

    ipcRenderer.off(IPC_EVENTS.runWorkbenchCommand, wrappedListener);
    workbenchCommandListeners.delete(listener);
  },
  addWindowStateListener(listener) {
    const wrappedListener = (
      _event: IpcRendererEvent,
      state: WindowStateDto,
    ) => {
      listener(state);
    };

    windowStateListeners.set(listener, wrappedListener);
    ipcRenderer.on(IPC_EVENTS.windowStateChanged, wrappedListener);
  },
  removeWindowStateListener(listener) {
    const wrappedListener = windowStateListeners.get(listener);

    if (!wrappedListener) {
      return;
    }

    ipcRenderer.off(IPC_EVENTS.windowStateChanged, wrappedListener);
    windowStateListeners.delete(listener);
  },
};
