import { BriefcaseBusiness, CircleHelp, Home, Info, Search, Settings, ShieldCheck, UserRound } from "lucide-react";

export type AppPage = "dashboard" | "matches" | "profile" | "settings" | "about";

interface AppSidebarProps {
  localAIReady: boolean;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "matches", label: "Matches", icon: Search },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "about", label: "About", icon: Info },
] satisfies Array<{ id: AppPage; label: string; icon: typeof Home }>;

export function AppSidebar({ localAIReady, activePage, onNavigate }: AppSidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="App navigation">
      <div className="sidebar-brand">
        <span className="brand-icon"><BriefcaseBusiness size={20} aria-hidden="true" /></span>
        <strong>AI Job Matcher</strong>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activePage === item.id ? "nav-item active" : "nav-item"}
              type="button"
              onClick={() => onNavigate(item.id)}
              key={item.label}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-privacy">
        <ShieldCheck size={22} aria-hidden="true" />
        <strong>Local-first</strong>
        <p>Your data stays on this device.</p>
        <p>No cookies. No analytics by default.</p>
      </div>
      <div className="sidebar-footer">
        <span className={localAIReady ? "status-dot ready" : "status-dot"} />
        <span>{localAIReady ? "Local AI ready" : "Local AI optional"}</span>
        <CircleHelp size={15} aria-hidden="true" />
      </div>
    </aside>
  );
}
