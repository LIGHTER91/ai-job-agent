# Codex Prompt — AI Job Agent with WebLLM

Create or improve a complete project named `ai-job-agent`.

## Goal

Build a portfolio-ready AI Job Watch Agent for Lucien Lachaud.

The app should collect AI Engineer / Data Scientist / LLM Engineer job postings, compare them with Lucien's profile, generate a static JSON file, and render the result in a React dashboard deployed on GitHub Pages.

The important architecture choice is **Option B: WebLLM in the browser**.

The project must work without a backend, without a database, without a paid API key, and without a cloud LLM.

## Product architecture

Use this flow:

```txt
GitHub Actions
-> Python job agent
-> web/public/data/jobs.json

GitHub Pages
-> React + Vite
-> WebLLM in the browser
-> local LLM generation with WebGPU
```

## User profile

Lucien Lachaud has a Master's degree in Computer Science, AI track.

Target roles:

- AI Engineer
- Applied AI Engineer
- LLM Engineer
- RAG Engineer
- Data Scientist Junior
- Machine Learning Engineer
- NLP Engineer
- Computer Vision Engineer

Main experience:

- internship at Thales AVS;
- knowledge capitalization pipelines;
- multi-source ingestion;
- LLM orchestration;
- FAISS;
- entity extraction;
- metadata extraction;
- knowledge graph;
- prompt evaluation;
- AI industrialization.

Important portfolio project:

Agent Governance Control Plane with FastAPI, PostgreSQL, SQLAlchemy, Pydantic, pytest, React, GitHub Actions, audit logs, policy engine, runtime activity, evidence bundle and policy review workflow.

Strong skills:

- Python
- FastAPI
- RAG
- LLM
- FAISS
- vector search
- NLP
- computer vision
- React
- Next.js
- PostgreSQL
- Docker
- GitHub Actions
- SQLAlchemy
- Pydantic
- pytest
- LangChain
- LangGraph
- OpenAI
- Mistral
- Gemini

Weaker or learning skills:

- AWS
- Azure
- advanced MLOps
- advanced Kubernetes
- Spark
- Airflow
- Terraform

## Hard constraints

- No backend server.
- No database.
- No mandatory paid API.
- No cloud LLM in the MVP.
- The project must work with mock data.
- The app must work even if WebGPU/WebLLM is unavailable.
- WebLLM must not load automatically on page load.
- Add an explicit `Activate local AI` button.
- Show the model loading status and progress.
- Use a Web Worker for WebLLM.
- Cache local AI generations in localStorage.
- Keep the dashboard compatible with GitHub Pages.
- Configure Vite with `base: "/ai-job-agent/"`.

## Expected structure

```txt
agent/
  main.py
  config.py
  profile.py
  sources/
    base.py
    mock.py
    remotive.py
    adzuna.py
    france_travail.py
  intelligence/
    skills.py
    scoring.py
    summarizer.py
  tests/
    test_skills.py
    test_scoring.py

web/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  public/data/jobs.json
  src/
    App.tsx
    main.tsx
    types.ts
    styles.css
    components/
      Header.tsx
      Filters.tsx
      JobCard.tsx
      LocalAIPanel.tsx
      PriorityBadge.tsx
      SkillBadge.tsx
    lib/
      browserSupport.ts
      promptBuilder.ts
      webllm.ts
    workers/
      webllmWorker.ts

.github/workflows/
  daily-agent.yml
  deploy-pages.yml

AGENTS.md
README.md
.env.example
Makefile
requirements.txt
```

## Python agent requirements

Implement a deterministic Python layer that:

1. loads Lucien's profile from `agent/profile.py`;
2. fetches jobs from Remotive when available;
3. always supports a local mock fallback;
4. prepares optional adapters for Adzuna and France Travail;
5. filters/searches jobs related to AI, LLM, RAG, NLP, ML, Data Science and Computer Vision;
6. extracts skills from title, tags and description;
7. compares required skills with Lucien's skills;
8. computes an explainable score out of 100;
9. assigns priority: high, medium or low;
10. writes `web/public/data/jobs.json`.

Scoring formula:

```txt
40% role/profile similarity
30% owned skills vs required skills
15% location preference
10% junior compatibility
5% GenAI/RAG/LLM bonus
```

Priority:

```txt
score >= 75 -> high
score >= 50 -> medium
score < 50  -> low
```

## JSON format

Generate this shape:

```json
{
  "generated_at": "2026-07-07T22:00:00Z",
  "profile": {
    "name": "Lucien Lachaud",
    "target": "AI Engineer / Applied AI Engineer",
    "target_roles": [],
    "strong_skills": [],
    "weaker_skills_or_to_learn": []
  },
  "jobs": [
    {
      "id": "mock-ai-engineer-rag-bordeaux",
      "title": "AI Engineer - RAG & LLM Applications",
      "company": "Nova Knowledge AI",
      "location": "Bordeaux, France - Hybrid",
      "source": "Mock",
      "url": "https://example.com/jobs/ai-engineer-rag-bordeaux",
      "published_at": "2026-07-07",
      "match_score": 84,
      "priority": "high",
      "raw_description": "...",
      "required_skills": ["Python", "LLM", "RAG"],
      "matched_skills": ["Python", "LLM", "RAG"],
      "missing_skills": ["AWS"],
      "rule_based_summary": "...",
      "rule_based_application_sentence": "...",
      "score_explanation": ["..."]
    }
  ]
}
```

## Frontend requirements

Create a React + Vite + TypeScript dashboard.

The page must include:

- title: `AI Job Watch Agent`;
- subtitle explaining local browser LLM with WebLLM;
- generated date;
- number of jobs;
- average score;
- high-priority count;
- WebGPU/WebLLM status panel;
- `Activate local AI` button;
- search filter;
- priority filter;
- source filter;
- score/date sort;
- job cards;
- score explanation;
- matched and missing skills;
- rule-based application sentence;
- `Generate with local AI` button per job;
- local AI result panel;
- copy sentence button;
- regenerate button;
- final `Why this project matters` portfolio section.

## WebLLM requirements

Use `@mlc-ai/web-llm`.

Implementation expectations:

- `web/src/workers/webllmWorker.ts` should use `WebWorkerMLCEngineHandler`.
- `web/src/lib/webllm.ts` should use `CreateWebWorkerMLCEngine`.
- Select the model from `prebuiltAppConfig.model_list` by pattern rather than relying on one hardcoded ID.
- Prefer a small model by default.
- Detect WebGPU with `navigator.gpu`.
- Show model loading progress.
- Use OpenAI-style chat completions.
- Use JSON mode when possible.
- Parse JSON robustly.
- If parsing fails, show text fallback.
- If WebLLM fails, keep the UI usable with rule-based text.

System prompt:

```txt
You are a career assistant specialized in AI engineering roles.
You help Lucien Lachaud analyze AI Engineer, LLM Engineer, Data Scientist and Machine Learning Engineer jobs.
Be concrete, honest and concise. Do not invent experience. If a skill is missing, say it clearly.
Return strict JSON only.
```

Expected model output:

```json
{
  "application_sentence": "...",
  "job_fit_analysis": "...",
  "preparation_points": ["...", "...", "..."]
}
```

## GitHub Actions

Create `daily-agent.yml`:

- `workflow_dispatch`;
- daily `schedule`;
- Python 3.12;
- install requirements;
- run `python -m agent.main`;
- commit `web/public/data/jobs.json` if changed.

Create `deploy-pages.yml`:

- trigger on push to `main`;
- Node 22;
- build React;
- upload Pages artifact;
- deploy with `actions/deploy-pages`.

## README requirements

The README must explain:

- what the project does;
- why it is useful for portfolio;
- architecture;
- local setup;
- WebLLM behavior;
- scoring formula;
- GitHub Pages deployment;
- GitHub Actions automation;
- limitations;
- next improvements.

## Quality bar

The project should run locally with:

```bash
python -m agent.main
pytest agent/tests -q
cd web && npm install && npm run dev
cd web && npm run build
```

Do not remove fallback behavior. The app must remain useful even without WebLLM.
