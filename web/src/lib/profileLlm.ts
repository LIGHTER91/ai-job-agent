import type { CandidateProfile, CompanyTarget } from "../types";
import { isLocalModelReady, runLocalChat } from "./webllm";

interface LlmProfilePatch {
  targetRoles?: string[];
  skills?: string[];
  tools?: string[];
  frameworks?: string[];
  domains?: string[];
  education?: string[];
  experiences?: string[];
  languages?: string[];
  senioritySignals?: string[];
  locationSignals?: string[];
  keywords?: string[];
  summary?: string;
  companyTargets?: Partial<CompanyTarget>[];
  searchQueries?: string[];
}

function unique(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = String(value).trim();
    const key = cleaned.toLowerCase();
    if (cleaned && !seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }
  return result.slice(0, limit);
}

function arrayFromPatch(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function companyTargetsFromPatch(value: unknown): CompanyTarget[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const reason = typeof item.reason === "string" ? item.reason.trim() : "";
      const searchQuery = typeof item.searchQuery === "string" ? item.searchQuery.trim() : "";
      return {
        name,
        reason: reason || `Relevant company for ${name}`,
        searchQuery: searchQuery || `${name} careers ${reason}`,
      };
    })
    .filter((item) => item.name)
    .slice(0, 30);
}

function parseJsonPatch(content: string): LlmProfilePatch | null {
  const candidates = [
    content,
    content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1],
    content.match(/\{[\s\S]*\}/)?.[0],
  ].filter((item): item is string => Boolean(item));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as LlmProfilePatch;
    } catch {
      // Try the next extraction.
    }
  }
  return null;
}

function mergeProfile(base: CandidateProfile, patch: LlmProfilePatch): CandidateProfile {
  const now = new Date().toISOString();
  const patchedTargetRoles = arrayFromPatch(patch.targetRoles);
  const patchedSkills = arrayFromPatch(patch.skills);
  const patchedTools = arrayFromPatch(patch.tools);
  const patchedFrameworks = arrayFromPatch(patch.frameworks);
  const patchedDomains = arrayFromPatch(patch.domains);
  const patchedEducation = arrayFromPatch(patch.education);
  const patchedExperiences = arrayFromPatch(patch.experiences);
  const patchedLanguages = arrayFromPatch(patch.languages);
  const patchedSeniority = arrayFromPatch(patch.senioritySignals);
  const patchedLocations = arrayFromPatch(patch.locationSignals);
  const patchedKeywords = arrayFromPatch(patch.keywords);
  return {
    ...base,
    targetRoles: patchedTargetRoles.length ? unique(patchedTargetRoles, 8) : base.targetRoles,
    skills: patchedSkills.length ? unique(patchedSkills, 32) : base.skills,
    tools: patchedTools.length ? unique(patchedTools, 24) : base.tools,
    frameworks: patchedFrameworks.length ? unique(patchedFrameworks, 24) : base.frameworks,
    domains: patchedDomains.length ? unique(patchedDomains, 18) : base.domains,
    education: patchedEducation.length ? unique(patchedEducation, 10) : base.education,
    experiences: patchedExperiences.length ? unique(patchedExperiences, 12) : base.experiences,
    languages: patchedLanguages.length ? unique(patchedLanguages, 8) : base.languages,
    senioritySignals: patchedSeniority.length ? unique(patchedSeniority, 8) : base.senioritySignals,
    locationSignals: patchedLocations.length ? unique(patchedLocations, 10) : base.locationSignals,
    keywords: patchedKeywords.length ? unique(patchedKeywords, 36) : base.keywords,
    extractionMethod: "webllm",
    llmEnrichedAt: now,
    llmProfileSummary: typeof patch.summary === "string" ? patch.summary.slice(0, 260) : base.llmProfileSummary,
    companyTargets: companyTargetsFromPatch(patch.companyTargets),
    updatedAt: now,
  };
}

export async function enrichCandidateProfileWithLocalLLM(base: CandidateProfile): Promise<CandidateProfile> {
  if (!isLocalModelReady()) {
    throw new Error("Local model is not loaded yet.");
  }

  const resumeText = (base.rawText ?? "").slice(0, 3600);
  const content = await runLocalChat(
    [
      {
        role: "system",
        content:
          "JSON only. Extract a job-search profile from the CV. Never force AI/data if the CV is another domain.",
      },
      {
        role: "user",
        content: `Return compact JSON:
{"targetRoles":[],"skills":[],"tools":[],"frameworks":[],"domains":[],"education":[],"experiences":[],"languages":[],"senioritySignals":[],"locationSignals":[],"keywords":[],"summary":"","companyTargets":[{"name":"","reason":"","searchQuery":""}]}
Rules: infer real domain from CV; include domain skills; create 8-16 relevant companyTargets from the CV domain with precise job-search queries.
CV:
${resumeText}`,
      },
    ],
    360,
    90000
  );

  const patch = parseJsonPatch(content);
  if (!patch) {
    throw new Error("Local model did not return valid profile JSON.");
  }
  return mergeProfile(base, patch);
}
