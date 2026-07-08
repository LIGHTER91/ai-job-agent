import type { Priority } from "../types";

interface FiltersProps {
  query: string;
  priority: "all" | Priority;
  source: string;
  missingSkill: string;
  sort: "score" | "date";
  sources: string[];
  missingSkills: string[];
  onQueryChange: (value: string) => void;
  onPriorityChange: (value: "all" | Priority) => void;
  onSourceChange: (value: string) => void;
  onMissingSkillChange: (value: string) => void;
  onSortChange: (value: "score" | "date") => void;
}

export function Filters(props: FiltersProps) {
  return (
    <section className="filters" aria-label="Job filters">
      <input
        aria-label="Search jobs"
        value={props.query}
        onChange={(event) => props.onQueryChange(event.target.value)}
        placeholder="Search title, company, skill..."
      />
      <select
        aria-label="Priority"
        value={props.priority}
        onChange={(event) => props.onPriorityChange(event.target.value as "all" | Priority)}
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select aria-label="Source" value={props.source} onChange={(event) => props.onSourceChange(event.target.value)}>
        <option value="all">All sources</option>
        {props.sources.map((source) => (
          <option key={source} value={source}>{source}</option>
        ))}
      </select>
      <select aria-label="Missing skill" value={props.missingSkill} onChange={(event) => props.onMissingSkillChange(event.target.value)}>
        <option value="all">All skill gaps</option>
        {props.missingSkills.map((skill) => (
          <option key={skill} value={skill}>{skill}</option>
        ))}
      </select>
      <select aria-label="Sort" value={props.sort} onChange={(event) => props.onSortChange(event.target.value as "score" | "date")}>
        <option value="score">Best match first</option>
        <option value="date">Newest first</option>
      </select>
    </section>
  );
}
