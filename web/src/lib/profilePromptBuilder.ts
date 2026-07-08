import type { CandidateProfile, JobAnalysis, PersonalizedJobMatch } from "../types";

const systemPrompt = `You are a local browser-only career assistant for AI/Data/LLM jobs.
Use only the parsed candidate profile and job data provided.
Do not invent experience, employers, education, achievements or skills.
Be concise, honest and constructive about missing skills.
Return strict JSON only.`;

function list(values: string[]): string {
  return values.length ? values.join(", ") : "None detected";
}

export function buildPersonalizedJobPrompt(
  job: JobAnalysis,
  profile: CandidateProfile,
  match: PersonalizedJobMatch
): { role: "system" | "user"; content: string }[] {
  const userPrompt = `Analyze this job for the candidate.

Parsed CV profile:
Target roles: ${list(profile.targetRoles)}
Skills: ${list(profile.skills)}
Tools: ${list(profile.tools)}
Frameworks: ${list(profile.frameworks)}
Domains: ${list(profile.domains)}
Education signals: ${list(profile.education)}
Experience keywords: ${list(profile.experiences)}
Languages: ${list(profile.languages)}
Seniority signals: ${list(profile.senioritySignals)}
Location signals: ${list(profile.locationSignals)}

Job:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Source: ${job.source}
Required skills: ${list(job.required_skills)}
Description: ${job.raw_description.slice(0, 1400)}

Deterministic match:
Score: ${match.score}/100
Matched skills: ${list(match.matchedSkills)}
Missing skills: ${list(match.missingSkills)}
Explanation: ${match.explanation.join(" ")}

Return this JSON shape exactly:
{
  "application_sentence": "one natural first-person sentence, max 35 words",
  "job_fit_analysis": "honest fit analysis, max 70 words",
  "preparation_points": ["point 1", "point 2", "point 3"]
}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}
