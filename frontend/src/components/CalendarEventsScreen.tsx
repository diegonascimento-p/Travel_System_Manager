import { useState } from "react";
import { requestCalendarAccessToken } from "../services/googleAuth";
import { AppShell } from "./AppShell";
import { EventsListScreen } from "./EventsListScreen";
import { Card } from "./ui/Card";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/** The Google Calendar events screen from MCB-11, behind Google sign-in, inside the app shell. */
export function CalendarEventsScreen() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    try {
      setAccessToken(await requestCalendarAccessToken(clientId!));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    }
  }

  return (
    <AppShell active="events" title="Calendar events" description="Miles traveled to your Google Calendar events.">
      {accessToken ? (
        <Card className="legacy-card">
          <EventsListScreen accessToken={accessToken} />
        </Card>
      ) : (
        <Card title="Connect Google Calendar">
          {clientId ? (
            <button type="button" className="button button-primary" onClick={signIn}>
              Sign in with Google
            </button>
          ) : (
            <p role="alert">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
          )}
          {error && <p role="alert">{error}</p>}
        </Card>
      )}
    </AppShell>
  );
}
