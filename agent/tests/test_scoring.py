from agent.intelligence.scoring import calculate_score, priority_for_score
from agent.sources.base import JobPosting


def test_high_priority_for_rag_ai_engineer() -> None:
    job = JobPosting(
        id="1",
        title="AI Engineer RAG LLM",
        company="X",
        location="Bordeaux Hybrid",
        source="Test",
        url="https://example.com",
        published_at="2026-07-07",
        description="Junior role with Python, FastAPI, RAG and vector search.",
        tags=["Python", "FastAPI", "RAG"],
    )
    score = calculate_score(job, ["Python", "FastAPI", "RAG"], ["Python", "FastAPI", "RAG"], [])
    assert score.score >= 75
    assert score.priority == "high"


def test_lower_priority_for_senior_mlops_missing_cloud() -> None:
    job = JobPosting(
        id="2",
        title="Senior MLOps Engineer",
        company="Y",
        location="London",
        source="Test",
        url="https://example.com",
        published_at="2026-07-07",
        description="Senior role requiring AWS, Kubernetes, Terraform and Airflow.",
        tags=["AWS", "Kubernetes", "Terraform"],
    )
    score = calculate_score(job, ["AWS", "Kubernetes", "Terraform"], [], ["AWS", "Kubernetes", "Terraform"])
    assert score.priority in {"low", "medium"}


def test_priority_mapping_thresholds() -> None:
    assert priority_for_score(75) == "high"
    assert priority_for_score(74) == "medium"
    assert priority_for_score(50) == "medium"
    assert priority_for_score(49) == "low"
