# Implementation notes

## MVP split

This repository intentionally keeps the job-watch agent deterministic and the generative layer optional.

That makes the demo more reliable for GitHub Pages:

- deterministic Python generates data;
- React renders the data;
- WebLLM adds local generation only when the browser supports it.

## Why WebLLM is optional

WebLLM depends on WebGPU and a model download. A recruiter opening the portfolio on a locked-down browser should still see a complete product even if local inference is unavailable.

## Suggested first tasks in Codex

1. Run the Python tests.
2. Run `python -m agent.main`.
3. Run the Vite build.
4. Fix any TypeScript issues caused by dependency version changes.
5. Polish the dashboard UI.
6. Push to GitHub and enable Pages from GitHub Actions.
