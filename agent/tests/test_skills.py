from agent.intelligence.skills import extract_skills, match_skills


def test_extract_skills_detects_aliases() -> None:
    skills = extract_skills("Build RAG with FastAPI", "semantic search, embeddings and LLM evaluation")
    assert "RAG" in skills
    assert "FastAPI" in skills
    assert "Vector search" in skills
    assert "LLM" in skills


def test_match_skills_splits_matched_and_missing() -> None:
    matched, missing = match_skills(["Python", "AWS"], ["Python", "FastAPI"])
    assert matched == ["Python"]
    assert missing == ["AWS"]
