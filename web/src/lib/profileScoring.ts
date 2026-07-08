import type { CandidateProfile, JobAnalysis, PersonalizedJobMatch, Priority, Profile } from "../types";

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();
    if (cleaned && !seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }
  return result;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}

function hasTerm(haystack: string, term: string): boolean {
  return normalize(haystack).includes(normalize(term));
}

function priorityFromScore(score: number): Priority {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function jobText(job: JobAnalysis): string {
  return [
    job.title,
    job.company,
    job.location,
    job.source,
    job.raw_description,
    job.rule_based_summary,
    ...job.required_skills,
    ...job.matched_skills,
    ...job.missing_skills,
  ].join(" ");
}

export function buildDefaultCandidateProfile(profile: Profile): CandidateProfile {
  const now = new Date().toISOString();
  return {
    id: "default_lucien_profile",
    source: "default_profile",
    targetRoles: profile.target_roles,
    skills: unique([...profile.strong_skills, ...profile.weaker_skills_or_to_learn]),
    tools: profile.strong_skills.filter((skill) => /docker|github|aws|azure|gcp|dataiku|mlflow|faiss/i.test(skill)),
    frameworks: profile.strong_skills.filter((skill) => /react|fastapi|flask|django|langchain|pytorch|tensorflow|scikit/i.test(skill)),
    domains: ["AI", "LLM", "RAG", "Machine Learning", "Data Science"],
    education: [],
    experiences: ["Lucien demo profile for AI/Data/LLM matching"],
    languages: ["French", "English"],
    senioritySignals: ["junior", "graduate", "entry-level"],
    locationSignals: ["France", "Europe", "remote", "hybrid"],
    keywords: unique([...profile.strong_skills, ...profile.target_roles, "portfolio", "AI agent"]),
    extractionMethod: "deterministic",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildEmptyCandidateProfile(): CandidateProfile {
  const now = new Date().toISOString();
  return {
    id: "empty_profile",
    source: "default_profile",
    targetRoles: [],
    skills: [],
    tools: [],
    frameworks: [],
    domains: [],
    education: [],
    experiences: [],
    languages: [],
    senioritySignals: [],
    locationSignals: [],
    keywords: [],
    extractionMethod: "deterministic",
    createdAt: now,
    updatedAt: now,
  };
}

function scoreRole(job: JobAnalysis, profile: CandidateProfile): { score: number; matches: string[] } {
  const haystack = jobText(job);
  const matches = profile.targetRoles.filter((role) => hasTerm(haystack, role));
  if (matches.length) return { score: 100, matches };
  const softMatches = profile.targetRoles.filter((role) => {
    const [first] = normalize(role).split(" ");
    return first && hasTerm(job.title, first);
  });
  return { score: softMatches.length ? 70 : 25, matches: softMatches };
}

function scoreSkills(job: JobAnalysis, profile: CandidateProfile): { score: number; matched: string[]; missing: string[] } {
  const candidateSkills = unique([...profile.skills, ...profile.tools, ...profile.frameworks]);
  const haystack = jobText(job);
  const matched = candidateSkills.filter((skill) => hasTerm(haystack, skill) || job.required_skills.some((required) => normalize(required) === normalize(skill)));
  const missing = unique(job.required_skills.filter((skill) => !matched.some((candidateSkill) => normalize(candidateSkill) === normalize(skill))));
  if (!candidateSkills.length && !job.required_skills.length) return { score: 45, matched: [], missing };
  const denominator = Math.max(1, job.required_skills.length || candidateSkills.length);
  const overlapRatio = matched.length / denominator;
  return { score: clampScore(overlapRatio * 100), matched, missing };
}

function scoreDomains(job: JobAnalysis, profile: CandidateProfile): { score: number; matches: string[] } {
  const signals = unique([...profile.domains, ...profile.keywords.filter((keyword) => keyword.length > 4)]);
  const haystack = jobText(job);
  const matches = signals.filter((signal) => hasTerm(haystack, signal));
  if (!signals.length) return { score: 40, matches: [] };
  return { score: clampScore((matches.length / Math.min(signals.length, 6)) * 100), matches: matches.slice(0, 8) };
}

function scoreSeniority(job: JobAnalysis, profile: CandidateProfile): number {
  const haystack = normalize(jobText(job));
  const candidate = profile.senioritySignals.map(normalize);
  const isJuniorCandidate = candidate.some((item) => /junior|graduate|intern|entry|alternance/.test(item));
  const isSeniorCandidate = candidate.some((item) => /senior|lead|principal/.test(item));
  const jobSenior = /senior|lead|principal|staff/.test(haystack);
  const jobJunior = /junior|graduate|intern|entry level|entry-level|alternance/.test(haystack);
  if (!candidate.length) return jobSenior ? 45 : 65;
  if (isJuniorCandidate && jobJunior) return 100;
  if (isSeniorCandidate && jobSenior) return 100;
  if (isJuniorCandidate && jobSenior) return 35;
  return 75;
}

function scoreLocation(job: JobAnalysis, profile: CandidateProfile): number {
  const haystack = normalize(`${job.location} ${job.raw_description}`);
  const signals = profile.locationSignals.map(normalize);
  if (signals.some((signal) => signal && haystack.includes(signal))) return 100;
  if (/remote|hybrid|worldwide|europe/.test(haystack)) return 85;
  if (!signals.length) return 60;
  return 45;
}

function buildExplanation(match: {
  roleMatches: string[];
  matchedSkills: string[];
  missingSkills: string[];
  domainMatches: string[];
  seniorityScore: number;
  locationScore: number;
}): string[] {
  const explanation: string[] = [];
  if (match.matchedSkills.length) {
    explanation.push(`Strong match because your CV mentions ${match.matchedSkills.slice(0, 6).join(", ")}.`);
  } else {
    explanation.push("Skill overlap is limited, so review the role requirements carefully before applying.");
  }
  if (match.missingSkills.length) {
    explanation.push(`Missing skills: ${match.missingSkills.slice(0, 5).join(", ")}.`);
  } else {
    explanation.push("No major required skill gap was detected from the job data.");
  }
  if (match.domainMatches.length) {
    explanation.push(`Domain overlap is strong because both the CV and job mention ${match.domainMatches.slice(0, 4).join(", ")}.`);
  }
  if (match.roleMatches.length) {
    explanation.push(`Role alignment found for ${match.roleMatches.slice(0, 3).join(", ")}.`);
  }
  if (match.seniorityScore >= 70) {
    explanation.push("Seniority looks compatible with the job wording.");
  } else {
    explanation.push("Seniority may be a stretch based on the job wording.");
  }
  if (match.locationScore >= 80) {
    explanation.push("Location or remote compatibility looks good.");
  }
  return explanation;
}

function buildApplicationSentence(job: JobAnalysis, profile: CandidateProfile, matchedSkills: string[], missingSkills: string[]): string {
  const skills = matchedSkills.slice(0, 3).join(", ") || profile.skills.slice(0, 3).join(", ") || "AI/data projects";
  const gap = missingSkills.length ? ` while actively closing gaps around ${missingSkills.slice(0, 2).join(" and ")}` : "";
  return `I would position my experience in ${skills} for ${job.company}'s ${job.title} role${gap}.`;
}

export function scoreJobForProfile(job: JobAnalysis, profile: CandidateProfile): PersonalizedJobMatch {
  const role = scoreRole(job, profile);
  const skill = scoreSkills(job, profile);
  const domain = scoreDomains(job, profile);
  const seniorityScore = scoreSeniority(job, profile);
  const locationScore = scoreLocation(job, profile);
  const score = clampScore(role.score * 0.35 + skill.score * 0.3 + domain.score * 0.15 + seniorityScore * 0.1 + locationScore * 0.1);
  const explanation = buildExplanation({
    roleMatches: role.matches,
    matchedSkills: skill.matched,
    missingSkills: skill.missing,
    domainMatches: domain.matches,
    seniorityScore,
    locationScore,
  });

  return {
    job,
    score,
    priority: priorityFromScore(score),
    roleScore: clampScore(role.score),
    skillScore: clampScore(skill.score),
    domainScore: clampScore(domain.score),
    seniorityScore: clampScore(seniorityScore),
    locationScore: clampScore(locationScore),
    matchedSkills: skill.matched,
    missingSkills: skill.missing,
    matchedRoles: role.matches,
    matchedDomains: domain.matches,
    explanation,
    ruleBasedApplicationSentence: buildApplicationSentence(job, profile, skill.matched, skill.missing),
  };
}

export function scoreJobsForProfile(jobs: JobAnalysis[], profile: CandidateProfile): PersonalizedJobMatch[] {
  return jobs.map((job) => scoreJobForProfile(job, profile));
}
