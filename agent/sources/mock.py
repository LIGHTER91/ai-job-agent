from .base import JobPosting

MOCK_JOBS = [
    JobPosting(
        id="mock-ai-engineer-rag-bordeaux",
        title="AI Engineer - RAG & LLM Applications",
        company="Nova Knowledge AI",
        location="Bordeaux, France - Hybrid",
        source="Mock",
        url="https://example.com/jobs/ai-engineer-rag-bordeaux",
        published_at="2026-07-07",
        tags=["Python", "RAG", "LLM", "FastAPI", "Vector search", "Docker"],
        description=(
            "We are looking for an AI Engineer to build RAG applications, design ingestion pipelines, "
            "evaluate prompts, expose FastAPI services, and work with vector search. Docker and cloud "
            "deployment experience are appreciated. Junior profiles with strong portfolio projects are welcome."
        ),
    ),
    JobPosting(
        id="mock-mlops-engineer-aws-paris",
        title="Machine Learning Engineer - MLOps Platform",
        company="ScaleOps Data",
        location="Paris, France",
        source="Mock",
        url="https://example.com/jobs/mlops-engineer-paris",
        published_at="2026-07-05",
        tags=["Python", "AWS", "Kubernetes", "Terraform", "Airflow", "MLflow"],
        description=(
            "Join the platform team to industrialize ML pipelines on AWS and Kubernetes. You will maintain "
            "Airflow DAGs, Terraform modules, monitoring, and model deployment workflows. Previous MLOps "
            "production experience is expected."
        ),
    ),
    JobPosting(
        id="mock-nlp-data-scientist-remote",
        title="Junior Data Scientist - NLP and LLM Evaluation",
        company="TextLab Analytics",
        location="Remote Europe",
        source="Mock",
        url="https://example.com/jobs/junior-nlp-data-scientist",
        published_at="2026-07-03",
        tags=["Python", "NLP", "LLM", "Evaluation", "SQL", "Prompt engineering"],
        description=(
            "Junior Data Scientist role focused on NLP datasets, LLM evaluation, prompt analysis, and "
            "reporting. Experience with Python, SQL and experimentation is required. Knowledge of RAG "
            "systems is a plus."
        ),
    ),
]


class MockSource:
    name = "Mock"

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        query_terms = query.lower().split()
        results: list[JobPosting] = []
        for job in MOCK_JOBS:
            haystack = f"{job.title} {job.description} {' '.join(job.tags)}".lower()
            if any(term in haystack for term in query_terms):
                results.append(job)
        return results[:limit] or MOCK_JOBS[:limit]
