import { type AnchorHTMLAttributes, type MouseEvent, useSyncExternalStore } from "react";

const NAVIGATE_EVENT = "app:navigate";

/** Shows another screen without reloading the page. */
export function navigate(to: string): void {
  window.history.pushState(null, "", to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  window.scrollTo?.({ top: 0 });
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

const currentLocation = () => window.location.pathname + window.location.search;

/** The current path and query string, updated on every navigation. */
export function useLocation(): string {
  return useSyncExternalStore(subscribe, currentLocation, currentLocation);
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

/** An anchor that navigates inside the app; modified clicks (new tab, etc.) behave as normal links. */
export function Link({ to, onClick, ...props }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={handleClick} {...props} />;
}
