import { BarChart3, Clock3, FileText } from "lucide-react";
import type { JobsPayload } from "../types";

interface HeaderProps {
  payload: JobsPayload;
  averageScore: number;
  highPriority: number;
  demoMode: boolean;
  displayJobCount?: number;
  agentMode?: boolean;
}

export function Header({ payload, highPriority, displayJobCount, agentMode }: HeaderProps) {
  const generatedDate = payload.generated_at ? new Date(payload.generated_at) : null;
  return (
    <section className="hero-summary" id="dashboard">
      <div>
        <h1>AI Job Matcher</h1>
        <p>Upload your CV. The local AI extracts the domain, skills and target jobs before matching.</p>
      </div>
      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon"><FileText size={20} aria-hidden="true" /></span>
          <div>
            <span>Jobs in library</span>
            <strong>{displayJobCount ?? payload.jobs.length}</strong>
            <small>{agentMode ? "Live browser agent" : "Static local dataset"}</small>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><BarChart3 size={20} aria-hidden="true" /></span>
          <div>
            <span>Top matches</span>
            <strong>{highPriority}</strong>
            <small>High relevance</small>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><Clock3 size={20} aria-hidden="true" /></span>
          <div>
            <span>Last scan</span>
            <strong>{agentMode ? "Just now" : generatedDate ? generatedDate.toLocaleDateString() : "Ready"}</strong>
            <small>{agentMode ? "Browser tools ran" : "Up to date"}</small>
          </div>
        </article>
      </div>
    </section>
  );
}
