from __future__ import annotations

import json
import urllib.parse
import urllib.request

from .base import JobPosting


class AdzunaSource:
    """Optional adapter. Requires ADZUNA_APP_ID and ADZUNA_APP_KEY."""

    name = "Adzuna"

    def __init__(self, app_id: str | None, app_key: str | None, country: str = "fr") -> None:
        self.app_id = app_id
        self.app_key = app_key
        self.country = country

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        if not self.app_id or not self.app_key:
            return []
        params = urllib.parse.urlencode(
            {
                "app_id": self.app_id,
                "app_key": self.app_key,
                "what": query,
                "results_per_page": str(limit),
                "content-type": "application/json",
            }
        )
        url = f"https://api.adzuna.com/v1/api/jobs/{self.country}/search/1?{params}"
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception:
            return []

        jobs: list[JobPosting] = []
        for item in payload.get("results", [])[:limit]:
            jobs.append(
                JobPosting(
                    id=f"adzuna-{item.get('id')}",
                    title=item.get("title") or "Untitled role",
                    company=(item.get("company") or {}).get("display_name") or "Unknown company",
                    location=(item.get("location") or {}).get("display_name") or "Unknown location",
                    source="Adzuna",
                    url=item.get("redirect_url") or "https://www.adzuna.com/",
                    published_at=(item.get("created") or "")[:10],
                    description=item.get("description") or "",
                    tags=[],
                )
            )
        return jobs
