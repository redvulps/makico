import path from 'node:path';

export function createSuggestedIcoOutputPath(
  session: {
    sourcePath: string | null;
    name: string;
  },
  preferredDirectory?: string | null,
): string {
  if (session.sourcePath) {
    const parsedPath = path.parse(session.sourcePath);

    return path.format({
      dir: preferredDirectory ?? parsedPath.dir,
      name: `${parsedPath.name}-makico`,
      ext: '.ico',
    });
  }

  return path.join(
    preferredDirectory ?? process.cwd(),
    `${path.parse(session.name).name || 'makico-export'}.ico`,
  );
}
