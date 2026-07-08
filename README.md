# AI Job Matcher — Local-first CV-to-job matching agent

A privacy-aware AI/Data/LLM job matching product that runs as a static GitHub Pages site.

The Python agent collects and refreshes public job offers into `web/public/data/jobs.json`. The React frontend lets a visitor upload a CV, parses it locally in the browser, extracts a candidate profile, recomputes personalized job scores, and can optionally use WebLLM locally for application advice.

Target URL:

```txt
https://lighter91.github.io/ai-job-agent/
```

## What It Does

- uploads PDF or TXT CVs in the browser;
- extracts skills, target roles, tools, frameworks, domains, education, experience keywords, languages, seniority and location signals;
- compares the parsed profile with static jobs from `jobs.json`;
- can launch a browser-side job-search agent from GitHub Pages;
- explains matched skills, missing skills and score reasons;
- optionally saves local history in IndexedDB after consent;
- optionally generates job-fit advice with WebLLM in the browser;
- stays usable without WebLLM, WebGPU, analytics, a backend, authentication or API keys.

If no CV is uploaded, the app runs in demo mode using Lucien's profile so the portfolio remains useful immediately.

## Architecture

```txt
GitHub Actions
  -> Python job agent
  -> public job sources plus fallback data
  -> web/public/data/jobs.json

Browser
  -> user uploads CV
  -> local PDF/TXT parser
  -> CandidateProfile
  -> personalized scoring against jobs.json
  -> optional browser agent calls public job APIs as tools
  -> optional IndexedDB local memory
  -> dashboard results
  -> optional WebLLM local generation
  -> optional anonymous analytics
```

There is no backend server, database server, authentication, required cloud LLM, required API key, cookie-based tracking, or server-side CV processing.

## Privacy Model

Default behavior:

- no cookies by default;
- analytics disabled by default;
- full CV text not saved by default;
- uploaded CV content is never sent to a server by the app;
- local history is disabled until the user opts in.

The UI provides consent toggles for:

- saving the parsed profile locally;
- saving job match history locally;
- saving WebLLM-generated advice locally;
- saving full extracted CV text locally, clearly marked as sensitive;
- enabling anonymous analytics.

IndexedDB stores local memory only when enabled. `localStorage` is used only for lightweight consent and preferences. Users can clear local history, delete saved profiles, export local data as JSON, import previous local data, disable analytics, and reset privacy settings.

Analytics events never include names, email, phone numbers, addresses, raw CV text, full work history, generated application text, or other personal CV data. The external analytics adapter is a disabled stub unless explicitly configured later.

## Personalized Scoring

The frontend computes CV-based scores with this explainable formula:

```txt
35% role match
30% skill overlap
15% domain/project overlap
10% seniority compatibility
10% location/remote compatibility
```

Priority mapping:

```txt
score >= 75 -> high
score >= 50 -> medium
score < 50  -> low
```

The original Python score still exists in `jobs.json`; the browser adds the personalized layer based on the uploaded CV.

## Browser Job-Search Agent

The frontend also includes a GitHub Pages-compatible job-search agent. It runs entirely in the browser and exposes visible tool logs.

Available tools:

- `search_remotive({ query, limit })`;
- `search_jobicy({ query, limit })`;
- `search_static_jobs({ query, limit })`;
- `rank_matches`.

When WebLLM is active, the local model can plan which search tools to call. When WebLLM is not active or planning fails, the browser agent uses a deterministic plan from the active candidate profile. In both cases, the tool calls and results are shown in the UI so the user can see the agent working.

Important GitHub Pages constraint: this browser agent can only call public APIs that allow browser requests through CORS. If an external source blocks browser calls, the agent logs the failure and keeps using working tools and the static JSON fallback. The Python agent remains the reliable scheduled collector for persisted `jobs.json` updates.

## WebLLM

WebLLM is optional and manually activated with the `Activate local AI` button.

The app:

1. checks `navigator.gpu` for WebGPU support;
2. lazy-loads `@mlc-ai/web-llm`;
3. runs the model in a Web Worker;
4. prompts it with only parsed CV profile data and job data;
5. asks for JSON containing an application sentence, short fit analysis and three preparation points;
6. stores generations only when local history and AI-generation consent are enabled.

If WebGPU, model loading, generation, or storage fails, the dashboard keeps working with deterministic fallback text.

## Job Sources

The Python agent searches live sources by default, then falls back to `MockSource` only when no live source returns jobs.

Default free sources:

- Remotive public API: `ENABLE_REMOTIVE=true`;
- Jobicy public API: `ENABLE_JOBICY=true`.

Optional credential-based sources:

- Adzuna: enable with `ENABLE_ADZUNA=true` plus `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`;
- France Travail: reserved as an opt-in placeholder until OAuth is wired.

The generated JSON includes a `search_agent` block with queries used, enabled sources, source counts, and whether fallback data was used.

## Local Setup

Requirements:

- Python 3.12 recommended;
- Node 20+;
- npm.

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Generate static job data:

```bash
python -m agent.main
```

Run Python tests:

```bash
pytest -q
```

Install frontend dependencies:

```bash
cd web
npm install
```

Run the frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## Frontend Features

- product header with GitHub Pages, WebLLM, no-backend and optional-history badges;
- browser-side job-search agent with visible tool calls and ranking logs;
- privacy notice explaining local CV processing;
- PDF/TXT resume upload and parsing status;
- DOCX availability message when selected;
- editable target roles and skills;
- profile summary for skills, tools, frameworks, domains, education, experience keywords, languages, seniority and location;
- memory and consent settings;
- explainable personalized job cards;
- save, dismiss and open job actions;
- optional local AI advice per job;
- local history panel for saved profiles, jobs, analyses and generated advice;
- portfolio architecture section.

## GitHub Pages

Vite is configured with:

```ts
base: "/ai-job-agent/"
```

In repository settings, set **Pages** source to **GitHub Actions**. The `deploy-pages.yml` workflow installs Node, builds the Vite app in `web/`, uploads `web/dist`, and deploys it to GitHub Pages.

## GitHub Actions

`daily-agent.yml`:

- manual trigger with `workflow_dispatch`;
- daily scheduled run;
- installs Python dependencies;
- runs `python -m agent.main`;
- commits `web/public/data/jobs.json` only when it changed.

`deploy-pages.yml`:

- triggers on push to `main`;
- installs Node dependencies;
- runs `npm run build`;
- deploys `web/dist` to GitHub Pages.

## Limitations

- PDF parsing may fail on scanned CVs.
- OCR is not included.
- DOCX parsing is not implemented yet.
- WebLLM requires a WebGPU-compatible browser and hardware.
- Local LLMs are smaller and less capable than cloud LLMs.
- Analytics are disabled by default.
- External analytics require explicit configuration and consent.
- Job sources may be limited by public API availability and rate limits.

## Future Improvements

- OCR for scanned PDFs;
- optional DOCX parsing with `mammoth`;
- semantic embeddings for deeper job/profile similarity;
- richer source integrations;
- local-only CSV export;
- interview preparation mode;
- saved search presets;
- accessibility and keyboard workflow tests.
