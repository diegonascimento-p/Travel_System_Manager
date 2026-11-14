const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string }) => void;
      }): { requestAccessToken(): void };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let scriptLoading: Promise<void> | null = null;

function loadIdentityScript(): Promise<void> {
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Could not load Google sign-in."));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/** Signs the user in with Google and returns an access token for reading their calendar. */
export async function requestCalendarAccessToken(clientId: string): Promise<string> {
  await loadIdentityScript();
  const oauth2 = window.google!.accounts.oauth2;
  return new Promise((resolve, reject) => {
    oauth2
      .initTokenClient({
        client_id: clientId,
        scope: CALENDAR_SCOPE,
        callback: (response) =>
          response.access_token
            ? resolve(response.access_token)
            : reject(new Error(response.error ?? "Google sign-in failed.")),
        error_callback: () => reject(new Error("Google sign-in was cancelled.")),
      })
      .requestAccessToken();
  });
}
