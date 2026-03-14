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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(56,54,51,0.46)] p-6">
      <div className="absolute inset-0" onClick={onClose} role="presentation" />
      <div
        className={cn(
          'relative z-10 flex w-full max-w-2xl flex-col border border-black/24 bg-[#d8d6d3] shadow-[0_30px_90px_-45px_rgba(0,0,0,0.68)]',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-black/18 px-5 py-4">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#2d2d2c]">
            {title}
          </h2>
          <button
            className="inline-flex size-9 items-center justify-center rounded-sm text-[#4b4a48] transition-colors hover:bg-black/8"
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
