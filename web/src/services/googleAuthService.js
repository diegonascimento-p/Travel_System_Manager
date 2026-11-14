const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export class CalendarAuthError extends Error {
  constructor(message, reason) {
    super(message);
    this.name = 'CalendarAuthError';
    this.reason = reason;
  }
}

/**
 * Obtains a Google OAuth access token in the browser with Google Identity
 * Services (token model). The token is kept in memory only.
 */
export function createGoogleAuthService({ clientId, scope, loadScript = loadGisScript, getWindow = () => window }) {
  let loading;

  function preload() {
    loading ??= loadScript(GIS_SCRIPT_URL).catch((error) => {
      loading = undefined;
      throw error;
    });
    return loading;
  }

  async function connect() {
    try {
      await preload();
    } catch {
      throw new CalendarAuthError('Could not load Google sign-in.', 'load_failed');
    }
    const oauth2 = getWindow().google.accounts.oauth2;

    return new Promise((resolve, reject) => {
      const client = oauth2.initTokenClient({
        client_id: clientId,
        scope,
        callback: (response) => {
          if (response.error) {
            reject(new CalendarAuthError('Google Calendar access was not granted.', response.error));
          } else if (!oauth2.hasGrantedAllScopes(response, scope)) {
            reject(new CalendarAuthError('Google Calendar access was not granted.', 'access_denied'));
          } else {
            resolve(response.access_token);
          }
        },
        error_callback: (error) => {
          reject(new CalendarAuthError('The Google connection window was closed or blocked.', error?.type ?? 'unknown'));
        },
      });
      client.requestAccessToken();
    });
  }

  return { preload, connect };
}

function loadGisScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(script);
  });
}
