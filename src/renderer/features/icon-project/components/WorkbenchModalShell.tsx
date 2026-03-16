import { useEffect, type ReactNode } from 'react';

import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface WorkbenchModalShellProps {
  readonly children: ReactNode;
  readonly title: string;
  readonly onClose: () => void;
  readonly className?: string;
}

export function WorkbenchModalShell({
  children,
  title,
  onClose,
  className,
}: WorkbenchModalShellProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} role="presentation" />
      <div
        className={cn(
          'relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
            {title}
          </h2>
          <button
            className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
