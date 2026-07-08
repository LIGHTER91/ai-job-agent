import type { InitProgressReport, MLCEngineInterface } from "@mlc-ai/web-llm";
import type { CandidateProfile, JobAnalysis, LocalAIResult, PersonalizedJobMatch, Profile } from "../types";
import { buildJobPrompt } from "./promptBuilder";
import { buildPersonalizedJobPrompt } from "./profilePromptBuilder";

type ProgressHandler = (report: InitProgressReport) => void;

export type ModelSize = "light" | "balanced" | "experimental";

export interface LocalModelOption {
  size: ModelSize;
  label: string;
  preferredModelIds: string[];
  fallbackPatterns: string[];
}

export const MODEL_OPTIONS: LocalModelOption[] = [
  {
    size: "light",
    label: "Light model",
    preferredModelIds: [
      "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
      "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    ],
    fallbackPatterns: ["0.5B", "1B", "Phi-3-mini"],
  },
  {
    size: "balanced",
    label: "Balanced model",
    preferredModelIds: [
      "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
      "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    ],
    fallbackPatterns: ["1B", "1.5B", "0.5B"],
  },
  {
    size: "experimental",
    label: "Experimental model",
    preferredModelIds: [
      "Llama-3.2-3B-Instruct-q4f16_1-MLC",
      "Phi-3.5-mini-instruct-q4f16_1-MLC-1k",
      "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    ],
    fallbackPatterns: ["3B", "Phi-3.5", "1B"],
  },
];

let engine: MLCEngineInterface | null = null;
let loadedModelId: string | null = null;
let webllmModulePromise: Promise<typeof import("@mlc-ai/web-llm")> | null = null;

function isDisposedEngineError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /disposed|object has already been disposed/i.test(message);
}

export function resetLocalModel(): void {
  engine = null;
  loadedModelId = null;
}

function loadWebLLMModule(): Promise<typeof import("@mlc-ai/web-llm")> {
  webllmModulePromise ??= import("@mlc-ai/web-llm");
  return webllmModulePromise;
}

function getCandidateModels(allModels: string[], size: ModelSize): string[] {
  const option = MODEL_OPTIONS.find((item) => item.size === size) ?? MODEL_OPTIONS[0];
  const candidates: string[] = [];
  for (const preferred of option.preferredModelIds) {
    if (allModels.includes(preferred)) {
      candidates.push(preferred);
    }
  }
  for (const pattern of option.fallbackPatterns) {
    const found = allModels.find((id) => id.includes(pattern) && id.includes("Instruct") && !id.includes("q0f"));
    if (found) {
      candidates.push(found);
    }
  }
  const uniqueCandidates = [...new Set(candidates)];
  if (!uniqueCandidates.length) {
    throw new Error("No WebLLM models are available in the prebuilt configuration.");
  }
  return uniqueCandidates;
}

function explainModelLoadFailure(error: unknown, attemptedModels: string[]): Error {
  const detail = error instanceof Error ? error.message : String(error);
  const tried = attemptedModels.join(", ");
  return new Error(
    `Unable to load a local WebLLM model in this browser. Tried: ${tried}. Last error: ${detail}. The dashboard will keep using the rule-based fallback.`
  );
}

export async function loadLocalModel(size: ModelSize, onProgress: ProgressHandler): Promise<string> {
  if (!("gpu" in navigator)) {
    throw new Error("WebGPU is not available in this browser.");
  }
  const { CreateWebWorkerMLCEngine, prebuiltAppConfig } = await loadWebLLMModule();
  const availableModelIds = prebuiltAppConfig.model_list.map((record) => record.model_id);
  const candidateModels = getCandidateModels(availableModelIds, size);
  if (engine && loadedModelId && candidateModels.includes(loadedModelId)) {
    return loadedModelId;
  }

  const attemptedModels: string[] = [];
  let lastError: unknown = null;
  for (const candidateModel of candidateModels) {
    attemptedModels.push(candidateModel);
    onProgress({ progress: 0, timeElapsed: 0, text: `Trying local model: ${candidateModel}` });
    const worker = new Worker(new URL("../workers/webllmWorker.ts", import.meta.url), { type: "module" });
    try {
      const nextEngine = await CreateWebWorkerMLCEngine(
        worker,
        candidateModel,
        { initProgressCallback: onProgress },
        { context_window_size: 2048 }
      );
      engine = nextEngine;
      loadedModelId = candidateModel;
      return candidateModel;
    } catch (error) {
      lastError = error;
      worker.terminate();
    }
  }

  throw explainModelLoadFailure(lastError, attemptedModels);
}

export async function generateLocalJobAnalysis(
  job: JobAnalysis,
  profile: Profile | CandidateProfile,
  match?: PersonalizedJobMatch
): Promise<LocalAIResult> {
  if (!engine) {
    throw new Error("Local model is not loaded yet.");
  }
  const messages = match
    ? buildPersonalizedJobPrompt(job, profile as CandidateProfile, match)
    : buildJobPrompt(job, profile as Profile);
  let response;
  try {
    response = await withGenerationTimeout(
      engine.chat.completions.create({
        messages,
        temperature: 0.1,
        max_tokens: 160,
      }),
      45000
    );
  } catch (error) {
    if (isDisposedEngineError(error)) {
      resetLocalModel();
      throw new Error("Local model worker was disposed. Reload the local model and retry.");
    }
    throw error;
  }
  const content = response.choices[0]?.message?.content ?? "";
  return parseLocalAIResult(content, job, match);
}

export function isLocalModelReady(): boolean {
  return engine !== null;
}

export async function runLocalChat(
  messages: { role: "system" | "user"; content: string }[],
  maxTokens = 220,
  timeoutMs = 45000
): Promise<string> {
  if (!engine) {
    throw new Error("Local model is not loaded yet.");
  }
  let response;
  try {
    response = await withGenerationTimeout(
      engine.chat.completions.create({
        messages,
        temperature: 0.1,
        max_tokens: maxTokens,
      }),
      timeoutMs
    );
  } catch (error) {
    if (isDisposedEngineError(error)) {
      resetLocalModel();
      throw new Error("Local model worker was disposed. Reload the local model and retry.");
    }
    throw error;
  }
  return response.choices[0]?.message?.content ?? "";
}

function withGenerationTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      engine?.interruptGenerate();
      reject(new Error("Local AI generation timed out. The rule-based fallback remains available."));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  });
}

function parseLocalAIResult(content: string, job: JobAnalysis, match?: PersonalizedJobMatch): LocalAIResult {
  const fallbackSentence = match?.ruleBasedApplicationSentence ?? job.rule_based_application_sentence;
  const fallbackSummary = match ? match.explanation.join(" ") : job.rule_based_summary;
  try {
    const parsed = JSON.parse(content) as Partial<LocalAIResult>;
    return {
      application_sentence: parsed.application_sentence || fallbackSentence,
      job_fit_analysis: parsed.job_fit_analysis || fallbackSummary,
      preparation_points: Array.isArray(parsed.preparation_points)
        ? parsed.preparation_points.filter((point): point is string => typeof point === "string").slice(0, 3)
        : buildFallbackPreparation(job, match),
    };
  } catch {
    return {
      application_sentence: fallbackSentence,
      job_fit_analysis: content || fallbackSummary,
      preparation_points: buildFallbackPreparation(job, match),
    };
  }
}

export function buildFallbackPreparation(job: JobAnalysis, match?: PersonalizedJobMatch): string[] {
  const matchedSkills = match?.matchedSkills ?? job.matched_skills;
  const missing = (match?.missingSkills ?? job.missing_skills).slice(0, 2);
  return [
    `Prepare a clear explanation of the matched skills: ${matchedSkills.slice(0, 3).join(", ") || "AI engineering"}.`,
    missing.length ? `Review the missing skills before applying: ${missing.join(", ")}.` : "Prepare one concrete project example linked to this role.",
    "Connect the application sentence to a measurable portfolio project or internship experience.",
  ];
}

export function getCachedResult(jobId: string): LocalAIResult | null {
  try {
    const raw = localStorage.getItem(`ai-job-agent:webllm:${jobId}`);
    if (!raw) return null;
    return JSON.parse(raw) as LocalAIResult;
  } catch {
    return null;
  }
}

export function setCachedResult(jobId: string, result: LocalAIResult): void {
  try {
    localStorage.setItem(`ai-job-agent:webllm:${jobId}`, JSON.stringify(result));
  } catch {
    // Cache failures should not block the generated result from rendering.
  }
}
