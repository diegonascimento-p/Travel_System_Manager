import { useSyncExternalStore } from "react";

/**
 * The Google access token of the signed-in user, shared by every screen. It lives only in memory:
 * reloading the page or signing out forgets it, and signing in again restores the saved profile.
 */
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function setGoogleAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener());
}

export function signOutOfGoogle(): void {
  setGoogleAccessToken(null);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The signed-in user's access token, or null when signed out. */
export function useGoogleAccessToken(): string | null {
  return useSyncExternalStore(subscribe, () => accessToken, () => accessToken);
}
