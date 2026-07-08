# AGENTS.md — Codex instructions for `ai-job-agent`

## Project purpose

Build a portfolio-ready AI Job Watch Agent for Lucien Lachaud.

The product is a static, free-to-host AI job monitoring dashboard:

- Python collects and scores AI/Data/LLM job postings.
- The agent writes `web/public/data/jobs.json`.
- React + Vite reads this JSON and renders a dashboard.
- WebLLM runs a local LLM in the browser with WebGPU.
- GitHub Actions refreshes the JSON daily.
- GitHub Pages hosts the static frontend.

## Non-negotiable constraints

- No backend server.
- No database.
- No mandatory paid API.
- No OpenAI/Mistral cloud call in the MVP.
- The app must work when WebGPU/WebLLM is unavailable.
- WebLLM must never load automatically on first page load.
- The user must explicitly click `Activate local AI`.
- Keep `jobs.json` stable and backward-compatible unless the README and types are updated.

## Architecture rules

Keep the project split into two layers:

1. `agent/`: deterministic Python data layer.
2. `web/`: static React UI plus optional browser-side WebLLM generation.

The Python layer owns:

- job fetching;
- mock fallback;
- skill extraction;
- scoring;
- priority assignment;
- rule-based fallback summary/application sentence.

The browser-side WebLLM layer owns:

- local application sentence refinement;
- honest fit analysis;
- preparation points;
- localStorage cache per job.

## WebLLM rules

- Use `@mlc-ai/web-llm`.
- Use a Web Worker through `WebWorkerMLCEngineHandler` and `CreateWebWorkerMLCEngine`.
- Detect WebGPU with `navigator.gpu`.
- Prefer a small model by default.
- Do not hard-fail if the preferred model ID changes. Select from `prebuiltAppConfig.model_list` by pattern, with a safe fallback.
- Cache generated output in localStorage.
- Provide clear error and fallback states.
- Do not invent Lucien's experience. Prompts must explicitly forbid invention.

## Code quality expectations

- Keep functions small and testable.
- Use TypeScript types for the JSON payload.
- Keep UI components readable and reusable.
- Keep the dashboard static and compatible with GitHub Pages under `/ai-job-agent/`.
- Avoid adding heavy UI frameworks unless explicitly requested.
- Prefer clear CSS over excessive dependencies.

## Commands

From repo root:

```bash
python -m agent.main
pytest agent/tests -q
```

Frontend:

```bash
cd web
npm install
npm run dev
npm run build
```

## Definition of done

A task is complete only if:

- the Python agent still generates `web/public/data/jobs.json`;
- the dashboard still loads without WebLLM;
- WebLLM is activated only on click;
- GitHub Pages base path remains `/ai-job-agent/`;
- README instructions remain accurate;
- tests are added or updated for changed Python logic.
