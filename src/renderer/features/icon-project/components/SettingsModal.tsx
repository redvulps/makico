import { Moon, Monitor, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { WorkbenchSettingsDto } from '@shared/dto/workbenchSettings';

import { WorkbenchModalShell } from './WorkbenchModalShell';

interface SettingsModalProps {
  readonly preferences: WorkbenchSettingsDto;
  readonly onClose: () => void;
  readonly onPreferenceChange: <K extends keyof WorkbenchSettingsDto>(
    key: K,
    value: WorkbenchSettingsDto[K],
  ) => Promise<void>;
}

export function SettingsModal({
  preferences,
  onClose,
  onPreferenceChange,
}: SettingsModalProps) {
  return (
    <WorkbenchModalShell onClose={onClose} title="Settings">
      <div className="space-y-6 p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Appearance
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <ThemeOption
              icon={Sun}
              isSelected={preferences.theme === 'light'}
              label="Light"
              onClick={() => {
                void onPreferenceChange('theme', 'light');
              }}
            />
            <ThemeOption
              icon={Moon}
              isSelected={preferences.theme === 'dark'}
              label="Dark"
              onClick={() => {
                void onPreferenceChange('theme', 'dark');
              }}
            />
            <ThemeOption
              icon={Monitor}
              isSelected={preferences.theme === 'system'}
              label="System"
              onClick={() => {
                void onPreferenceChange('theme', 'system');
              }}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Canvas
          </p>
          <div className="mt-3 space-y-3">
            <SettingToggle
              checked={preferences.showPixelGrid}
              description="Show the pixel-grid background behind the active preview canvas."
              label="Show pixel grid"
              onChange={(checked) => {
                void onPreferenceChange('showPixelGrid', checked);
              }}
            />
            <SettingToggle
              checked={preferences.pixelateSmallPreviews}
              description="Use pixelated scaling for small assets so icon edges stay crisp."
              label="Pixelate small previews"
              onChange={(checked) => {
                void onPreferenceChange('pixelateSmallPreviews', checked);
              }}
            />
          </div>
        </div>
      </div>
    </WorkbenchModalShell>
  );
}

function ThemeOption({
  icon: Icon,
  isSelected,
  label,
  onClick,
}: {
  readonly icon: typeof Sun;
  readonly isSelected: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors',
        isSelected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-accent',
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-border bg-muted p-4">
      <input
        checked={checked}
        className="mt-1 size-4 accent-primary"
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        type="checkbox"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-1.5 block text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
