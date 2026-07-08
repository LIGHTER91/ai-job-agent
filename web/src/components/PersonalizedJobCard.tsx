import { Bookmark, Clipboard, ExternalLink, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { CandidateProfile, ConsentSettings, LocalAIResult, PersonalizedJobMatch } from "../types";
import { generatedApplicationToResult, findGeneratedApplication, saveGeneratedApplication } from "../lib/storage/aiGenerationCache";
import { generateLocalJobAnalysis } from "../lib/webllm";
import { PriorityBadge } from "./PriorityBadge";
import { SkillBadge } from "./SkillBadge";

interface PersonalizedJobCardProps {
  match: PersonalizedJobMatch;
  profile: CandidateProfile;
  localAIReady: boolean;
  modelId: string | null;
  consent: ConsentSettings;
  profileSnapshotId?: string;
  onSave: (match: PersonalizedJobMatch) => Promise<void>;
  onDismiss: (match: PersonalizedJobMatch) => Promise<void>;
  onOpen: (match: PersonalizedJobMatch) => void;
  onGenerationCompleted: () => void;
}

export function PersonalizedJobCard({
  match,
  profile,
  localAIReady,
  modelId,
  consent,
  profileSnapshotId,
  onSave,
  onDismiss,
  onOpen,
  onGenerationCompleted,
}: PersonalizedJobCardProps) {
  const [result, setResult] = useState<LocalAIResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    setCopyStatus(null);
    if (consent.localHistory && consent.saveAiGenerations) {
      void findGeneratedApplication(match.job.id, profileSnapshotId).then((cached) => {
        if (!cancelled && cached) {
          setResult(generatedApplicationToResult(cached));
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [consent.localHistory, consent.saveAiGenerations, match.job.id, profileSnapshotId]);

  async function generate(regenerate = false) {
    if (!regenerate && result) return;
    setGenerating(true);
    setError(null);
    setCopyStatus(null);
    try {
      const next = await generateLocalJobAnalysis(match.job, profile, match);
      setResult(next);
      if (consent.localHistory && consent.saveAiGenerations) {
        await saveGeneratedApplication({
          jobId: match.job.id,
          profileSnapshotId,
          model: modelId ?? undefined,
          result: next,
        });
      }
      onGenerationCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Local AI generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function copySentence() {
    const text = result?.application_sentence || match.ruleBasedApplicationSentence;
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
          <p className="source-line">{match.job.source} / {match.job.location} / {match.job.published_at}</p>
          <h3>{match.job.title}</h3>
          <p className="company">{match.job.company}</p>
        </div>
        <div className="score-block">
          <strong>{match.score}</strong>
          <span>/100</span>
          <PriorityBadge priority={match.priority} />
        </div>
      </div>

      <p className="summary">{match.job.rule_based_summary}</p>

      <div className="score-bars" aria-label="Score breakdown">
        <span>Role {match.roleScore}</span>
        <span>Skills {match.skillScore}</span>
        <span>Domain {match.domainScore}</span>
        <span>Seniority {match.seniorityScore}</span>
        <span>Location {match.locationScore}</span>
      </div>

      <div className="skill-groups">
        <div>
          <h4>Matched skills</h4>
          <div className="skills">
            {match.matchedSkills.length ? match.matchedSkills.map((skill) => <SkillBadge key={skill} label={skill} tone="matched" />) : <SkillBadge label="Limited overlap" tone="missing" />}
          </div>
        </div>
        <div>
          <h4>Missing skills</h4>
          <div className="skills">
            {match.missingSkills.length ? match.missingSkills.map((skill) => <SkillBadge key={skill} label={skill} tone="missing" />) : <SkillBadge label="No major gap" tone="matched" />}
          </div>
        </div>
        <div>
          <h4>Matched domains</h4>
          <div className="skills">
            {match.matchedDomains.length ? match.matchedDomains.map((domain) => <SkillBadge key={domain} label={domain} />) : <SkillBadge label="No explicit overlap" />}
          </div>
        </div>
      </div>

      <details className="score-details" open>
        <summary>Why this score?</summary>
        <ul>
          {match.explanation.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>

      <div className="application-box">
        <p className="section-label">Rule-based application sentence</p>
        <p>{match.ruleBasedApplicationSentence}</p>
      </div>

      <div className="local-result">
        <div className="local-result-header">
          <div>
            <p className="section-label">Local AI advice</p>
            <p className="muted">Click-gated WebLLM generation. Nothing is sent to a server.</p>
          </div>
          <div className="button-row">
            <button onClick={() => void generate(false)} disabled={!localAIReady || generating}>
              <Sparkles size={16} aria-hidden="true" />
              {generating ? "Generating..." : result ? "Show advice" : "Generate"}
            </button>
            <button onClick={() => void generate(true)} disabled={!localAIReady || generating}>
              <RefreshCw size={16} aria-hidden="true" />
              Regenerate
            </button>
            <button onClick={() => void copySentence()}>
              <Clipboard size={16} aria-hidden="true" />
              Copy
            </button>
          </div>
        </div>
        {copyStatus && <p className="copy-status">{copyStatus}</p>}
        {error && <p className="error">{error} Fallback text remains available.</p>}
        {result ? (
          <div className="ai-output">
            <p><strong>Application sentence:</strong> {result.application_sentence}</p>
            <p><strong>Fit analysis:</strong> {result.job_fit_analysis}</p>
            <ul>
              {result.preparation_points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
        ) : (
          <p className="muted">Activate local AI above to generate personalized advice in this browser.</p>
        )}
      </div>

      <div className="job-actions">
        <button onClick={async () => { await onSave(match); setActionStatus("Saved locally if history is enabled."); }}>
          <Bookmark size={16} aria-hidden="true" />
          Save job
        </button>
        <button onClick={async () => { await onDismiss(match); setActionStatus("Dismissed locally if history is enabled."); }}>
          <XCircle size={16} aria-hidden="true" />
          Dismiss
        </button>
        <a className="job-link" href={match.job.url} target="_blank" rel="noreferrer" onClick={() => onOpen(match)}>
          <ExternalLink size={16} aria-hidden="true" />
          Open job
        </a>
      </div>
      {actionStatus && <p className="muted">{actionStatus}</p>}
    </article>
  );
}
