import type { JobAnalysis, Profile } from "../types";

const systemPrompt = `You are a career assistant specialized in AI engineering roles.
You help Lucien Lachaud analyze AI Engineer, LLM Engineer, Data Scientist and Machine Learning Engineer jobs.
Be concrete, honest and concise. Do not invent experience. If a skill is missing, say it clearly.
Return strict JSON only.`;

export function buildJobPrompt(job: JobAnalysis, profile: Profile): { role: "system" | "user"; content: string }[] {
  const userPrompt = `Analyze this job for Lucien Lachaud.

Profile target: ${profile.target}
Strong skills: ${profile.strong_skills.join(", ")}
Weaker skills: ${profile.weaker_skills_or_to_learn.join(", ")}

Job title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Match score: ${job.match_score}/100
Required skills: ${job.required_skills.join(", ")}
Matched skills: ${job.matched_skills.join(", ")}
Missing skills: ${job.missing_skills.join(", ") || "None"}
Description: ${job.raw_description.slice(0, 1600)}

Return this JSON shape exactly:
{
  "application_sentence": "one natural sentence in first person, max 35 words",
  "job_fit_analysis": "honest fit analysis, max 70 words",
  "preparation_points": ["point 1", "point 2", "point 3"]
}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}
