import { ExternalLink, Search } from "lucide-react";
import type { ExternalSearchLink } from "../types";

interface ExternalSearchLinksProps {
  links: ExternalSearchLink[];
}

export function ExternalSearchLinks({ links }: ExternalSearchLinksProps) {
  if (!links.length) return null;

  return (
    <section className="dashboard-card external-searches" aria-label="External job-board searches">
      <div className="card-title-row">
        <div>
          <h2>External searches and company careers</h2>
          <p>Search shortcuts and direct career pages. They are not counted as job offers until the agent reads a real ATS listing.</p>
        </div>
        <Search size={20} aria-hidden="true" />
      </div>
      <div className="external-search-grid">
        {links.map((link) => (
          <a href={link.url} target="_blank" rel="noreferrer" className="external-search-item" key={link.id}>
            <span>
              <strong>{link.source}</strong>
              <small>{link.query} - {link.location}</small>
              <em>{link.description}</em>
            </span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
