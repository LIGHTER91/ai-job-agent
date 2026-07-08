from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class JobPosting:
    id: str
    title: str
    company: str
    location: str
    source: str
    url: str
    published_at: str
    description: str
    tags: list[str] = field(default_factory=list)


class JobSource(Protocol):
    name: str

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        """Return job postings for the given query."""
