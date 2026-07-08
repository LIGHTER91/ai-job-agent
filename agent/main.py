from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from agent.config import SETTINGS
from agent.intelligence.scoring import calculate_score
from agent.intelligence.skills import extract_skills, match_skills
from agent.intelligence.summarizer import rule_based_application_sentence, rule_based_summary
from agent.profile import USER_PROFILE
from agent.sources.adzuna import AdzunaSource
from agent.sources.base import JobPosting, JobSource
from agent.sources.france_travail import FranceTravailSource
from agent.sources.jobicy import JobicySource
from agent.sources.mock import MockSource
from agent.sources.remotive import RemotiveSource

QUERIES = [
    "AI Engineer",
    "Applied AI Engineer",
    "LLM Engineer",
    "RAG Engineer",
    "Data Scientist",
    "Machine Learning Engineer",
    "NLP Engineer",
    "Computer Vision Engineer",
    "Data Engineer",
]


@dataclass(frozen=True)
class SearchRun:
    jobs: list[JobPosting]
    source_counts: dict[str, int]
    fallback_used: bool


def build_sources() -> list[JobSource]:
    sources: list[JobSource] = []
    if SETTINGS.enable_remotive:
        sources.append(RemotiveSource())
    if SETTINGS.enable_jobicy:
        sources.append(JobicySource())
    if SETTINGS.enable_adzuna:
        sources.append(AdzunaSource(SETTINGS.adzuna_app_id, SETTINGS.adzuna_app_key, SETTINGS.adzuna_country))
    if SETTINGS.enable_france_travail:
        sources.append(FranceTravailSource(SETTINGS.france_travail_client_id, SETTINGS.france_travail_client_secret))
    return sources


def fetch_jobs(max_results: int = 30) -> list[JobPosting]:
    return fetch_jobs_with_report(max_results).jobs


def fetch_jobs_with_report(max_results: int = 30) -> SearchRun:
    sources = build_sources()
    jobs_by_id: dict[str, JobPosting] = {}
    fallback_used = False
    per_query_limit = max(3, max_results // max(1, len(QUERIES)))
    for source in sources:
        for query in QUERIES:
            for job in source.fetch(query, limit=per_query_limit):
                jobs_by_id[job.id] = job
            if len(jobs_by_id) >= max_results:
                break
        if len(jobs_by_id) >= max_results:
            break

    if not jobs_by_id:
        fallback_used = True
        mock_source = MockSource()
        for query in QUERIES:
            for job in mock_source.fetch(query, limit=per_query_limit):
                jobs_by_id[job.id] = job
            if len(jobs_by_id) >= max_results:
                break

    jobs = list(jobs_by_id.values())[:max_results]
    source_counts: dict[str, int] = {}
    for job in jobs:
        source_counts[job.source] = source_counts.get(job.source, 0) + 1
    return SearchRun(jobs=jobs, source_counts=source_counts, fallback_used=fallback_used)


def analyze_job(job: JobPosting) -> dict:
    required_skills = extract_skills(job.title, job.description, " ".join(job.tags))
    matched_skills, missing_skills = match_skills(required_skills, USER_PROFILE["strong_skills"])
    score = calculate_score(job, required_skills, matched_skills, missing_skills)
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "source": job.source,
        "url": job.url,
        "published_at": job.published_at,
        "match_score": score.score,
        "priority": score.priority,
        "raw_description": truncate(job.description, 2500),
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "rule_based_summary": rule_based_summary(job, required_skills),
        "rule_based_application_sentence": rule_based_application_sentence(job, matched_skills, missing_skills),
        "score_explanation": score.explanation,
    }


def truncate(value: str, max_chars: int) -> str:
    clean = " ".join(value.split())
    suffix = "..."
    return clean if len(clean) <= max_chars else clean[: max_chars - len(suffix)].rstrip() + suffix


def write_output(payload: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    search_run = fetch_jobs_with_report(SETTINGS.max_results)
    analyzed = sorted((analyze_job(job) for job in search_run.jobs), key=lambda item: item["match_score"], reverse=True)
    payload = {
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "search_agent": {
            "queries": QUERIES,
            "source_counts": search_run.source_counts,
            "fallback_used": search_run.fallback_used,
            "enabled_sources": [source.name for source in build_sources()],
        },
        "profile": {
            "name": USER_PROFILE["name"],
            "target": USER_PROFILE["target"],
            "target_roles": USER_PROFILE["target_roles"],
            "strong_skills": USER_PROFILE["strong_skills"],
            "weaker_skills_or_to_learn": USER_PROFILE["weaker_skills_or_to_learn"],
        },
        "jobs": analyzed,
    }
    write_output(payload, SETTINGS.output_path)
    print(f"Generated {len(analyzed)} analyzed jobs at {SETTINGS.output_path}")


if __name__ == "__main__":
    main()
