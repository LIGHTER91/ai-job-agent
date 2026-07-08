import { openDB, type DBSchema } from "idb";
import type {
  CandidateProfileSnapshot,
  DismissedJob,
  GeneratedApplication,
  JobAnalysisSnapshot,
  LocalAnalyticsRecord,
  SavedJob,
} from "../../types";

export const DB_NAME = "ai-job-matcher";
export const DB_VERSION = 1;
export type StoreName =
  | "candidateProfiles"
  | "jobAnalysisHistory"
  | "savedJobs"
  | "dismissedJobs"
  | "generatedApplications"
  | "localAnalyticsEvents"
  | "preferences";

export interface PreferenceRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

interface AiJobMatcherDb extends DBSchema {
  candidateProfiles: {
    key: string;
    value: CandidateProfileSnapshot;
    indexes: { "by-createdAt": string };
  };
  jobAnalysisHistory: {
    key: string;
    value: JobAnalysisSnapshot;
    indexes: { "by-analyzedAt": string; "by-jobId": string };
  };
  savedJobs: {
    key: string;
    value: SavedJob;
    indexes: { "by-savedAt": string; "by-jobId": string };
  };
  dismissedJobs: {
    key: string;
    value: DismissedJob;
    indexes: { "by-dismissedAt": string; "by-jobId": string };
  };
  generatedApplications: {
    key: string;
    value: GeneratedApplication;
    indexes: { "by-createdAt": string; "by-jobId": string };
  };
  localAnalyticsEvents: {
    key: string;
    value: LocalAnalyticsRecord;
    indexes: { "by-createdAt": string };
  };
  preferences: {
    key: string;
    value: PreferenceRecord;
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createLocalId(prefix: string): string {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getDb() {
  return openDB<AiJobMatcherDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("candidateProfiles")) {
        const store = db.createObjectStore("candidateProfiles", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("jobAnalysisHistory")) {
        const store = db.createObjectStore("jobAnalysisHistory", { keyPath: "id" });
        store.createIndex("by-analyzedAt", "analyzedAt");
        store.createIndex("by-jobId", "jobId");
      }
      if (!db.objectStoreNames.contains("savedJobs")) {
        const store = db.createObjectStore("savedJobs", { keyPath: "id" });
        store.createIndex("by-savedAt", "savedAt");
        store.createIndex("by-jobId", "jobId");
      }
      if (!db.objectStoreNames.contains("dismissedJobs")) {
        const store = db.createObjectStore("dismissedJobs", { keyPath: "id" });
        store.createIndex("by-dismissedAt", "dismissedAt");
        store.createIndex("by-jobId", "jobId");
      }
      if (!db.objectStoreNames.contains("generatedApplications")) {
        const store = db.createObjectStore("generatedApplications", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
        store.createIndex("by-jobId", "jobId");
      }
      if (!db.objectStoreNames.contains("localAnalyticsEvents")) {
        const store = db.createObjectStore("localAnalyticsEvents", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("preferences")) {
        db.createObjectStore("preferences", { keyPath: "key" });
      }
    },
  });
}

export async function clearStores(storeNames: StoreName[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(storeNames, "readwrite");
  await Promise.all(storeNames.map((storeName) => tx.objectStore(storeName).clear()));
  await tx.done;
}
