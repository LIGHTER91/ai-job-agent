import { Bookmark, ExternalLink, Sparkles, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { PersonalizedJobMatch } from "../types";
import { SkillBadge } from "./SkillBadge";

interface CompactJobMatchesProps {
  matches: PersonalizedJobMatch[];
  totalJobs: number;
  agentMode: boolean;
  onSave: (match: PersonalizedJobMatch) => Promise<void>;
  onDismiss: (match: PersonalizedJobMatch) => Promise<void>;
  onOpen: (match: PersonalizedJobMatch) => void;
  controls?: ReactNode;
  maxVisible?: number;
  title?: string;
  subtitle?: string;
  onViewAll?: () => void;
  dismissedIds?: Set<string>;
}

function scoreClass(score: number): string {
  if (score >= 75) return "score-ring high";
  if (score >= 50) return "score-ring medium";
  return "score-ring low";
}

export function CompactJobMatches({
  matches,
  totalJobs,
  agentMode,
  onSave,
  onDismiss,
  onOpen,
  controls,
  maxVisible = 8,
  title = "4. Jobs found",
  subtitle,
  onViewAll,
  dismissedIds,
}: CompactJobMatchesProps) {
  const visible = matches.slice(0, maxVisible);
  return (
    <section className="dashboard-card matches-card" id="matches">
      <div className="card-title-row">
        <div>
          <h2>{title}</h2>
          <p>{subtitle ?? (agentMode ? "Live results returned by the browser agent" : "Static jobs ready until the agent is launched")}</p>
        </div>
        <div className="table-actions">
          {controls ? (
            <details className="table-filter-details">
              <summary>Filters</summary>
              <div className="compact-filters">{controls}</div>
            </details>
          ) : null}
        </div>
      </div>
      <div className="matches-table" role="table" aria-label="Ranked job matches">
        <div className="matches-row matches-head" role="row">
          <span>Match</span>
          <span>Job</span>
          <span>Company</span>
          <span>Location</span>
          <span>Key skills</span>
          <span>Score</span>
          <span>Actions</span>
        </div>
        {visible.map((match) => {
          const dismissed = dismissedIds?.has(match.job.id) ?? false;
          return (
            <div className={dismissed ? "matches-row dismissed-row" : "matches-row"} role="row" key={match.job.id}>
              <span className={scoreClass(match.score)}>{match.score}%</span>
              <span className="job-title-cell">
                <strong>{match.job.title}</strong>
                <small>{match.job.source}{dismissed ? " - Hidden from dashboard" : ""}</small>
              </span>
              <span>{match.job.company}</span>
              <span>{match.job.location}</span>
              <span className="table-skills">
                {(match.matchedSkills.length ? match.matchedSkills : match.job.required_skills).slice(0, 4).map((skill) => (
                  <SkillBadge key={skill} label={skill} tone={match.matchedSkills.includes(skill) ? "matched" : "neutral"} />
                ))}
                {!match.matchedSkills.length && !match.job.required_skills.length && <SkillBadge label="AI/Data" />}
              </span>
              <span className="score-star"><Sparkles size={15} aria-hidden="true" /> {Math.max(1, match.score / 20).toFixed(1)}</span>
              <span className="row-actions">
                <button aria-label={`Save ${match.job.title}`} onClick={() => void onSave(match)}>
                  <Bookmark size={15} aria-hidden="true" />
                </button>
                <button aria-label={`Dismiss ${match.job.title}`} onClick={() => void onDismiss(match)}>
                  <XCircle size={15} aria-hidden="true" />
                </button>
                <a href={match.job.url} target="_blank" rel="noreferrer" onClick={() => onOpen(match)}>
                  <ExternalLink size={15} aria-hidden="true" />
                  View
                </a>
              </span>
            </div>
          );
        })}
        {!visible.length && (
          <div className="matches-empty" role="row">
            <span>No jobs to show. Upload a CV and run the agent.</span>
          </div>
        )}
      </div>
      <div className="matches-footer">
        <span>Showing top {visible.length} of {agentMode ? matches.length : matches.length} jobs</span>
        {onViewAll ? (
          <button className="link-button" type="button" onClick={onViewAll}>View all matches</button>
        ) : (
          <a href="#matches">View all matches</a>
        )}
      </div>
    </section>
  );
}
