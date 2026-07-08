from __future__ import annotations

import re

SKILL_ALIASES: dict[str, list[str]] = {
    "Python": ["python", "py"],
    "FastAPI": ["fastapi"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "LLM": ["llm", "large language model", "large language models", "generative ai", "genai"],
    "FAISS": ["faiss"],
    "Vector search": ["vector search", "semantic search", "embedding", "embeddings", "vector database"],
    "Prompt engineering": ["prompt engineering", "prompt evaluation", "prompting"],
    "Knowledge graphs": ["knowledge graph", "knowledge graphs", "ontology", "ontologies"],
    "Entity extraction": ["entity extraction", "ner", "named entity recognition"],
    "NLP": ["nlp", "natural language processing"],
    "Computer vision": ["computer vision", "image segmentation", "segmentation"],
    "U-Net": ["u-net", "unet"],
    "React": ["react", "react.js", "reactjs"],
    "Next.js": ["next.js", "nextjs"],
    "PostgreSQL": ["postgresql", "postgres"],
    "Docker": ["docker", "containerization", "containers"],
    "GitHub Actions": ["github actions", "ci/cd", "ci cd"],
    "SQLAlchemy": ["sqlalchemy"],
    "Pydantic": ["pydantic"],
    "pytest": ["pytest"],
    "LangChain": ["langchain"],
    "LangGraph": ["langgraph"],
    "OpenAI": ["openai", "openai api"],
    "Mistral": ["mistral"],
    "Gemini": ["gemini", "google ai"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "azure openai", "microsoft azure"],
    "Kubernetes": ["kubernetes", "k8s"],
    "MLOps": ["mlops", "model deployment", "model monitoring", "mlflow"],
    "Spark": ["spark", "pyspark"],
    "Airflow": ["airflow"],
    "Terraform": ["terraform", "iac", "infrastructure as code"],
    "SQL": ["sql"],
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower()).strip()


def extract_skills(*texts: str) -> list[str]:
    haystack = normalize_text(" ".join(text for text in texts if text))
    found: list[str] = []
    for canonical, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias.lower()) + r"(?![a-zA-Z0-9])"
            if re.search(pattern, haystack):
                found.append(canonical)
                break
    return sorted(set(found))


def match_skills(required: list[str], owned: list[str]) -> tuple[list[str], list[str]]:
    owned_lookup = {skill.lower(): skill for skill in owned}
    matched: list[str] = []
    missing: list[str] = []
    for skill in required:
        if skill.lower() in owned_lookup:
            matched.append(skill)
        else:
            missing.append(skill)
    return sorted(matched), sorted(missing)
