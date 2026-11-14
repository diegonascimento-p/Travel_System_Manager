import type { UserSettings } from "../models/settings";

/** The settings API answered with an error; `fieldError` explains what is wrong with the base address. */
export class SettingsApiError extends Error {
  constructor(
    message: string,
    readonly fieldError?: string,
  ) {
    super(message);
  }
}

export interface SettingsServices {
  fetchSettings(accessToken: string): Promise<UserSettings>;
  saveSettings(accessToken: string, settings: UserSettings): Promise<UserSettings>;
}

export function fetchSettings(accessToken: string): Promise<UserSettings> {
  return request(accessToken, { method: "GET" });
}

export function saveSettings(accessToken: string, settings: UserSettings): Promise<UserSettings> {
  return request(accessToken, { method: "PUT", body: JSON.stringify(settings) });
}

export const defaultSettingsServices: SettingsServices = { fetchSettings, saveSettings };

async function request(accessToken: string, init: RequestInit): Promise<UserSettings> {
  let response: Response;
  try {
    response = await fetch("/api/settings", {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new SettingsApiError("Could not reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; fields?: { baseAddress?: string } };
    if (response.status === 401) throw new SettingsApiError("Your Google sign-in expired. Sign in again.");
    throw new SettingsApiError(body.error ?? `The server answered with status ${response.status}.`, body.fields?.baseAddress);
  }
  return (await response.json()) as UserSettings;
}
