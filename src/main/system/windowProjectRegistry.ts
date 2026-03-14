import type { IconFormat } from '@domain/icon-project/value-objects/IconFormat';

export interface ActiveWindowProject {
  readonly format: IconFormat;
  readonly projectId: string;
}

class WindowProjectRegistry {
  private readonly projectsByWindowId = new Map<number, ActiveWindowProject>();

  setActiveProject(windowId: number, project: ActiveWindowProject): void {
    this.projectsByWindowId.set(windowId, project);
  }

  getActiveProject(windowId: number): ActiveWindowProject | undefined {
    return this.projectsByWindowId.get(windowId);
  }

  clearWindow(windowId: number): void {
    this.projectsByWindowId.delete(windowId);
  }
}

export const windowProjectRegistry = new WindowProjectRegistry();
