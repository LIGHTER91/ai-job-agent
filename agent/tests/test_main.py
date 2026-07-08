from agent import main
from agent.sources.base import JobPosting
from agent.sources.mock import MockSource


class EmptySource:
    name = "Empty"

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        return []


def test_fetch_jobs_uses_mock_fallback_when_external_sources_are_empty(monkeypatch) -> None:
    monkeypatch.setattr(main, "build_sources", lambda: [EmptySource(), MockSource()])

    jobs = main.fetch_jobs(max_results=5)

    assert jobs
    assert all(job.source == "Mock" for job in jobs)


class LiveSource:
    name = "Live"

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        return [
            JobPosting(
                id="live-1",
                title="AI Engineer",
                company="LiveCo",
                location="Remote Europe",
                source="Live",
                url="https://example.com/live",
                published_at="2026-07-07",
                description="Python LLM RAG role.",
                tags=["Python", "LLM"],
            )
        ]


def test_fetch_jobs_does_not_mix_mock_when_live_jobs_exist(monkeypatch) -> None:
    monkeypatch.setattr(main, "build_sources", lambda: [LiveSource()])

    search_run = main.fetch_jobs_with_report(max_results=5)

    assert not search_run.fallback_used
    assert search_run.source_counts == {"Live": 1}
    assert [job.source for job in search_run.jobs] == ["Live"]
