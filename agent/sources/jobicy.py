from __future__ import annotations

import html
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

from .base import JobPosting

QUERY_TAGS: dict[str, list[str]] = {
    "AI Engineer": ["python"],
    "Applied AI Engineer": ["python"],
    "LLM Engineer": ["python"],
    "RAG Engineer": ["python"],
    "Data Scientist": ["machine-learning"],
    "Machine Learning Engineer": ["machine-learning"],
    "NLP Engineer": ["machine-learning"],
    "Computer Vision Engineer": ["machine-learning"],
    "Data Engineer": ["python"],
}


class JobicySource:
    """Free remote job API. No key required."""

    name = "Jobicy"
    base_url = "https://jobicy.com/api/v2/remote-jobs"

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        jobs_by_id: dict[str, JobPosting] = {}
        for tag in QUERY_TAGS.get(query, ["python"]):
            params = urllib.parse.urlencode({"count": str(limit), "tag": tag})
            request = urllib.request.Request(
                f"{self.base_url}?{params}",
                headers={
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 ai-job-agent portfolio project",
                },
            )
            try:
                with urllib.request.urlopen(request, timeout=15) as response:
                    payload = json.loads(response.read().decode("utf-8"))
            except Exception:
                continue

            for item in payload.get("jobs", [])[:limit]:
                job = self._parse(item)
                jobs_by_id[job.id] = job
        return list(jobs_by_id.values())[:limit]

    def _parse(self, item: dict[str, Any]) -> JobPosting:
        tags = item.get("jobIndustry") or []
        if isinstance(tags, str):
            tags = [tags]
        if item.get("jobLevel"):
            tags.append(str(item["jobLevel"]))
        if item.get("jobType"):
            tags.extend(str(value) for value in item["jobType"])

        description = strip_html(item.get("jobDescription") or item.get("jobExcerpt") or "")
        published_at = item.get("pubDate") or item.get("published_at") or ""
        return JobPosting(
            id=f"jobicy-{item.get('id') or item.get('jobSlug')}",
            title=item.get("jobTitle") or "Untitled role",
            company=item.get("companyName") or "Unknown company",
            location=item.get("jobGeo") or "Remote",
            source="Jobicy",
            url=item.get("url") or "https://jobicy.com/",
            published_at=parse_date(published_at),
            description=description,
            tags=[str(tag) for tag in tags],
        )


def strip_html(value: str) -> str:
    no_tags = re.sub(r"<[^>]+>", " ", value)
    return " ".join(html.unescape(no_tags).split())


def parse_date(value: str) -> str:
    if not value:
        return datetime.now(timezone.utc).date().isoformat()
    return value[:10]
