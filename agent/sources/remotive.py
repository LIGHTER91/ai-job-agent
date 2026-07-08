from __future__ import annotations

import html
import json
import re
import urllib.parse
import urllib.request
from typing import Any

from .base import JobPosting


class RemotiveSource:
    name = "Remotive"
    base_url = "https://remotive.com/api/remote-jobs"

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        params = urllib.parse.urlencode({"search": query, "limit": str(limit)})
        url = f"{self.base_url}?{params}"
        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 ai-job-agent portfolio project",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception:
            return []

        jobs: list[JobPosting] = []
        for item in payload.get("jobs", [])[:limit]:
            jobs.append(self._parse(item))
        return jobs

    def _parse(self, item: dict[str, Any]) -> JobPosting:
        tags = item.get("tags") or []
        if isinstance(tags, str):
            tags = [tags]
        return JobPosting(
            id=f"remotive-{item.get('id')}",
            title=item.get("title") or "Untitled role",
            company=item.get("company_name") or "Unknown company",
            location=item.get("candidate_required_location") or item.get("job_type") or "Remote",
            source="Remotive",
            url=item.get("url") or item.get("job_url") or "https://remotive.com/remote-jobs",
            published_at=(item.get("publication_date") or "")[:10],
            description=strip_html(item.get("description") or ""),
            tags=[str(tag) for tag in tags],
        )


def strip_html(value: str) -> str:
    no_tags = re.sub(r"<[^>]+>", " ", value)
    return " ".join(html.unescape(no_tags).split())
