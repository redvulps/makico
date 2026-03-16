import type { ActiveWindowProject } from './windowProjectRegistry';
import type { IcnsProjectSession } from '@application/use-cases/importIcns/importIcnsProject';
import type { IcoProjectSession } from '@application/use-cases/importIco/importIcoProject';

/**
 * In-memory store for active icon project sessions.
 *
 * ICO and ICNS sessions are stored in separate maps intentionally — they have
 * different shapes (`ParsedIcoEntry[]` vs `ParsedIcnsChunk[]`) and keeping them
 * segregated avoids type narrowing at every access site.
 */
class IconProjectSessionStore {
  private readonly icoSessions = new Map<string, IcoProjectSession>();
  private readonly icnsSessions = new Map<string, IcnsProjectSession>();

  saveIcoProject(session: IcoProjectSession): void {
    this.icoSessions.set(session.id, session);
  }

  getIcoProject(projectId: string): IcoProjectSession | undefined {
    return this.icoSessions.get(projectId);
  }

  deleteIcoProject(projectId: string): void {
    this.icoSessions.delete(projectId);
  }

  saveIcnsProject(session: IcnsProjectSession): void {
    this.icnsSessions.set(session.id, session);
  }

  getIcnsProject(projectId: string): IcnsProjectSession | undefined {
    return this.icnsSessions.get(projectId);
  }

  deleteIcnsProject(projectId: string): void {
    this.icnsSessions.delete(projectId);
  }

  getProjectSession(
    project: ActiveWindowProject,
  ): IcoProjectSession | IcnsProjectSession | undefined {
    if (project.format === 'ico') {
      return this.getIcoProject(project.projectId);
    }

    return this.getIcnsProject(project.projectId);
  }

  deleteProjectSession(project: ActiveWindowProject): void {
    if (project.format === 'ico') {
      this.deleteIcoProject(project.projectId);
      return;
    }

    this.deleteIcnsProject(project.projectId);
  }
}

export const iconProjectSessionStore = new IconProjectSessionStore();
