import type { ConsentSettings } from "../../types";

const CONSENT_KEY = "ai-job-matcher:consent";

export const defaultConsentSettings: ConsentSettings = {
  localHistory: false,
  saveParsedProfile: false,
  saveFullResumeText: false,
  saveJobHistory: false,
  saveAiGenerations: false,
  anonymousAnalytics: false,
};

function readStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadConsentSettings(): ConsentSettings {
  const storage = readStorage();
  if (!storage) return defaultConsentSettings;
  try {
    const raw = storage.getItem(CONSENT_KEY);
    if (!raw) return defaultConsentSettings;
    return { ...defaultConsentSettings, ...(JSON.parse(raw) as Partial<ConsentSettings>) };
  } catch {
    return defaultConsentSettings;
  }
}

export function saveConsentSettings(settings: ConsentSettings): void {
  const storage = readStorage();
  if (!storage) return;
  storage.setItem(CONSENT_KEY, JSON.stringify(settings));
}

export function resetConsentSettings(): ConsentSettings {
  const storage = readStorage();
  storage?.removeItem(CONSENT_KEY);
  return defaultConsentSettings;
}
