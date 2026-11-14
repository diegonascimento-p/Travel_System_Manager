import { type ReactNode, useEffect, useState } from "react";
import { Link } from "../router/navigation";
import { CalendarIcon, CloseIcon, DashboardIcon, MenuIcon, PlusIcon, RouteIcon } from "./ui/icons";

export type NavSection = "dashboard" | "trips" | "newTrip" | "events";

interface Props {
  active: NavSection | null;
  title: string;
  description?: string;
  /** Buttons shown at the right of the header. */
  actions?: ReactNode;
  children: ReactNode;
}

const NAV_ITEMS: { section: NavSection; to: string; label: string; icon: ReactNode }[] = [
  { section: "dashboard", to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { section: "trips", to: "/trips", label: "Trips", icon: <RouteIcon /> },
  { section: "newTrip", to: "/trips/new", label: "Add trip", icon: <PlusIcon /> },
  { section: "events", to: "/events", label: "Calendar events", icon: <CalendarIcon /> },
];

/**
 * The HireFlow-style frame shared by every screen: a sidebar with the navigation and a header
 * with the page title. Below 768px the sidebar becomes a drawer opened from the header.
 */
export function AppShell({ active, title, description, actions, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <div className={`app-shell${menuOpen ? " menu-open" : ""}`}>
      <aside id="app-sidebar" className="sidebar" aria-label="Sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            <RouteIcon />
          </span>
          <span className="brand-name">Travel Manager</span>
          <button
            type="button"
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Main">
          <p className="sidebar-group-label">Mileage</p>
          <ul className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <li key={item.section}>
                <Link
                  to={item.to}
                  className={`sidebar-link${item.section === active ? " active" : ""}`}
                  aria-current={item.section === active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="sidebar-overlay" aria-hidden="true" onClick={() => setMenuOpen(false)} />
      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="icon-button menu-button"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <div className="header-titles">
            <h1>{title}</h1>
            {description && <p className="header-description">{description}</p>}
          </div>
          {actions && <div className="header-actions">{actions}</div>}
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
