import { useEffect, useRef, useState } from 'react';

import {
  defaultWorkbenchSettings,
  type WorkbenchSettingsDto,
} from '@shared/dto/workbenchSettings';

export type WorkbenchPreferences = WorkbenchSettingsDto;

export function useWorkbenchPreferences() {
  const [preferences, setPreferences] = useState<WorkbenchPreferences>(
    defaultWorkbenchSettings,
  );
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    let isMounted = true;

    async function hydratePreferences(): Promise<void> {
      try {
        const persistedPreferences = await window.appApi.getWorkbenchSettings();

        if (!isMounted) {
          return;
        }

        preferencesRef.current = persistedPreferences;
        setPreferences(persistedPreferences);
      } catch {
        if (!isMounted) {
          return;
        }

        preferencesRef.current = defaultWorkbenchSettings;
        setPreferences(defaultWorkbenchSettings);
      }
    }

    void hydratePreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  async function updatePreference<K extends keyof WorkbenchPreferences>(
    key: K,
    value: WorkbenchPreferences[K],
  ): Promise<void> {
    const previousPreferences = preferencesRef.current;
    const optimisticPreferences = {
      ...previousPreferences,
      [key]: value,
    };

    preferencesRef.current = optimisticPreferences;
    setPreferences(optimisticPreferences);

    try {
      const persistedPreferences = await window.appApi.updateWorkbenchSettings({
        [key]: value,
      });

      preferencesRef.current = persistedPreferences;
      setPreferences(persistedPreferences);
    } catch {
      preferencesRef.current = previousPreferences;
      setPreferences(previousPreferences);
    }
  }

  return {
    preferences,
    updatePreference,
  };
}
