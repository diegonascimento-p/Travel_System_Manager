import { useState } from "react";
import { EventsListScreen } from "./components/EventsListScreen";
import { requestCalendarAccessToken } from "./services/googleAuth";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (accessToken) return <EventsListScreen accessToken={accessToken} />;

  async function signIn() {
    setError(null);
    try {
      setAccessToken(await requestCalendarAccessToken(clientId!));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    }
  }

  return (
    <main>
      <h1>Travel System Manager</h1>
      {clientId ? (
        <button type="button" onClick={signIn}>
          Sign in with Google
        </button>
      ) : (
        <p role="alert">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
      )}
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
