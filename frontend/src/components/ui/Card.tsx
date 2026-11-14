import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  /** Shown at the right of the card header, e.g. a "View all" link. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A bordered, rounded panel with an optional header, like the HireFlow cards. */
export function Card({ title, description, action, children, className = "" }: CardProps) {
  return (
    <section className={`card ${className}`.trim()} aria-label={title}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {description && <p className="card-description">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="card-content">{children}</div>
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
}

/** A small card highlighting one figure, like the metric cards on the HireFlow dashboard. */
export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <section className="card stat-card" aria-label={label}>
      <div className="stat-card-top">
        <h2 className="stat-label">{label}</h2>
        <span className="stat-icon">{icon}</span>
      </div>
      <p className="stat-value">{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </section>
  );
}
