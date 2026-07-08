import { Download, Eraser, FileUp, LockKeyhole, RotateCcw, ShieldOff, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ConsentSettings, LocalAgentMemory } from "../types";

interface MemorySettingsProps {
  consent: ConsentSettings;
  onConsentChange: (settings: ConsentSettings) => void;
  onClearHistory: () => Promise<void>;
  onDeleteProfile: () => Promise<void>;
  onExport: () => Promise<LocalAgentMemory>;
  onImport: (memory: LocalAgentMemory) => Promise<void>;
  onResetSettings: () => void;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="simple-toggle">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export function MemorySettings({
  consent,
  onConsentChange,
  onClearHistory,
  onDeleteProfile,
  onExport,
  onImport,
  onResetSettings,
}: MemorySettingsProps) {
  const importRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function patch(key: keyof ConsentSettings, value: boolean) {
    const next = { ...consent, [key]: value };
    if (key !== "localHistory" && value) next.localHistory = true;
    if (key === "localHistory" && !value) {
      next.saveParsedProfile = false;
      next.saveFullResumeText = false;
      next.saveJobHistory = false;
      next.saveAiGenerations = false;
    }
    onConsentChange(next);
  }

  async function exportJson() {
    const memory = await onExport();
    const blob = new Blob([JSON.stringify(memory, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-job-matcher-local-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Local data exported.");
  }

  async function importJson(file: File) {
    try {
      await onImport(JSON.parse(await file.text()) as LocalAgentMemory);
      setStatus("Local data imported.");
    } catch {
      setStatus("Import failed. Please choose a valid export.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  return (
    <section className="dashboard-card memory-panel" id="settings">
      <div className="card-title-row">
        <div>
          <h2>Settings: privacy & local memory</h2>
          <p>Keep control of what this browser stores</p>
        </div>
      </div>
      <div className="privacy-callout">
        <LockKeyhole size={16} aria-hidden="true" />
        <div>
          <strong>Your data stays on this device</strong>
          <p>We do not send your CV or profile anywhere. Everything is processed locally in your browser.</p>
        </div>
      </div>
      <Toggle
        label="Enable local memory"
        description="Store your profile and preferences in this browser"
        checked={consent.localHistory}
        onChange={(value) => patch("localHistory", value)}
      />
      <Toggle
        label="Save history"
        description="Keep your matches, filters and local AI generations"
        checked={consent.saveJobHistory}
        onChange={(value) => {
          patch("saveJobHistory", value);
          if (value) patch("saveParsedProfile", true);
        }}
      />
      <details className="advanced-privacy">
        <summary>Advanced privacy controls</summary>
        <div className="advanced-grid">
          <Toggle label="Save parsed profile" description="Skills, roles and signals" checked={consent.saveParsedProfile} onChange={(value) => patch("saveParsedProfile", value)} />
          <Toggle label="Save AI generations" description="Generated advice only after consent" checked={consent.saveAiGenerations} onChange={(value) => patch("saveAiGenerations", value)} />
          <Toggle label="Save full CV text" description="Sensitive, off by default" checked={consent.saveFullResumeText} onChange={(value) => patch("saveFullResumeText", value)} />
          <Toggle label="Anonymous analytics" description="No personal data" checked={consent.anonymousAnalytics} onChange={(value) => patch("anonymousAnalytics", value)} />
        </div>
        <div className="settings-actions">
          <button onClick={async () => { await onClearHistory(); setStatus("Local history cleared."); }}><Eraser size={16} aria-hidden="true" /> Clear local data</button>
          <button onClick={async () => { await onDeleteProfile(); setStatus("Saved profile deleted."); }}><Trash2 size={16} aria-hidden="true" /> Delete profile</button>
          <button onClick={() => void exportJson()}><Download size={16} aria-hidden="true" /> Export</button>
          <button onClick={() => importRef.current?.click()}><FileUp size={16} aria-hidden="true" /> Import</button>
          <button onClick={() => patch("anonymousAnalytics", false)}><ShieldOff size={16} aria-hidden="true" /> Disable analytics</button>
          <button onClick={() => { onResetSettings(); setStatus("Privacy settings reset."); }}><RotateCcw size={16} aria-hidden="true" /> Reset</button>
        </div>
      </details>
      <button className="danger-link" onClick={async () => { await onClearHistory(); setStatus("Local data cleared."); }}>
        <Trash2 size={15} aria-hidden="true" /> Clear local data
      </button>
      <input
        ref={importRef}
        className="hidden-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) void importJson(file);
        }}
      />
      {status && <p className="muted">{status}</p>}
    </section>
  );
}
