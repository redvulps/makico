import { WorkbenchModalShell } from './WorkbenchModalShell';

export function HelpModal({ onClose }: { readonly onClose: () => void }) {
  return (
    <WorkbenchModalShell className="max-w-3xl" onClose={onClose} title="Help">
      <div className="min-h-96 bg-[#e6e4e1]" />
    </WorkbenchModalShell>
  );
}
