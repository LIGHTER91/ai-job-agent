import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import type { ParsedResumeResult } from "../types";
import { parseResumeFile } from "../lib/resumeParser";

interface ResumeUploaderProps {
  onParsed: (result: ParsedResumeResult) => void | string | Promise<void | string>;
  onClear: () => void;
}

export function ResumeUploader({ onParsed, onClear }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("No CV uploaded yet. Profile and matches are empty.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    setStatus("Parsing CV locally in your browser...");
    try {
      const result = await parseResumeFile(file);
      setStatus(`Parsed ${result.format.toUpperCase()} locally. Asking local AI to read the CV if the model is ready...`);
      const nextStatus = await onParsed(result);
      setStatus(nextStatus || `Parsed ${result.format.toUpperCase()} locally. ${result.textLength.toLocaleString()} characters read.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to parse this CV.");
      setStatus("Parsing stopped.");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setStatus("No CV uploaded yet. Profile and matches are empty.");
    setError(null);
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClear();
  }

  return (
    <section className="panel resume-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Resume upload</p>
          <h2>1. Upload your CV</h2>
        </div>
        <FileText size={22} aria-hidden="true" />
      </div>
      <label
        className="upload-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files.item(0);
          if (file) void handleFile(file);
        }}
      >
        <Upload size={22} aria-hidden="true" />
        <span>{fileName ?? "Drag & drop your CV here"}</span>
        <small>PDF and TXT supported. DOCX shows a clean availability message.</small>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            const file = event.target.files?.item(0);
            if (file) void handleFile(file);
          }}
        />
      </label>
      <div className="status-row">
        <p className={error ? "error" : "muted"}>{error ?? status}</p>
        <button className="ghost-button" onClick={clear} disabled={loading}>
          <X size={16} aria-hidden="true" />
          Clear uploaded CV
        </button>
      </div>
    </section>
  );
}
