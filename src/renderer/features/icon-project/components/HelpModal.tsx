import { WorkbenchModalShell } from './WorkbenchModalShell';

const isMac = navigator.platform.toUpperCase().includes('MAC');
const mod = isMac ? '\u2318' : 'Ctrl';

interface ShortcutEntry {
  readonly label: string;
  readonly keys: string;
}

const fileShortcuts: readonly ShortcutEntry[] = [
  { label: 'New project', keys: `${mod}+N` },
  { label: 'Save', keys: `${mod}+S` },
  { label: 'Save a copy', keys: `${mod}+Shift+S` },
];

const editShortcuts: readonly ShortcutEntry[] = [
  { label: 'Undo', keys: `${mod}+Z` },
  { label: 'Redo', keys: isMac ? `${mod}+Shift+Z` : 'Ctrl+Y' },
  { label: 'Delete selected', keys: 'Del' },
];

const toolShortcuts: readonly ShortcutEntry[] = [
  { label: 'Brush', keys: 'B' },
  { label: 'Eraser', keys: 'E' },
  { label: 'Pick color', keys: 'Alt+Click' },
];

const canvasShortcuts: readonly ShortcutEntry[] = [
  { label: 'Zoom in / out', keys: 'Scroll' },
  { label: 'Pan', keys: 'Middle+Drag' },
];

const viewShortcuts: readonly ShortcutEntry[] = [
  { label: 'Help', keys: 'F1' },
];

export function HelpModal({ onClose }: { readonly onClose: () => void }) {
  return (
    <WorkbenchModalShell className="max-w-md" onClose={onClose} title="Keyboard shortcuts">
      <div className="max-h-[calc(100vh-10rem)] space-y-5 py-5 overflow-y-auto px-5 pb-5">
        <ShortcutSection title="File" entries={fileShortcuts} />
        <ShortcutSection title="Edit" entries={editShortcuts} />
        <ShortcutSection title="Tools" entries={toolShortcuts} />
        <ShortcutSection title="Canvas" entries={canvasShortcuts} />
        <ShortcutSection title="View" entries={viewShortcuts} />
      </div>
    </WorkbenchModalShell>
  );
}

function ShortcutSection({
  title,
  entries,
}: {
  readonly title: string;
  readonly entries: readonly ShortcutEntry[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 border-t border-border">
        {entries.map((entry) => (
          <ShortcutRow key={entry.label} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function ShortcutRow({ entry }: { readonly entry: ShortcutEntry }) {
  const parts = entry.keys.split('+').map((k) => k.trim());

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-foreground/80">{entry.label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {parts.map((part, index) => (
          <Kbd key={index}>{part}</Kbd>
        ))}
      </span>
    </div>
  );
}

function Kbd({ children }: { readonly children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded-md border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none text-foreground/80 shadow-sm">
      {children}
    </kbd>
  );
}
