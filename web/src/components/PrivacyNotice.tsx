import { ShieldCheck } from "lucide-react";

export function PrivacyNotice() {
  return (
    <section className="privacy-notice" aria-label="Privacy notice">
      <ShieldCheck size={22} aria-hidden="true" />
      <div>
        <h2>Privacy-first by default</h2>
        <p>
          Your CV is processed locally in your browser. It is not uploaded to a server. Local history is optional.
          Analytics are disabled by default.
        </p>
        <p className="muted">
          Full CV text is not saved unless you explicitly enable the sensitive storage option.
        </p>
      </div>
    </section>
  );
}
