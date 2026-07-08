import type { GeneratedApplication, LocalAIResult } from "../../types";
import { createLocalId, getDb, nowIso } from "./db";

export async function saveGeneratedApplication(input: {
  jobId: string;
  profileSnapshotId?: string;
  model?: string;
  result: LocalAIResult;
}): Promise<GeneratedApplication> {
  const row: GeneratedApplication = {
    id: createLocalId("generation"),
    jobId: input.jobId,
    profileSnapshotId: input.profileSnapshotId,
    createdAt: nowIso(),
    model: input.model,
    applicationSentence: input.result.application_sentence,
    jobFitAnalysis: input.result.job_fit_analysis,
    preparationPoints: input.result.preparation_points,
  };
  const db = await getDb();
  await db.put("generatedApplications", row);
  return row;
}

export async function listGeneratedApplications(): Promise<GeneratedApplication[]> {
  const db = await getDb();
  const rows = await db.getAll("generatedApplications");
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findGeneratedApplication(
  jobId: string,
  profileSnapshotId?: string
): Promise<GeneratedApplication | null> {
  const db = await getDb();
  const rows = await db.getAllFromIndex("generatedApplications", "by-jobId", jobId);
  const exact = rows
    .filter((row) => row.profileSnapshotId === profileSnapshotId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return exact ?? null;
}

export function generatedApplicationToResult(row: GeneratedApplication): LocalAIResult {
  return {
    application_sentence: row.applicationSentence,
    job_fit_analysis: row.jobFitAnalysis,
    preparation_points: row.preparationPoints,
  };
}
