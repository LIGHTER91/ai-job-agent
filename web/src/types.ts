export type Priority = "high" | "medium" | "low";

export interface Profile {
  name: string;
  target: string;
  target_roles: string[];
  strong_skills: string[];
  weaker_skills_or_to_learn: string[];
}

export interface JobAnalysis {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  url: string;
  published_at: string;
  match_score: number;
  priority: Priority;
  raw_description: string;
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  rule_based_summary: string;
  rule_based_application_sentence: string;
  score_explanation: string[];
}

export interface SearchAgentMeta {
  queries: string[];
  source_counts: Record<string, number>;
  fallback_used: boolean;
  enabled_sources: string[];
}

export interface JobsPayload {
  generated_at: string;
  search_agent?: SearchAgentMeta;
  profile: Profile;
  jobs: JobAnalysis[];
}

export interface LocalAIResult {
  application_sentence: string;
  job_fit_analysis: string;
  preparation_points: string[];
}

export type CandidateProfileSource = "uploaded_resume" | "default_profile";
export type CandidateProfileExtractionMethod = "deterministic" | "webllm";

export interface ConsentSettings {
  localHistory: boolean;
  saveParsedProfile: boolean;
  saveFullResumeText: boolean;
  saveJobHistory: boolean;
  saveAiGenerations: boolean;
  anonymousAnalytics: boolean;
}

export interface CandidateProfile {
  id?: string;
  source: CandidateProfileSource;
  fileName?: string;
  rawText?: string;
  targetRoles: string[];
  skills: string[];
  tools: string[];
  frameworks: string[];
  domains: string[];
  education: string[];
  experiences: string[];
  languages: string[];
  senioritySignals: string[];
  locationSignals: string[];
  keywords: string[];
  extractionMethod?: CandidateProfileExtractionMethod;
  llmEnrichedAt?: string;
  llmProfileSummary?: string;
  companyTargets?: CompanyTarget[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyTarget {
  name: string;
  reason: string;
  searchQuery: string;
}

export interface CandidateProfileSnapshot {
  id: string;
  createdAt: string;
  updatedAt: string;
  fileName?: string;
  targetRoles: string[];
  skills: string[];
  tools: string[];
  frameworks: string[];
  domains: string[];
  education: string[];
  experiences: string[];
  languages: string[];
  senioritySignals: string[];
  locationSignals: string[];
  keywords: string[];
  extractionMethod?: CandidateProfileExtractionMethod;
  llmEnrichedAt?: string;
  llmProfileSummary?: string;
  companyTargets?: CompanyTarget[];
  rawText?: string;
}

export interface JobAnalysisSnapshot {
  id: string;
  jobId: string;
  analyzedAt: string;
  profileSnapshotId?: string;
  score: number;
  priority: Priority;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string[];
  source: "rule_based" | "webllm";
}

export interface GeneratedApplication {
  id: string;
  jobId: string;
  profileSnapshotId?: string;
  createdAt: string;
  model?: string;
  applicationSentence: string;
  jobFitAnalysis: string;
  preparationPoints: string[];
}

export interface SavedJob {
  id: string;
  jobId: string;
  savedAt: string;
  score?: number;
  note?: string;
}

export interface DismissedJob {
  id: string;
  jobId: string;
  dismissedAt: string;
  reason?: string;
}

export interface LocalAgentPreferences {
  selectedModel?: string;
  filters?: unknown;
  sort?: "score" | "date";
  theme?: "light" | "dark";
}

export interface LocalAgentMemory {
  version: number;
  createdAt: string;
  updatedAt: string;
  consent: ConsentSettings;
  candidateProfiles: CandidateProfileSnapshot[];
  jobAnalysisHistory: JobAnalysisSnapshot[];
  savedJobs: SavedJob[];
  dismissedJobs: DismissedJob[];
  generatedApplications: GeneratedApplication[];
  preferences: LocalAgentPreferences;
}

export interface ParsedResumeResult {
  profile: CandidateProfile;
  textLength: number;
  format: "pdf" | "txt" | "docx";
}

export interface PersonalizedJobMatch {
  job: JobAnalysis;
  score: number;
  priority: Priority;
  roleScore: number;
  skillScore: number;
  domainScore: number;
  seniorityScore: number;
  locationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedRoles: string[];
  matchedDomains: string[];
  explanation: string[];
  ruleBasedApplicationSentence: string;
}

export interface ExternalSearchLink {
  id: string;
  source: string;
  title: string;
  url: string;
  query: string;
  location: string;
  description: string;
}

export interface LocalAnalyticsRecord {
  id: string;
  createdAt: string;
  event: Record<string, unknown>;
}

export type BrowserAgentToolName =
  | "search_static_jobs"
  | "search_remotive"
  | "search_jobicy"
  | "search_remoteok"
  | "search_arbeitnow"
  | "search_company_boards"
  | "build_web_search_links"
  | "rank_matches";

export interface BrowserAgentToolCall {
  id: string;
  tool: BrowserAgentToolName;
  args: {
    query?: string;
    limit?: number;
  };
}

export interface BrowserAgentEvent {
  id: string;
  at: string;
  level: "info" | "success" | "warning" | "error";
  label: string;
  detail: string;
}

export interface BrowserAgentRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  planner: "webllm" | "deterministic";
  toolCalls: BrowserAgentToolCall[];
  sourceCounts: Record<string, number>;
  errors: string[];
  matches: PersonalizedJobMatch[];
  externalSearchLinks: ExternalSearchLink[];
}
