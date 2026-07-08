import { CheckCircle2, Edit3, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CandidateProfile } from "../types";

interface ProfileSummaryProps {
  profile: CandidateProfile;
  demoMode: boolean;
  onChange: (profile: CandidateProfile) => void;
}

type EditableField = "skills" | "targetRoles";

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function updateField(profile: CandidateProfile, field: EditableField, values: string[]): CandidateProfile {
  return { ...profile, [field]: unique(values), updatedAt: new Date().toISOString() };
}

function ChipList({ values, editable, onRemove }: { values: string[]; editable?: boolean; onRemove?: (value: string) => void }) {
  if (!values.length) return <span className="empty-chip">None detected</span>;
  return (
    <div className="chips">
      {values.slice(0, 12).map((value) => (
        <span className="chip" key={value}>
          {value}
          {editable && (
            <button type="button" className="chip-remove" onClick={() => onRemove?.(value)} aria-label={`Remove ${value}`}>
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function AddInline({ label, placeholder, onAdd }: { label: string; placeholder: string; onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="inline-add"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setValue("");
      }}
    >
      <input aria-label={label} value={value} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} />
      <button type="submit"><Plus size={15} aria-hidden="true" /> Add</button>
    </form>
  );
}

export function ProfileSummary({ profile, demoMode, onChange }: ProfileSummaryProps) {
  const completeness = useMemo(() => {
    const groups = [
      profile.targetRoles,
      profile.skills,
      profile.education,
      profile.languages,
      profile.senioritySignals,
      profile.locationSignals,
    ];
    return Math.round((groups.filter((group) => group.length > 0).length / groups.length) * 100);
  }, [profile]);

  const summary = useMemo(() => {
    if (profile.llmProfileSummary) return profile.llmProfileSummary;
    if (!profile.targetRoles.length && !profile.skills.length) return "No CV loaded. Upload a CV to extract roles, skills and company targets.";
    const skills = profile.skills.slice(0, 4).join(", ") || "AI/Data";
    const role = profile.targetRoles[0] || "AI/Data role";
    return `${demoMode ? "Demo profile" : "Candidate profile"} targeting ${role}, with signals around ${skills}.`;
  }, [demoMode, profile.llmProfileSummary, profile.skills, profile.targetRoles]);

  function add(field: EditableField, value: string) {
    onChange(updateField(profile, field, [...profile[field], value]));
  }

  function remove(field: EditableField, value: string) {
    onChange(updateField(profile, field, profile[field].filter((item) => item !== value)));
  }

  return (
    <section className="dashboard-card profile-panel" id="profile">
      <div className="card-title-row">
        <div>
          <h2>Profile details</h2>
          <p>
            {demoMode ? "No CV loaded" : profile.fileName ?? "Parsed resume profile"}
            {" - "}
            {profile.extractionMethod === "webllm" ? "skills extracted with WebLLM" : "keyword fallback profile"}
          </p>
        </div>
        <details className="edit-profile">
          <summary><Edit3 size={15} aria-hidden="true" /> Edit profile</summary>
          <div className="edit-profile-body">
            <AddInline label="Add target role" placeholder="Add target role" onAdd={(value) => add("targetRoles", value)} />
            <AddInline label="Add skill" placeholder="Add skill" onAdd={(value) => add("skills", value)} />
          </div>
        </details>
      </div>
      <div className="profile-content">
        <div className="profile-facts">
          <span>Role</span>
          <strong>{profile.targetRoles[0] ?? "No role detected"}</strong>
          <span>Experience</span>
          <strong>{profile.senioritySignals.join(", ") || "Not specified"}</strong>
          <span>Location</span>
          <strong>{profile.locationSignals.join(", ") || "Open / remote"}</strong>
          <span>Skills</span>
          <ChipList values={profile.skills} editable onRemove={(value) => remove("skills", value)} />
          <span>Education</span>
          <strong>{profile.education.join(", ") || "Not detected"}</strong>
          <span>Languages</span>
          <strong>{profile.languages.join(", ") || "Not detected"}</strong>
        </div>
        <div className="profile-summary-box">
          <h3>Summary</h3>
          <p>{summary}</p>
          <div className="readiness-box">
            <strong><CheckCircle2 size={16} aria-hidden="true" /> Profile ready for matching</strong>
            <div className="memory-bar"><span style={{ width: `${completeness}%` }} /></div>
            <p><span>Completeness</span><b>{completeness}%</b></p>
          </div>
          <h3>Target roles</h3>
          <ChipList values={profile.targetRoles} editable onRemove={(value) => remove("targetRoles", value)} />
        </div>
      </div>
    </section>
  );
}
