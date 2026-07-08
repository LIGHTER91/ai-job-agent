import type { DismissedJob, JobAnalysisSnapshot, PersonalizedJobMatch, SavedJob } from "../../types";
import { createLocalId, getDb, nowIso } from "./db";

export async function saveJobAnalysis(
  match: PersonalizedJobMatch,
  profileSnapshotId?: string
): Promise<JobAnalysisSnapshot> {
  const snapshot: JobAnalysisSnapshot = {
    id: createLocalId("analysis"),
    jobId: match.job.id,
    analyzedAt: nowIso(),
    profileSnapshotId,
    score: match.score,
    priority: match.priority,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills,
    explanation: match.explanation,
    source: "rule_based",
  };
  const db = await getDb();
  await db.put("jobAnalysisHistory", snapshot);
  return snapshot;
}

export async function listJobAnalysisHistory(): Promise<JobAnalysisSnapshot[]> {
  const db = await getDb();
  const rows = await db.getAll("jobAnalysisHistory");
  return rows.sort((a, b) => b.analyzedAt.localeCompare(a.analyzedAt));
}

export async function saveJob(jobId: string, score?: number, note?: string): Promise<SavedJob> {
  const saved: SavedJob = {
    id: jobId,
    jobId,
    savedAt: nowIso(),
    score,
    note,
  };
  const db = await getDb();
  await db.put("savedJobs", saved);
  return saved;
}

export async function dismissJob(jobId: string, reason?: string): Promise<DismissedJob> {
  const dismissed: DismissedJob = {
    id: jobId,
    jobId,
    dismissedAt: nowIso(),
    reason,
  };
  const db = await getDb();
  await db.put("dismissedJobs", dismissed);
  return dismissed;
}

export async function listSavedJobs(): Promise<SavedJob[]> {
  const db = await getDb();
  const rows = await db.getAll("savedJobs");
  return rows.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function listDismissedJobs(): Promise<DismissedJob[]> {
  const db = await getDb();
  const rows = await db.getAll("dismissedJobs");
  return rows.sort((a, b) => b.dismissedAt.localeCompare(a.dismissedAt));
}

export async function clearJobHistory(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["jobAnalysisHistory", "savedJobs", "dismissedJobs"], "readwrite");
  await Promise.all([
    tx.objectStore("jobAnalysisHistory").clear(),
    tx.objectStore("savedJobs").clear(),
    tx.objectStore("dismissedJobs").clear(),
  ]);
  await tx.done;
}
