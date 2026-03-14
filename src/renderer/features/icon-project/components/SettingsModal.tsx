import type { AppInfoDto } from '@shared/dto/appInfo';
import type { WorkbenchSettingsDto } from '@shared/dto/workbenchSettings';

import { WorkbenchModalShell } from './WorkbenchModalShell';

interface SettingsModalProps {
  readonly appInfo: AppInfoDto;
  readonly preferences: WorkbenchSettingsDto;
  readonly onClose: () => void;
  readonly onPreferenceChange: <K extends keyof WorkbenchSettingsDto>(
    key: K,
    value: WorkbenchSettingsDto[K],
  ) => Promise<void>;
}

export function SettingsModal({
  appInfo,
  preferences,
  onClose,
  onPreferenceChange,
}: SettingsModalProps) {
  return (
    <WorkbenchModalShell onClose={onClose} title="Settings">
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a6865]">
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
        </section>

        <aside className="border border-black/18 bg-[#e2e0dd] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a6865]">
            Runtime
          </p>
          <dl className="mt-4 space-y-3 text-sm text-[#444341]">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a6865]">
                App
              </dt>
              <dd className="mt-1">{appInfo.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a6865]">
                Platform
              </dt>
              <dd className="mt-1">{appInfo.platform}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a6865]">
                Electron
              </dt>
              <dd className="mt-1">{appInfo.versions.electron}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </WorkbenchModalShell>
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
    <label className="flex cursor-pointer items-start gap-4 border border-black/18 bg-[#e2e0dd] p-4">
      <input
        checked={checked}
        className="mt-1 size-4 accent-[#4b4b4a]"
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        type="checkbox"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#2e2d2b]">
          {label}
        </span>
        <span className="mt-1.5 block text-sm leading-6 text-[#5d5b58]">
          {description}
        </span>
      </span>
    </label>
  );
}
