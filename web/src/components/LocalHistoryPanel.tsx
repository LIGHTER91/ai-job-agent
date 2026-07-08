import { History, RotateCcw } from "lucide-react";
import type {
  CandidateProfileSnapshot,
  DismissedJob,
  GeneratedApplication,
  JobAnalysis,
  JobAnalysisSnapshot,
  SavedJob,
} from "../types";
import { snapshotToProfile } from "../lib/storage/profileMemory";

interface LocalHistoryPanelProps {
  profiles: CandidateProfileSnapshot[];
  savedJobs: SavedJob[];
  dismissedJobs: DismissedJob[];
  analyses: JobAnalysisSnapshot[];
  generations: GeneratedApplication[];
  jobs: JobAnalysis[];
  onRestoreProfile: (profile: ReturnType<typeof snapshotToProfile>) => void;
  onClearHistory: () => Promise<void>;
}

function jobLabel(jobs: JobAnalysis[], jobId: string): string {
  const job = jobs.find((item) => item.id === jobId);
  return job ? `${job.title} at ${job.company}` : jobId;
}

export function LocalHistoryPanel({
  profiles,
  savedJobs,
  dismissedJobs,
  analyses,
  generations,
  jobs,
  onRestoreProfile,
  onClearHistory,
}: LocalHistoryPanelProps) {
  return (
    <section className="panel history-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Local history</p>
          <h2>Saved in this browser</h2>
        </div>
        <History size={22} aria-hidden="true" />
      </div>
      <div className="history-grid">
        <div className="history-column">
          <h3>Profile snapshots</h3>
          {profiles.slice(0, 4).map((profile) => (
            <div className="history-row" key={profile.id}>
              <span>{profile.fileName ?? "Saved profile"} / {new Date(profile.updatedAt).toLocaleDateString()}</span>
              <button onClick={() => onRestoreProfile(snapshotToProfile(profile))}>
                <RotateCcw size={14} aria-hidden="true" />
                Restore
              </button>
            </div>
          ))}
          {!profiles.length && <p className="muted">No saved profile yet.</p>}
        </div>
        <div className="history-column">
          <h3>Saved jobs</h3>
          {savedJobs.slice(0, 5).map((saved) => (
            <p key={saved.id}>{jobLabel(jobs, saved.jobId)} {saved.score !== undefined ? `/ ${saved.score}` : ""}</p>
          ))}
          {!savedJobs.length && <p className="muted">No saved jobs yet.</p>}
        </div>
        <div className="history-column">
          <h3>Recent match analyses</h3>
          {analyses.slice(0, 5).map((analysis) => (
            <p key={analysis.id}>{jobLabel(jobs, analysis.jobId)} / {analysis.score} / {analysis.priority}</p>
          ))}
          {!analyses.length && <p className="muted">No match history yet.</p>}
        </div>
        <div className="history-column">
          <h3>Generated advice</h3>
          {generations.slice(0, 4).map((generation) => (
            <p key={generation.id}>{jobLabel(jobs, generation.jobId)}: {generation.applicationSentence}</p>
          ))}
          {!generations.length && <p className="muted">No saved local AI advice yet.</p>}
        </div>
      </div>
      <p className="muted">Dismissed jobs stored locally: {dismissedJobs.length}</p>
      <button className="ghost-button" onClick={() => void onClearHistory()}>
        Clear history
      </button>
    </section>
  );
}
