import type { ReactNode } from "react";
import { AlertIcon } from "./icons";

export function Loading({ label }: { label: string }) {
  return (
    <p className="state state-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

/** Explains that data could not be loaded or saved, with an optional retry. */
export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?(): void }) {
  return (
    <div className="state state-error" role="alert">
      <AlertIcon />
      <div>
        <p className="state-title">{title}</p>
        <p>{message}</p>
        {onRetry && (
          <button type="button" className="button button-outline button-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {children}
    </div>
  );
}
