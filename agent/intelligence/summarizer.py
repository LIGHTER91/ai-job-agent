from __future__ import annotations

from agent.sources.base import JobPosting


def rule_based_summary(job: JobPosting, required_skills: list[str]) -> str:
    core = ", ".join(required_skills[:4]) if required_skills else "AI/data skills"
    return f"{job.title} at {job.company}, focused on {core}. Location: {job.location}."


def rule_based_application_sentence(job: JobPosting, matched_skills: list[str], missing_skills: list[str]) -> str:
    matched = ", ".join(matched_skills[:4]) if matched_skills else "AI engineering"
    missing = f" I would also use this opportunity to strengthen {missing_skills[0]}." if missing_skills else ""
    return (
        f"Your {job.title} role interests me because it connects directly with my work around {matched}, "
        f"especially applied AI systems that move from prototype to usable product.{missing}"
    )
