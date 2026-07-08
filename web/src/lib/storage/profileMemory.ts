import type { CandidateProfile, CandidateProfileSnapshot, ConsentSettings } from "../../types";
import { createLocalId, getDb, nowIso } from "./db";

export function toProfileSnapshot(profile: CandidateProfile, consent: ConsentSettings): CandidateProfileSnapshot {
  const createdAt = profile.createdAt ?? nowIso();
  const snapshot: CandidateProfileSnapshot = {
    id: profile.id ?? createLocalId("profile"),
    createdAt,
    updatedAt: nowIso(),
    fileName: profile.fileName,
    targetRoles: profile.targetRoles,
    skills: profile.skills,
    tools: profile.tools,
    frameworks: profile.frameworks,
    domains: profile.domains,
    education: profile.education,
    experiences: profile.experiences,
    languages: profile.languages,
    senioritySignals: profile.senioritySignals,
    locationSignals: profile.locationSignals,
    keywords: profile.keywords,
    extractionMethod: profile.extractionMethod,
    llmEnrichedAt: profile.llmEnrichedAt,
    llmProfileSummary: profile.llmProfileSummary,
    companyTargets: profile.companyTargets,
  };
  if (consent.saveFullResumeText && profile.rawText) {
    snapshot.rawText = profile.rawText;
  }
  return snapshot;
}

export function snapshotToProfile(snapshot: CandidateProfileSnapshot): CandidateProfile {
  return {
    ...snapshot,
    source: "uploaded_resume",
  };
}

export async function saveCandidateProfile(
  profile: CandidateProfile,
  consent: ConsentSettings
): Promise<CandidateProfileSnapshot | null> {
  if (!consent.localHistory || !consent.saveParsedProfile) return null;
  const snapshot = toProfileSnapshot(profile, consent);
  const db = await getDb();
  await db.put("candidateProfiles", snapshot);
  return snapshot;
}

export async function listCandidateProfiles(): Promise<CandidateProfileSnapshot[]> {
  const db = await getDb();
  const profiles = await db.getAll("candidateProfiles");
  return profiles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteSavedProfiles(): Promise<void> {
  const db = await getDb();
  await db.clear("candidateProfiles");
}
