import type { UserSettings } from "../models/settings";

export interface SettingsServices {
  fetchSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<UserSettings>;
}

/** Loads the settings saved to the user's account. */
export function fetchSettings(): Promise<UserSettings> {
  return request("/api/settings");
}

/** Saves the settings to the user's account. */
export function saveSettings(settings: UserSettings): Promise<UserSettings> {
  return request("/api/settings", { method: "PUT", body: JSON.stringify(settings) });
}

export const defaultSettingsServices: SettingsServices = { fetchSettings, saveSettings };

async function request(url: string, init: RequestInit = {}): Promise<UserSettings> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `The server answered with status ${response.status}.`);
  }
  return (await response.json()) as UserSettings;
}
