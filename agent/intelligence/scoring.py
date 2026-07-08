from __future__ import annotations

from dataclasses import dataclass

from agent.sources.base import JobPosting

TARGET_ROLE_TERMS = [
    "ai engineer",
    "applied ai engineer",
    "llm engineer",
    "rag engineer",
    "machine learning engineer",
    "data scientist",
    "nlp engineer",
    "computer vision engineer",
]

JUNIOR_TERMS = ["junior", "entry level", "graduate", "early career", "0-2 years", "1-2 years"]
SENIOR_TERMS = ["senior", "lead", "principal", "staff", "manager", "5+ years", "7+ years"]
LOCAL_TERMS = ["bordeaux", "paris", "france", "remote", "hybrid", "europe"]
BONUS_TERMS = ["rag", "llm", "genai", "generative ai", "agent", "prompt", "vector", "knowledge graph"]


@dataclass(frozen=True)
class ScoreResult:
    score: int
    priority: str
    explanation: list[str]


def priority_for_score(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


def _contains_any(text: str, terms: list[str]) -> bool:
    text_lower = text.lower()
    return any(term in text_lower for term in terms)


def calculate_score(job: JobPosting, required_skills: list[str], matched_skills: list[str], missing_skills: list[str]) -> ScoreResult:
    haystack = f"{job.title} {job.description} {' '.join(job.tags)} {job.location}".lower()
    explanation: list[str] = []

    role_score = 40 if _contains_any(haystack, TARGET_ROLE_TERMS) else 16
    if role_score == 40:
        explanation.append("The role title or description is directly aligned with AI/LLM/Data target roles.")
    else:
        explanation.append("The role is adjacent to the target profile but not a direct AI Engineer match.")

    if required_skills:
        skill_ratio = len(matched_skills) / len(required_skills)
    else:
        skill_ratio = 0.4
    skills_score = round(30 * min(skill_ratio, 1.0))
    explanation.append(
        f"{len(matched_skills)} of {len(required_skills)} extracted skills match the profile."
    )

    location_score = 15 if _contains_any(job.location, LOCAL_TERMS) else 5
    if location_score == 15:
        explanation.append("The location matches Bordeaux/Paris/France/Europe/remote preferences.")
    else:
        explanation.append("The location is less aligned with the preferred search area.")

    if _contains_any(haystack, JUNIOR_TERMS):
        level_score = 10
        explanation.append("The offer explicitly appears junior or early-career compatible.")
    elif _contains_any(haystack, SENIOR_TERMS):
        level_score = 2
        explanation.append("The offer looks more senior than the target profile.")
    else:
        level_score = 6
        explanation.append("The seniority is not explicit, so the project treats it as moderately compatible.")

    bonus_score = 5 if _contains_any(haystack, BONUS_TERMS) else 0
    if bonus_score:
        explanation.append("The offer contains a concrete GenAI/RAG/LLM/vector-search signal.")

    if missing_skills:
        explanation.append("Main missing or weaker skills: " + ", ".join(missing_skills[:5]) + ".")

    score = int(max(0, min(100, role_score + skills_score + location_score + level_score + bonus_score)))
    return ScoreResult(score=score, priority=priority_for_score(score), explanation=explanation)
