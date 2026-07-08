import type {
  CandidateProfileSnapshot,
  DismissedJob,
  GeneratedApplication,
  JobAnalysisSnapshot,
  LocalAgentMemory,
  SavedJob,
} from "../../types";
import { loadConsentSettings, saveConsentSettings } from "./consent";
import { clearStores, getDb, nowIso } from "./db";
import { loadPreferences, savePreferences } from "./preferences";

export async function exportLocalData(): Promise<LocalAgentMemory> {
  const db = await getDb();
  return {
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    consent: loadConsentSettings(),
    candidateProfiles: await db.getAll("candidateProfiles"),
    jobAnalysisHistory: await db.getAll("jobAnalysisHistory"),
    savedJobs: await db.getAll("savedJobs"),
    dismissedJobs: await db.getAll("dismissedJobs"),
    generatedApplications: await db.getAll("generatedApplications"),
    preferences: loadPreferences(),
  };
}

export async function importLocalData(memory: LocalAgentMemory): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ["candidateProfiles", "jobAnalysisHistory", "savedJobs", "dismissedJobs", "generatedApplications"],
    "readwrite"
  );
  for (const row of memory.candidateProfiles ?? []) {
    await tx.objectStore("candidateProfiles").put(row as CandidateProfileSnapshot);
  }
  for (const row of memory.jobAnalysisHistory ?? []) {
    await tx.objectStore("jobAnalysisHistory").put(row as JobAnalysisSnapshot);
  }
  for (const row of memory.savedJobs ?? []) {
    await tx.objectStore("savedJobs").put(row as SavedJob);
  }
  for (const row of memory.dismissedJobs ?? []) {
    await tx.objectStore("dismissedJobs").put(row as DismissedJob);
  }
  for (const row of memory.generatedApplications ?? []) {
    await tx.objectStore("generatedApplications").put(row as GeneratedApplication);
  }
  await tx.done;
  if (memory.consent) {
    saveConsentSettings(memory.consent);
  }
  if (memory.preferences) {
    savePreferences(memory.preferences);
  }
}

export async function clearLocalHistory(): Promise<void> {
  await clearStores([
    "candidateProfiles",
    "jobAnalysisHistory",
    "savedJobs",
    "dismissedJobs",
    "generatedApplications",
    "localAnalyticsEvents",
  ]);
}

export async function deleteSavedProfileData(): Promise<void> {
  await clearStores(["candidateProfiles"]);
}
