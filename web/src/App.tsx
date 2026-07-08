import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BrowserAgentRun,
  CandidateProfile,
  CandidateProfileSnapshot,
  ConsentSettings,
  DismissedJob,
  GeneratedApplication,
  JobAnalysisSnapshot,
  JobsPayload,
  LocalAgentMemory,
  PersonalizedJobMatch,
  Priority,
  SavedJob,
} from "./types";
import { AppSidebar, type AppPage } from "./components/AppSidebar";
import { BrowserJobAgentPanel } from "./components/BrowserJobAgentPanel";
import { CompactJobMatches } from "./components/CompactJobMatches";
import { ExternalSearchLinks } from "./components/ExternalSearchLinks";
import { Filters } from "./components/Filters";
import { Header } from "./components/Header";
import { LocalAIPanel } from "./components/LocalAIPanel";
import { LocalHistoryPanel } from "./components/LocalHistoryPanel";
import { MemorySettings } from "./components/MemorySettings";
import { ProfileSummary } from "./components/ProfileSummary";
import { ResumeUploader } from "./components/ResumeUploader";
import { trackAnalytics } from "./lib/analytics/analytics";
import { enrichCandidateProfileWithLocalLLM } from "./lib/profileLlm";
import { buildEmptyCandidateProfile, scoreJobsForProfile } from "./lib/profileScoring";
import { defaultConsentSettings, loadConsentSettings, resetConsentSettings, saveConsentSettings } from "./lib/storage/consent";
import { clearLocalHistory, deleteSavedProfileData, exportLocalData, importLocalData } from "./lib/storage/exportImport";
import {
  dismissJob,
  listDismissedJobs,
  listJobAnalysisHistory,
  listSavedJobs,
  saveJob,
  saveJobAnalysis,
} from "./lib/storage/jobHistory";
import { listGeneratedApplications } from "./lib/storage/aiGenerationCache";
import { listCandidateProfiles, saveCandidateProfile } from "./lib/storage/profileMemory";
import { mergePreferences } from "./lib/storage/preferences";
import { isLocalModelReady } from "./lib/webllm";

interface HistoryState {
  profiles: CandidateProfileSnapshot[];
  savedJobs: SavedJob[];
  dismissedJobs: DismissedJob[];
  analyses: JobAnalysisSnapshot[];
  generations: GeneratedApplication[];
}

const emptyHistory: HistoryState = {
  profiles: [],
  savedJobs: [],
  dismissedJobs: [],
  analyses: [],
  generations: [],
};

const pages: AppPage[] = ["dashboard", "matches", "profile", "settings", "about"];

function getInitialPage(): AppPage {
  const hash = window.location.hash.replace("#", "");
  return pages.includes(hash as AppPage) ? (hash as AppPage) : "dashboard";
}

export default function App() {
  const [payload, setPayload] = useState<JobsPayload | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [profileSnapshotId, setProfileSnapshotId] = useState<string | undefined>();
  const [consent, setConsent] = useState<ConsentSettings>(() => loadConsentSettings());
  const [history, setHistory] = useState<HistoryState>(emptyHistory);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [source, setSource] = useState("all");
  const [missingSkill, setMissingSkill] = useState("all");
  const [sort, setSort] = useState<"score" | "date">("score");
  const [localAIReady, setLocalAIReady] = useState(false);
  const [modelId, setModelId] = useState<string | null>(null);
  const [browserAgentRun, setBrowserAgentRun] = useState<BrowserAgentRun | null>(null);
  const [activePage, setActivePage] = useState<AppPage>(getInitialPage);
  const [profilePipelineStatus, setProfilePipelineStatus] = useState("Upload a CV to start the matching pipeline.");
  const [profileEnriching, setProfileEnriching] = useState(false);
  const autoEnrichmentKey = useRef<string | null>(null);

  useEffect(() => {
    function syncPageFromHash() {
      setActivePage(getInitialPage());
    }
    window.addEventListener("hashchange", syncPageFromHash);
    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/jobs.json`)
      .then((response) => response.json())
      .then((data: JobsPayload) => {
        setPayload(data);
        setCandidateProfile((current) => current ?? buildEmptyCandidateProfile());
      })
      .catch(() => setPayload(null));
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!consent.localHistory) {
      setHistory((current) => ({ ...emptyHistory, dismissedJobs: current.dismissedJobs }));
      return;
    }
    const [profiles, savedJobs, dismissedJobs, analyses, generations] = await Promise.all([
      listCandidateProfiles(),
      listSavedJobs(),
      listDismissedJobs(),
      listJobAnalysisHistory(),
      listGeneratedApplications(),
    ]);
    setHistory({ profiles, savedJobs, dismissedJobs, analyses, generations });
  }, [consent.localHistory]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    saveConsentSettings(consent);
  }, [consent]);

  useEffect(() => {
    if (!candidateProfile || candidateProfile.source !== "uploaded_resume") return;
    if (!consent.localHistory || !consent.saveParsedProfile || profileSnapshotId) return;
    void saveCandidateProfile(candidateProfile, consent).then((snapshot) => {
      if (snapshot) {
        setProfileSnapshotId(snapshot.id);
        void refreshHistory();
      }
    });
  }, [candidateProfile, consent, profileSnapshotId, refreshHistory]);

  const staticMatches = useMemo(() => {
    if (!payload || !candidateProfile) return [];
    if (candidateProfile.source !== "uploaded_resume") return [];
    return scoreJobsForProfile(payload.jobs, candidateProfile);
  }, [candidateProfile, payload]);

  const matches = browserAgentRun?.matches ?? staticMatches;

  const sources = useMemo(() => {
    return Array.from(new Set(matches.map((match) => match.job.source))).sort();
  }, [matches]);

  const missingSkills = useMemo(() => {
    return Array.from(new Set(matches.flatMap((match) => match.missingSkills))).sort();
  }, [matches]);

  const dismissedIds = useMemo(() => new Set(history.dismissedJobs.map((job) => job.jobId)), [history.dismissedJobs]);

  const filteredMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return matches
      .filter((match) => priority === "all" || match.priority === priority)
      .filter((match) => source === "all" || match.job.source === source)
      .filter((match) => missingSkill === "all" || match.missingSkills.includes(missingSkill))
      .filter((match) => {
        if (!normalized) return true;
        const haystack = [
          match.job.title,
          match.job.company,
          match.job.location,
          match.job.source,
          ...match.job.required_skills,
          ...match.matchedSkills,
          ...match.missingSkills,
          ...match.matchedDomains,
        ].join(" ").toLowerCase();
        return haystack.includes(normalized);
      })
      .sort((a, b) => sort === "score" ? b.score - a.score : b.job.published_at.localeCompare(a.job.published_at));
  }, [matches, missingSkill, priority, query, sort, source]);

  const dashboardMatches = useMemo(() => {
    return filteredMatches.filter((match) => !dismissedIds.has(match.job.id));
  }, [dismissedIds, filteredMatches]);

  const averageScore = useMemo(() => {
    return Math.round(matches.reduce((sum, match) => sum + match.score, 0) / Math.max(1, matches.length));
  }, [matches]);

  const highPriority = useMemo(() => matches.filter((match) => match.priority === "high").length, [matches]);
  const demoMode = candidateProfile?.source !== "uploaded_resume";

  useEffect(() => {
    if (!matches.length) return;
    void trackAnalytics(
      {
        name: "job_matches_generated",
        jobsCount: matches.length,
        highPriorityCount: highPriority,
      },
      consent
    );
  }, [consent, highPriority, matches.length]);

  useEffect(() => {
    if (!localAIReady || !candidateProfile || candidateProfile.source !== "uploaded_resume") return;
    if (candidateProfile.extractionMethod === "webllm" || profileEnriching) return;
    const key = `${candidateProfile.fileName ?? "cv"}:${candidateProfile.rawText?.length ?? 0}:${candidateProfile.updatedAt ?? ""}`;
    if (autoEnrichmentKey.current === key) return;
    autoEnrichmentKey.current = key;
    let cancelled = false;
    setProfilePipelineStatus("Local model is ready. WebLLM is now reading the uploaded CV...");
    void enrichProfileIfPossible(candidateProfile).then(async (result) => {
      if (cancelled) return;
      setCandidateProfile(result.profile);
      setBrowserAgentRun(null);
      setProfilePipelineStatus(result.status);
      const snapshot = await saveCandidateProfile(result.profile, consent);
      if (!cancelled && snapshot) {
        setProfileSnapshotId(snapshot.id);
        await refreshHistory();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [candidateProfile, consent, localAIReady, profileEnriching, refreshHistory]);

  async function persistTopAnalyses(nextMatches: PersonalizedJobMatch[], snapshotId?: string) {
    if (!consent.localHistory || !consent.saveJobHistory) return;
    await Promise.all(nextMatches.slice(0, 12).map((match) => saveJobAnalysis(match, snapshotId)));
    await refreshHistory();
  }

  async function enrichProfileIfPossible(profile: CandidateProfile): Promise<{ profile: CandidateProfile; status: string }> {
    if (!isLocalModelReady()) {
      return {
        profile: { ...profile, extractionMethod: profile.extractionMethod ?? "deterministic" },
        status: "CV parsed with keyword fallback. Load the local model to let WebLLM extract roles, skills and target companies.",
      };
    }
    setProfileEnriching(true);
    try {
      const enriched = await enrichCandidateProfileWithLocalLLM(profile);
      return {
        profile: enriched,
        status: "WebLLM read the CV and extracted roles, skills, domains and company-search signals.",
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (/disposed|reload the local model/i.test(reason)) {
        setLocalAIReady(false);
        setModelId(null);
      }
      return {
        profile: { ...profile, extractionMethod: profile.extractionMethod ?? "deterministic" },
        status: `WebLLM profile extraction failed, using keyword fallback: ${reason}`,
      };
    } finally {
      setProfileEnriching(false);
    }
  }

  async function handleParsedResume(result: { profile: CandidateProfile; format: "pdf" | "txt" | "docx"; textLength?: number }): Promise<string> {
    setBrowserAgentRun(null);
    setProfilePipelineStatus("CV text parsed. Preparing profile extraction...");
    const enriched = await enrichProfileIfPossible(result.profile);
    const nextProfile = enriched.profile;
    setProfilePipelineStatus(enriched.status);
    setCandidateProfile(nextProfile);
    setProfileSnapshotId(undefined);
    await trackAnalytics({ name: "resume_uploaded", format: result.format }, consent);
    await trackAnalytics(
      {
        name: "resume_parsed",
        skillsCount: nextProfile.skills.length,
        targetRolesCount: nextProfile.targetRoles.length,
      },
      consent
    );

    let snapshotId: string | undefined;
    const snapshot = await saveCandidateProfile(nextProfile, consent);
    if (snapshot) {
      snapshotId = snapshot.id;
      setProfileSnapshotId(snapshot.id);
    }
    if (payload) {
      await persistTopAnalyses(scoreJobsForProfile(payload.jobs, nextProfile), snapshotId);
    }
    await refreshHistory();
    return `${enriched.status} ${result.textLength?.toLocaleString() ?? "CV"} characters read.`;
  }

  async function refreshActiveProfileWithLLM() {
    if (!candidateProfile || candidateProfile.source !== "uploaded_resume") return;
    setBrowserAgentRun(null);
    setProfilePipelineStatus("Manual WebLLM CV reading started...");
    const result = await enrichProfileIfPossible(candidateProfile);
    setCandidateProfile(result.profile);
    setProfilePipelineStatus(result.status);
    const snapshot = await saveCandidateProfile(result.profile, consent);
    if (snapshot) {
      setProfileSnapshotId(snapshot.id);
      await refreshHistory();
    }
  }

  function clearUploadedCv() {
    setCandidateProfile(buildEmptyCandidateProfile());
    setProfileSnapshotId(undefined);
    setBrowserAgentRun(null);
    setQuery("");
    setPriority("all");
    setSource("all");
    setMissingSkill("all");
    setSort("score");
    setProfilePipelineStatus("Upload a CV to start the matching pipeline.");
  }

  function handleConsentChange(next: ConsentSettings) {
    const normalized = next.localHistory ? next : { ...next, saveParsedProfile: false, saveFullResumeText: false, saveJobHistory: false, saveAiGenerations: false };
    setConsent(normalized);
    saveConsentSettings(normalized);
    if (!consent.localHistory && normalized.localHistory) {
      void trackAnalytics({ name: "local_history_enabled" }, normalized);
    }
  }

  async function handleSave(match: PersonalizedJobMatch) {
    if (consent.localHistory && consent.saveJobHistory) {
      await saveJob(match.job.id, match.score);
      await saveJobAnalysis(match, profileSnapshotId);
      await refreshHistory();
    }
    await trackAnalytics({ name: "job_saved", score: match.score, source: match.job.source }, consent);
  }

  async function handleDismiss(match: PersonalizedJobMatch) {
    if (consent.localHistory && consent.saveJobHistory) {
      await dismissJob(match.job.id);
      await refreshHistory();
      return;
    }
    setHistory((current) => ({
      ...current,
      dismissedJobs: [
        { id: match.job.id, jobId: match.job.id, dismissedAt: new Date().toISOString() },
        ...current.dismissedJobs,
      ],
    }));
  }

  function handleOpen(match: PersonalizedJobMatch) {
    void trackAnalytics({ name: "job_opened", source: match.job.source, score: match.score }, consent);
  }

  async function handleClearHistory() {
    await clearLocalHistory();
    setHistory(emptyHistory);
    clearUploadedCv();
    await trackAnalytics({ name: "local_history_cleared" }, consent);
  }

  async function handleDeleteProfile() {
    await deleteSavedProfileData();
    clearUploadedCv();
    setProfileSnapshotId(undefined);
    await refreshHistory();
  }

  async function handleImport(memory: LocalAgentMemory) {
    await importLocalData(memory);
    setConsent(loadConsentSettings());
    await refreshHistory();
  }

  function handleResetSettings() {
    setConsent(resetConsentSettings());
  }

  function navigate(page: AppPage) {
    setActivePage(page);
    window.location.hash = page;
  }

  if (!payload || !candidateProfile) {
    return <main className="dashboard-loading"><p>Loading AI Job Matcher...</p></main>;
  }

  const loadedPayload = payload;
  const activeProfile = candidateProfile;

  const filters = (
    <Filters
      query={query}
      priority={priority}
      source={source}
      missingSkill={missingSkill}
      sort={sort}
      sources={sources}
      missingSkills={missingSkills}
      onQueryChange={setQuery}
      onPriorityChange={setPriority}
      onSourceChange={setSource}
      onMissingSkillChange={setMissingSkill}
      onSortChange={setSort}
    />
  );

  const agentPanel = (
    <BrowserJobAgentPanel
      profile={activeProfile}
      staticJobs={loadedPayload.jobs}
      localAIReady={localAIReady}
      cvReady={activeProfile.source === "uploaded_resume"}
      profileStatus={profilePipelineStatus}
      profileEnriching={profileEnriching}
      onRefreshProfileWithLLM={() => void refreshActiveProfileWithLLM()}
      onRunComplete={setBrowserAgentRun}
      onResetToStatic={() => setBrowserAgentRun(null)}
    />
  );

  const localModelPanel = (
    <LocalAIPanel
      ready={localAIReady}
      modelId={modelId}
      onReady={(loadedModelId) => {
        setLocalAIReady(true);
        setModelId(loadedModelId);
        setProfilePipelineStatus((current) => activeProfile.source === "uploaded_resume" ? "Local model loaded. WebLLM will enrich the uploaded CV now." : current);
        mergePreferences({ selectedModel: loadedModelId });
        void trackAnalytics({ name: "webllm_enabled", model: loadedModelId }, consent);
      }}
    />
  );

  const matchesPanel = (
    <CompactJobMatches
      matches={activePage === "matches" ? filteredMatches : dashboardMatches}
      totalJobs={loadedPayload.jobs.length}
      agentMode={Boolean(browserAgentRun)}
      onSave={handleSave}
      onDismiss={handleDismiss}
      onOpen={handleOpen}
      maxVisible={activePage === "matches" ? filteredMatches.length : 5}
      title={activePage === "matches" ? "All jobs found" : "4. Jobs found"}
      subtitle={activePage === "matches" ? "Browse every ranked result returned by the agent or static dataset" : undefined}
      onViewAll={activePage === "matches" ? undefined : () => navigate("matches")}
      controls={activePage === "matches" ? undefined : filters}
      dismissedIds={dismissedIds}
    />
  );

  const settingsContent = (
    <section className="settings-section" aria-label="Local settings and history">
      <MemorySettings
        consent={consent}
        onConsentChange={handleConsentChange}
        onClearHistory={handleClearHistory}
        onDeleteProfile={handleDeleteProfile}
        onExport={exportLocalData}
        onImport={handleImport}
        onResetSettings={handleResetSettings}
      />

      <details className="secondary-history" open>
        <summary>Local history and saved items</summary>
        <LocalHistoryPanel
          profiles={history.profiles}
          savedJobs={history.savedJobs}
          dismissedJobs={history.dismissedJobs}
          analyses={history.analyses}
          generations={history.generations}
          jobs={loadedPayload.jobs}
          onRestoreProfile={(profile) => {
            setCandidateProfile(profile);
            setProfileSnapshotId(profile.id);
            navigate("profile");
          }}
          onClearHistory={handleClearHistory}
        />
      </details>
    </section>
  );

  function renderPage() {
    if (activePage === "matches") {
      return (
        <section className="page-view" aria-label="Matches page">
          <div className="page-heading">
            <div>
              <h1>Matches</h1>
              <p>Menu complet pour filtrer, sauvegarder, masquer et ouvrir tous les jobs trouves.</p>
            </div>
            <button className="ghost-button" type="button" onClick={() => navigate("dashboard")}>Back to agent</button>
          </div>
          <section className="dashboard-card matches-menu" aria-label="Matches filters">
            <div className="card-title-row">
              <div>
                <h2>Search menu</h2>
                <p>{filteredMatches.length} visible results from {matches.length} ranked jobs</p>
              </div>
            </div>
            {filters}
          </section>
          {matchesPanel}
          <ExternalSearchLinks links={browserAgentRun?.externalSearchLinks ?? []} />
        </section>
      );
    }

    if (activePage === "profile") {
      return (
        <section className="page-view" aria-label="Profile page">
          <div className="page-heading">
            <div>
              <h1>Profile</h1>
              <p>Roles, skills, languages, experience and signals extracted from the CV.</p>
            </div>
          </div>
          <ProfileSummary profile={activeProfile} demoMode={demoMode} onChange={setCandidateProfile} />
        </section>
      );
    }

    if (activePage === "settings") {
      return (
        <section className="page-view" aria-label="Settings page">
          <div className="page-heading">
            <div>
              <h1>Settings</h1>
              <p>Local settings, browser memory, history and export/import.</p>
            </div>
          </div>
          {settingsContent}
        </section>
      );
    }

    if (activePage === "about") {
      return (
        <section className="page-view" aria-label="About page">
          <div className="page-heading">
            <div>
              <h1>About</h1>
              <p>Project architecture and GitHub Pages mode limits.</p>
            </div>
          </div>
          <section className="portfolio-section">
            <h2>Portfolio architecture</h2>
            <p>
              The Python agent refreshes public job offers and writes static JSON. The browser can also run a
              GitHub Pages-compatible job-search agent with public API tools, local CV parsing, explainable ranking,
              optional IndexedDB memory and optional WebLLM planning.
            </p>
            <div className="portfolio-grid">
              <span>Local CV parsing</span>
              <span>Browser tool-calling agent</span>
              <span>Explainable matching</span>
              <span>IndexedDB memory</span>
              <span>GitHub Actions collection</span>
              <span>Static GitHub Pages</span>
              <span>Optional WebLLM</span>
              <span>No backend</span>
            </div>
          </section>
        </section>
      );
    }

    return (
      <>
        <section className="hero-layout hero-layout-simple">
          <Header
            payload={loadedPayload}
            averageScore={averageScore}
            highPriority={highPriority}
            demoMode={demoMode}
            displayJobCount={browserAgentRun ? matches.length : loadedPayload.jobs.length}
            agentMode={Boolean(browserAgentRun)}
          />
        </section>

        <section className="dashboard-workspace action-workspace" aria-label="Core job agent actions">
          <div className="left-column">
            <ResumeUploader onParsed={handleParsedResume} onClear={clearUploadedCv} />
            {localModelPanel}
          </div>
          <div className="right-column">
            {agentPanel}
            {matchesPanel}
          </div>
        </section>
      </>
    );
  }

  return (
    <main className="app-shell">
      <AppSidebar localAIReady={localAIReady} activePage={activePage} onNavigate={navigate} />
      <section className="dashboard-main">
        <header className="topbar">
          <div className="mobile-brand">AI Job Matcher</div>
          <div className="topbar-actions">
            <span className={localAIReady ? "local-ai-chip ready" : "local-ai-chip"}>
              <span className={localAIReady ? "status-dot ready" : "status-dot"} />
              Local AI: {localAIReady ? "Ready" : "Optional"}
            </span>
          </div>
        </header>
        {renderPage()}
      </section>
    </main>
  );
}
