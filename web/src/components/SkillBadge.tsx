interface SkillBadgeProps {
  label: string;
  tone?: "matched" | "missing" | "neutral";
}

export function SkillBadge({ label, tone = "neutral" }: SkillBadgeProps) {
  return <span className={`skill skill-${tone}`}>{label}</span>;
}
