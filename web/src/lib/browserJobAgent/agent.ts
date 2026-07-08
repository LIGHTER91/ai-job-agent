import type {
  BrowserAgentEvent,
  BrowserAgentRun,
  BrowserAgentToolCall,
  BrowserAgentToolName,
  CandidateProfile,
  ExternalSearchLink,
  JobAnalysis,
  PersonalizedJobMatch,
} from "../../types";
import { scoreJobsForProfile } from "../profileScoring";
import { isLocalModelReady, runLocalChat } from "../webllm";
import { executeAgentTool } from "./tools";

interface BrowserJobAgentInput {
  profile: CandidateProfile;
  staticJobs: JobAnalysis[];
  useLocalLLM: boolean;
  onEvent: (event: BrowserAgentEvent) => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function event(level: BrowserAgentEvent["level"], label: string, detail: string): BrowserAgentEvent {
  return { id: id("agent_event"), at: nowIso(), level, label, detail };
}

function dedupeJobs(jobs: JobAnalysis[]): JobAnalysis[] {
  const seen = new Set<string>();
  const unique: JobAnalysis[] = [];
  for (const job of jobs) {
    const key = `${job.url || job.id}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(job);
    }
  }
  return unique;
}

function profileText(profile: CandidateProfile): string {
  return [
    ...profile.targetRoles,
    ...profile.skills,
    ...profile.tools,
    ...profile.frameworks,
    ...profile.domains,
    ...profile.keywords,
  ].join(" ").toLowerCase();
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizedSignal(value: string): string {
  return stripDiacritics(value).toLowerCase().trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(text: string, term: string): boolean {
  const boundary = /[a-z0-9+#.]/i.test(term[0]) && /[a-z0-9+#.]/i.test(term.at(-1) ?? "");
  const pattern = boundary ? `(^|[^a-z0-9+#.])${escapeRegExp(term)}([^a-z0-9+#.]|$)` : escapeRegExp(term);
  return new RegExp(pattern, "i").test(text);
}

const FINANCE_QUERY_TERMS = [
  "trader",
  "trading",
  "finance de marche",
  "marches financiers",
  "marches actions",
  "capital markets",
  "derivatives",
  "derives",
  "options pricing",
  "futures",
  "market making",
  "pnl",
  "greeks",
  "bloomberg",
  "reuters",
  "quantitative finance",
  "portfolio management",
  "asset management",
];

const PASTRY_QUERY_TERMS = [
  "patissier",
  "patissiere",
  "patisserie",
  "pastry",
  "bakery",
  "viennoiserie",
  "entremets",
  "haccp",
  "boulangerie",
  "desserts",
  "mignardises",
];

const ENERGY_QUERY_TERMS = [
  "energy",
  "energie",
  "efficacite",
  "solaire",
  "photovolta",
  "batiment",
  "cvc",
  "hvac",
  "iso 50001",
  "bilan carbone",
  "thermique",
];

function hasSignal(text: string, terms: string[]): boolean {
  const normalized = normalizedSignal(text);
  return terms.some((term) => containsTerm(normalized, normalizedSignal(term)));
}

function countSignals(text: string, terms: string[]): number {
  const normalized = normalizedSignal(text);
  return terms.filter((term) => containsTerm(normalized, normalizedSignal(term))).length;
}

function isFinanceProfile(profile: CandidateProfile): boolean {
  const text = profileText(profile);
  const roleText = [...profile.targetRoles, ...profile.domains].join(" ");
  return hasSignal(roleText, ["trader", "trading analyst", "junior trader", "assistant trader", "quantitative analyst", "finance de marche", "capital markets"]) ||
    countSignals(text, FINANCE_QUERY_TERMS) >= 2;
}

function isPastryProfile(profile: CandidateProfile): boolean {
  return hasSignal(profileText(profile), PASTRY_QUERY_TERMS);
}

function isEnergyProfile(profile: CandidateProfile): boolean {
  return hasSignal(profileText(profile), ENERGY_QUERY_TERMS);
}

function domainOverrideQueries(profile: CandidateProfile): string[] {
  const text = profileText(profile);
  if (/trader|trading|finance de march|march[ée]s financiers|march[ée]s actions|capital markets|d[ée]riv|options|futures|market making|pnl|greeks|bloomberg|reuters|quant|portfolio|asset management/.test(text)) {
    return ["Trading Analyst", "Junior Trader", "Assistant Trader", "Quantitative Analyst"];
  }
  if (/patissier|pâtissier|patissiere|pâtissière|patisserie|pâtisserie|viennoiserie|entremets|haccp|boulangerie|desserts|mignardises/.test(text)) {
    return ["Junior Pastry Chef", "Chef Patissier", "Pastry Commis"];
  }
  if (/energy|energie|efficacit|solaire|photovolta|batiment|bâtiment|cvc|hvac|iso 50001|bilan carbone|thermique/.test(text)) {
    return ["Energy Efficiency Engineer", "Renewable Energy Engineer", "Energy Data Analyst"];
  }
  return [];
}

function safeDomainOverrideQueries(profile: CandidateProfile): string[] {
  if (isFinanceProfile(profile)) {
    return ["Trading Analyst", "Junior Trader", "Assistant Trader", "Quantitative Analyst"];
  }
  if (isPastryProfile(profile)) {
    return ["Junior Pastry Chef", "Chef Patissier", "Pastry Commis"];
  }
  if (isEnergyProfile(profile)) {
    return ["Energy Efficiency Engineer", "Renewable Energy Engineer", "Energy Data Analyst"];
  }
  return [];
}

function normalizeRoleQuery(role: string): string {
  const normalized = normalizedSignal(role);
  if (/ingenieur (ia|ai)$|ingenieur intelligence artificielle|artificial intelligence engineer/.test(normalized)) {
    return "AI Engineer";
  }
  if (/ingenieur (ml|machine learning)|machine learning engineer/.test(normalized)) {
    return "Machine Learning Engineer";
  }
  if (/llm/.test(normalized)) return "LLM Engineer";
  if (/rag/.test(normalized)) return "RAG Engineer";
  return role;
}

function isUsefulRoleQuery(role: string): boolean {
  const normalized = normalizedSignal(role);
  return Boolean(normalized) && !/^(junior|senior|graduate|intern|internship|alternance|entry-level|mid-level|lead|principal)$/.test(normalized);
}

function sanitizePlannerQuery(query: string | undefined, profile: CandidateProfile, fallback: string): string {
  const candidate = query?.trim() || fallback;
  if (!isUsefulRoleQuery(candidate)) return fallback;
  if (hasSignal(candidate, FINANCE_QUERY_TERMS) && !isFinanceProfile(profile)) return fallback;
  if (hasSignal(candidate, PASTRY_QUERY_TERMS) && !isPastryProfile(profile)) return fallback;
  if (hasSignal(candidate, ENERGY_QUERY_TERMS) && !isEnergyProfile(profile)) return fallback;
  return normalizeRoleQuery(candidate);
}

function defaultQueries(profile: CandidateProfile): string[] {
  const overrides = safeDomainOverrideQueries(profile);
  if (overrides.length) return overrides;
  const roleQueries = profile.targetRoles
    .map(normalizeRoleQuery)
    .filter(isUsefulRoleQuery);
  const candidates = [...roleQueries, ...profile.domains.map((domain) => `${domain} Engineer`)]
    .filter(Boolean)
    .slice(0, 4);
  return [...new Set(candidates.length ? candidates : ["AI Engineer", "LLM Engineer", "Data Scientist"])].slice(0, 4);
}

function deterministicPlan(profile: CandidateProfile): BrowserAgentToolCall[] {
  const queries = defaultQueries(profile).slice(0, 4);
  const calls: BrowserAgentToolCall[] = [];
  for (const query of queries) {
    calls.push({ id: id("tool"), tool: "search_remotive", args: { query, limit: 8 } });
    calls.push({ id: id("tool"), tool: "search_jobicy", args: { query, limit: 8 } });
    calls.push({ id: id("tool"), tool: "search_remoteok", args: { query, limit: 8 } });
    calls.push({ id: id("tool"), tool: "search_arbeitnow", args: { query, limit: 8 } });
  }
  calls.push({ id: id("tool"), tool: "search_company_boards", args: { query: queries[0], limit: 18 } });
  calls.push({ id: id("tool"), tool: "build_web_search_links", args: { query: queries[0], limit: 6 } });
  calls.push({ id: id("tool"), tool: "search_static_jobs", args: { query: queries[0], limit: 12 } });
  return calls;
}

function normalizeToolCall(call: Partial<BrowserAgentToolCall>): BrowserAgentToolCall | null {
  const tool = call.tool;
  if (
    tool !== "search_remotive" &&
    tool !== "search_jobicy" &&
    tool !== "search_remoteok" &&
    tool !== "search_arbeitnow" &&
    tool !== "search_company_boards" &&
    tool !== "build_web_search_links" &&
    tool !== "search_static_jobs"
  ) {
    return null;
  }
  return {
    id: call.id ?? id("tool"),
    tool,
    args: {
      query: call.args?.query || "AI Engineer",
      limit: Math.min(30, Math.max(3, Number(call.args?.limit ?? 8))),
    },
  };
}

function parsePlannerJson(content: string): { tool_calls?: Partial<BrowserAgentToolCall>[] } | null {
  const candidates = [
    content,
    content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1],
    content.match(/\{[\s\S]*\}/)?.[0],
  ].filter((item): item is string => Boolean(item));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as { tool_calls?: Partial<BrowserAgentToolCall>[] };
    } catch {
      // Try the next extraction strategy.
    }
  }
  return null;
}

function callsFromPlannerText(content: string, profile: CandidateProfile): BrowserAgentToolCall[] {
  const lower = content.toLowerCase();
  const queries = defaultQueries(profile);
  const availableTools: BrowserAgentToolName[] = [
    "search_remotive",
    "search_jobicy",
    "search_remoteok",
    "search_arbeitnow",
    "search_company_boards",
    "build_web_search_links",
    "search_static_jobs",
  ];
  const toolHints = availableTools.filter((tool) => lower.includes(tool));

  const tools: BrowserAgentToolName[] = toolHints.length ? [...new Set(toolHints)] : [
    "search_remotive",
    "search_jobicy",
    "search_remoteok",
    "search_arbeitnow",
    "search_company_boards",
    "build_web_search_links",
    "search_static_jobs",
  ];

  const calls: BrowserAgentToolCall[] = [];
  for (const query of queries) {
    for (const tool of tools) {
      if (tool === "build_web_search_links" || tool === "search_static_jobs" || tool === "search_company_boards") continue;
      calls.push({ id: id("tool"), tool, args: { query, limit: 8 } });
    }
  }
  calls.push({ id: id("tool"), tool: "search_company_boards", args: { query: queries[0], limit: 18 } });
  calls.push({ id: id("tool"), tool: "build_web_search_links", args: { query: queries[0], limit: 6 } });
  calls.push({ id: id("tool"), tool: "search_static_jobs", args: { query: queries[0], limit: 12 } });
  return calls.slice(0, 18);
}

async function planWithLocalLLM(profile: CandidateProfile): Promise<{ calls: BrowserAgentToolCall[]; note: string }> {
  const firstQuery = defaultQueries(profile)[0] ?? "Job";
  const content = await runLocalChat(
    [
      {
        role: "system",
        content:
          "Return JSON only. You choose browser job-search tool calls. No markdown. No prose.",
      },
      {
        role: "user",
        content: `Tools: search_remotive, search_jobicy, search_remoteok, search_arbeitnow, search_company_boards, build_web_search_links, search_static_jobs.
Profile roles: ${profile.targetRoles.slice(0, 4).join(", ") || "AI Engineer, LLM Engineer"}.
Skills: ${profile.skills.slice(0, 10).join(", ")}.
Domains: ${profile.domains.slice(0, 10).join(", ")}.
Location: ${profile.locationSignals.slice(0, 4).join(", ") || "remote Europe"}.
Return exactly:
{"tool_calls":[{"tool":"search_remotive","args":{"query":"${firstQuery}","limit":8}},{"tool":"search_jobicy","args":{"query":"${firstQuery}","limit":8}},{"tool":"search_remoteok","args":{"query":"${firstQuery}","limit":8}},{"tool":"search_arbeitnow","args":{"query":"${firstQuery}","limit":8}},{"tool":"search_company_boards","args":{"query":"${firstQuery}","limit":18}},{"tool":"build_web_search_links","args":{"query":"${firstQuery}","limit":6}},{"tool":"search_static_jobs","args":{"query":"${firstQuery}","limit":12}}]}`,
      },
    ],
    180,
    90000
  );
  const parsed = parsePlannerJson(content);
  const safeQueries = defaultQueries(profile);
  const calls = (parsed?.tool_calls ?? [])
    .map(normalizeToolCall)
    .filter((call): call is BrowserAgentToolCall => Boolean(call))
    .map((call, index) => ({
      ...call,
      args: {
        ...call.args,
        query: sanitizePlannerQuery(call.args.query, profile, safeQueries[index % safeQueries.length] ?? "AI Engineer"),
      },
    }));
  if (calls.length) {
    return { calls: calls.slice(0, 18), note: `Planned ${calls.length} valid tool calls from WebLLM JSON.` };
  }
  return {
    calls: callsFromPlannerText(content, profile),
    note: "WebLLM answered without valid tool-call JSON, so the app extracted a usable plan from its text.",
  };
}

function finalizeMatches(jobs: JobAnalysis[], profile: CandidateProfile): PersonalizedJobMatch[] {
  return scoreJobsForProfile(dedupeJobs(jobs), profile)
    .sort((a, b) => b.score - a.score || b.job.published_at.localeCompare(a.job.published_at))
    .slice(0, 30);
}

export async function runBrowserJobAgent(input: BrowserJobAgentInput): Promise<BrowserAgentRun> {
  const runId = id("agent_run");
  const startedAt = nowIso();
  const errors: string[] = [];
  const collectedJobs: JobAnalysis[] = [];
  const externalSearchLinks: ExternalSearchLink[] = [];
  const sourceCounts: Record<string, number> = {};
  let planner: BrowserAgentRun["planner"] = "deterministic";

  input.onEvent(event("info", "Agent started", "Preparing browser-side tools. No backend or Python process is used."));
  input.onEvent(event(
    "info",
    "Active CV profile",
    `method=${input.profile.extractionMethod ?? "unknown"} roles=${input.profile.targetRoles.slice(0, 4).join(", ") || "none"} domains=${input.profile.domains.slice(0, 5).join(", ") || "none"}`
  ));

  let toolCalls = deterministicPlan(input.profile);
  if (input.useLocalLLM && isLocalModelReady()) {
    try {
      input.onEvent(event("info", "LLM planner", "Asking WebLLM to choose job-search tool calls."));
      const planned = await planWithLocalLLM(input.profile);
      toolCalls = planned.calls;
      planner = "webllm";
      input.onEvent(event("success", "LLM planner", planned.note));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push(`LLM planner failed: ${reason}`);
      input.onEvent(event("warning", "LLM planner fallback", `Using deterministic tool plan because local planning failed: ${reason}`));
    }
  } else {
    input.onEvent(event("info", "Deterministic planner", "Using profile roles to query public APIs, company ATS boards and search links."));
  }

  for (const call of toolCalls) {
    input.onEvent(event("info", `Tool call: ${call.tool}`, `query="${call.args.query}" limit=${call.args.limit}`));
    const result = await executeAgentTool(call, input.profile, input.staticJobs);
    if (result.error) {
      errors.push(result.error);
      input.onEvent(event("error", `Tool failed: ${call.tool}`, result.error));
      continue;
    }
    collectedJobs.push(...result.jobs);
    if (result.externalSearchLinks?.length) {
      externalSearchLinks.push(...result.externalSearchLinks);
    }
    for (const job of result.jobs) {
      sourceCounts[job.source] = (sourceCounts[job.source] ?? 0) + 1;
    }
    const linkCount = result.externalSearchLinks?.length ?? 0;
    const detail = linkCount
      ? `${result.jobs.length} jobs returned, ${linkCount} external search links prepared.`
      : `${result.count} jobs returned.`;
    input.onEvent(event("success", `Tool result: ${call.tool}`, detail));
  }

  input.onEvent(event("info", "Tool call: rank_matches", `Ranking ${dedupeJobs(collectedJobs).length} unique jobs against the active profile.`));
  const matches = finalizeMatches(collectedJobs, input.profile);
  input.onEvent(event("success", "Agent finished", `${matches.length} ranked matches ready in the frontend.`));

  return {
    id: runId,
    startedAt,
    finishedAt: nowIso(),
    planner,
    toolCalls,
    sourceCounts,
    errors,
    matches,
    externalSearchLinks,
  };
}
