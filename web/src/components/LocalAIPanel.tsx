import { useMemo, useState } from "react";
import { Cpu, Loader2, Settings } from "lucide-react";
import type { InitProgressReport } from "@mlc-ai/web-llm";
import { browserSupportMessage, hasWebGPU } from "../lib/browserSupport";
import { loadLocalModel, MODEL_OPTIONS, type ModelSize } from "../lib/webllm";

interface LocalAIPanelProps {
  ready: boolean;
  modelId: string | null;
  onReady: (modelId: string) => void;
}

export function LocalAIPanel({ ready, modelId, onReady }: LocalAIPanelProps) {
  const [selectedSize, setSelectedSize] = useState<ModelSize>("light");
  const [status, setStatus] = useState<string>(browserSupportMessage());
  const [progress, setProgress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const webgpu = useMemo(() => hasWebGPU(), []);

  async function activate() {
    if (!webgpu) {
      setStatus("WebGPU is not available. Use the rule-based fallback text instead.");
      return;
    }
    setLoading(true);
    setStatus("Loading local model in your browser...");
    try {
      const loaded = await loadLocalModel(selectedSize, (report: InitProgressReport) => {
        setProgress(report.text || `${Math.round((report.progress || 0) * 100)}%`);
      });
      setStatus("Local AI is ready. No API key or server is used.");
      onReady(loaded);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load local model.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="local-ai-panel">
      <div className="card-title-row">
        <div>
          <h2>2. Load local model</h2>
          <p>Optional WebLLM planner for the browser agent</p>
        </div>
        <span className={ready ? "ready-pill" : "ready-pill muted-pill"}>{ready ? "Ready" : "Optional"}</span>
      </div>
      <div className="ai-status-lines">
        <span>Model</span>
        <strong>{modelId ?? MODEL_OPTIONS.find((option) => option.size === selectedSize)?.label}</strong>
        <span>Backend</span>
        <strong>WebGPU {webgpu ? <em>GPU</em> : <em>Unavailable</em>}</strong>
        <span>Mode</span>
        <strong>{ready ? "Local planning + advice" : "Rule-based fallback"}</strong>
      </div>
      <div className="memory-bar" aria-hidden="true"><span style={{ width: ready ? "72%" : "28%" }} /></div>
      <p className={webgpu ? "support-ok" : "support-warning"}>{status}</p>
      {progress && <p className="progress-text">{progress}</p>}
      <div className="local-ai-actions">
        <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value as ModelSize)} disabled={loading || ready}>
          {MODEL_OPTIONS.map((option) => (
            <option key={option.size} value={option.size}>{option.label}</option>
          ))}
        </select>
        <button onClick={activate} disabled={loading || ready}>
          {loading ? <Loader2 size={16} aria-hidden="true" /> : ready ? <Settings size={16} aria-hidden="true" /> : <Cpu size={16} aria-hidden="true" />}
          {ready ? "Manage model" : loading ? "Loading..." : "Activate local AI"}
        </button>
      </div>
    </section>
  );
}
