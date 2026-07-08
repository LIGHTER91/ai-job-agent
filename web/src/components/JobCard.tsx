import { useEffect, useState } from "react";
import { Clipboard, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import type { JobAnalysis, LocalAIResult, Profile } from "../types";
import { generateLocalJobAnalysis, getCachedResult, setCachedResult } from "../lib/webllm";
import { PriorityBadge } from "./PriorityBadge";
import { SkillBadge } from "./SkillBadge";

interface JobCardProps {
  job: JobAnalysis;
  profile: Profile;
  localAIReady: boolean;
}

export function JobCard({ job, profile, localAIReady }: JobCardProps) {
  const [result, setResult] = useState<LocalAIResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    setResult(getCachedResult(job.id));
    setError(null);
    setCopyStatus(null);
  }, [job.id]);

  async function generate(regenerate = false) {
    const cached = !regenerate ? getCachedResult(job.id) : null;
    if (cached) {
      setResult(cached);
      return;
    }
    setGenerating(true);
    setError(null);
    setCopyStatus(null);
    try {
      const next = await generateLocalJobAnalysis(job, profile);
      setResult(next);
      setCachedResult(job.id, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Local AI generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function copySentence() {
    const text = result?.application_sentence || job.rule_based_application_sentence;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy unavailable");
    }
  }

  return (
    <article className="job-card">
      <div className="job-card-top">
        <div>
          <p className="source-line">{job.source} / {job.location} / {job.published_at}</p>
          <h3>{job.title}</h3>
          <p className="company">{job.company}</p>
        </div>
        <div className="score-block">
          <strong>{job.match_score}</strong>
          <span>/100</span>
          <PriorityBadge priority={job.priority} />
        </div>
      </div>

      <p className="summary">{job.rule_based_summary}</p>

      <div className="skill-groups">
        <div>
          <h4>Required skills</h4>
          <div className="skills">
            {job.required_skills.length ? job.required_skills.map((skill) => <SkillBadge key={skill} label={skill} />) : <SkillBadge label="No explicit skill list" />}
          </div>
        </div>
        <div>
          <h4>Matched skills</h4>
          <div className="skills">{job.matched_skills.map((skill) => <SkillBadge key={skill} label={skill} tone="matched" />)}</div>
        </div>
        <div>
          <h4>Missing / weaker</h4>
          <div className="skills">
            {job.missing_skills.length ? job.missing_skills.map((skill) => <SkillBadge key={skill} label={skill} tone="missing" />) : <SkillBadge label="No major gap" tone="matched" />}
          </div>
        </div>
      </div>

      <details className="score-details">
        <summary>Why this score?</summary>
        <ul>
          {job.score_explanation.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>

      <div className="application-box">
        <p className="section-label">Rule-based sentence</p>
        <p>{job.rule_based_application_sentence}</p>
      </div>

      <div className="local-result">
        <div className="local-result-header">
          <p className="section-label">Local AI result</p>
          <div className="button-row">
            <button onClick={() => generate(false)} disabled={!localAIReady || generating}>
              <Sparkles size={16} aria-hidden="true" />
              {generating ? "Generating..." : result ? "Show cached" : "Generate with local AI"}
            </button>
            <button onClick={() => generate(true)} disabled={!localAIReady || generating}>
              <RefreshCw size={16} aria-hidden="true" />
              Regenerate
            </button>
            <button onClick={copySentence}>
              <Clipboard size={16} aria-hidden="true" />
              Copy sentence
            </button>
          </div>
        </div>
        {copyStatus && <p className="copy-status">{copyStatus}</p>}
        {error && <p className="error">{error}. Fallback text remains available.</p>}
        {result ? (
          <div>
            <p><strong>Application sentence:</strong> {result.application_sentence}</p>
            <p><strong>Fit analysis:</strong> {result.job_fit_analysis}</p>
            <ul>
              {result.preparation_points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
        ) : (
          <p className="muted">Activate local AI, then generate a browser-only analysis for this job.</p>
        )}
      </div>

      <a className="job-link" href={job.url} target="_blank" rel="noreferrer">
        <ExternalLink size={16} aria-hidden="true" />
        View job posting
      </a>
    </article>
  );
}
