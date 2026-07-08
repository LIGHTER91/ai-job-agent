import { Bot, Loader2, Play, RotateCcw, Wrench } from "lucide-react";
import type { BrowserAgentEvent, BrowserAgentRun, CandidateProfile, JobAnalysis } from "../types";
import { runBrowserJobAgent } from "../lib/browserJobAgent/agent";
import { useState } from "react";

interface BrowserJobAgentPanelProps {
  profile: CandidateProfile;
  staticJobs: JobAnalysis[];
  localAIReady: boolean;
  cvReady: boolean;
  profileStatus: string;
  profileEnriching: boolean;
  onRefreshProfileWithLLM: () => void;
  onRunComplete: (run: BrowserAgentRun) => void;
  onResetToStatic: () => void;
}

export function BrowserJobAgentPanel({
  profile,
  staticJobs,
  localAIReady,
  cvReady,
  profileStatus,
  profileEnriching,
  onRefreshProfileWithLLM,
  onRunComplete,
  onResetToStatic,
}: BrowserJobAgentPanelProps) {
  const [events, setEvents] = useState<BrowserAgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<BrowserAgentRun | null>(null);
  const [useLocalLLM, setUseLocalLLM] = useState(true);
  const externalSearchCount = lastRun?.externalSearchLinks?.length ?? 0;
  const canRun = cvReady && !profileEnriching && !running;
  const profileMode = profile.extractionMethod === "webllm" ? "CV + WebLLM" : cvReady ? "CV + keywords" : "Waiting for CV";

  async function runAgent() {
    setRunning(true);
    setEvents([]);
    setLastRun(null);
    try {
      const run = await runBrowserJobAgent({
        profile,
        staticJobs,
        useLocalLLM,
        onEvent: (event) => setEvents((current) => [...current, event]),
      });
      setLastRun(run);
      onRunComplete(run);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="browser-agent-panel">
      <div className="agent-main">
        <div className="panel-header">
          <div>
            <p className="section-label">Frontend job-search agent</p>
            <h2>3. Launch job agent</h2>
          </div>
          <Bot size={23} aria-hidden="true" />
        </div>
        <p>
          Runs in the browser: plans searches, calls public job APIs as tools, ranks results against the CV and logs
          every step.
        </p>
        <div className="agent-controls">
          <label className="mini-toggle">
            <input
              type="checkbox"
              checked={useLocalLLM}
              onChange={(event) => setUseLocalLLM(event.target.checked)}
              disabled={running}
            />
            <span>Use WebLLM as planner when local AI is ready</span>
          </label>
          <button onClick={() => void runAgent()} disabled={!canRun}>
            {running ? <Loader2 size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {running ? "Agent running..." : profileEnriching ? "Reading CV..." : "Run browser agent"}
          </button>
          <button
            className="ghost-button"
            onClick={onRefreshProfileWithLLM}
            disabled={!cvReady || !localAIReady || profileEnriching || running}
          >
            <Wrench size={16} aria-hidden="true" />
            Re-read CV with WebLLM
          </button>
          <button className="ghost-button" onClick={onResetToStatic} disabled={running}>
            <RotateCcw size={16} aria-hidden="true" />
            Static jobs.json
          </button>
        </div>
        <div className="agent-status-grid">
          <span><strong>Planner</strong>{lastRun?.planner ?? (localAIReady && useLocalLLM ? "WebLLM ready" : "Deterministic")}</span>
          <span><strong>Profile</strong>{profileMode}</span>
          <span><strong>Tools</strong>APIs + company ATS</span>
          <span><strong>Search links</strong>{lastRun ? `${externalSearchCount} prepared` : "Career pages, Google, LinkedIn"}</span>
          <span><strong>Results</strong>{lastRun ? `${lastRun.matches.length} ranked` : `${staticJobs.length} static jobs`}</span>
        </div>
        <p className="pipeline-note">{profileStatus}</p>
      </div>
      <div className="agent-log" aria-live="polite">
        <div className="agent-log-header">
          <Wrench size={18} aria-hidden="true" />
          <strong>Tool log</strong>
        </div>
        {events.length ? (
          events.map((event) => (
            <div className={`agent-event agent-${event.level}`} key={event.id}>
              <span>{new Date(event.at).toLocaleTimeString()}</span>
              <strong>{event.label}</strong>
              <p>{event.detail}</p>
            </div>
          ))
        ) : (
          <p className="muted">Run the agent to see planning, tool calls, API results and ranking logs here.</p>
        )}
      </div>
    </section>
  );
}
