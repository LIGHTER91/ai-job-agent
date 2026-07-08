export type AnalyticsEvent =
  | { name: "resume_uploaded"; format: "pdf" | "txt" | "docx" }
  | { name: "resume_parsed"; skillsCount: number; targetRolesCount: number }
  | { name: "job_matches_generated"; jobsCount: number; highPriorityCount: number }
  | { name: "job_saved"; score: number; source: string }
  | { name: "job_opened"; source: string; score: number }
  | { name: "webllm_enabled"; model: string }
  | { name: "webllm_generation_completed" }
  | { name: "local_history_enabled" }
  | { name: "local_history_cleared" };
