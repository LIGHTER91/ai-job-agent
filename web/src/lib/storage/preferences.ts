import type { LocalAgentPreferences } from "../../types";

const PREFERENCES_KEY = "ai-job-matcher:preferences";

function readStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadPreferences(): LocalAgentPreferences {
  const storage = readStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(PREFERENCES_KEY);
    return raw ? (JSON.parse(raw) as LocalAgentPreferences) : {};
  } catch {
    return {};
  }
}

export function savePreferences(next: LocalAgentPreferences): void {
  const storage = readStorage();
  if (!storage) return;
  storage.setItem(PREFERENCES_KEY, JSON.stringify(next));
}

export function mergePreferences(patch: LocalAgentPreferences): LocalAgentPreferences {
  const next = { ...loadPreferences(), ...patch };
  savePreferences(next);
  return next;
}
