import { type ReactNode, useState } from "react";
import { requestCalendarAccessToken } from "../services/googleAuth";
import { setGoogleAccessToken, useGoogleAccessToken } from "../services/googleSession";
import { Card } from "./ui/Card";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface Props {
  /** Shown once the user is signed in with Google. */
  children(accessToken: string): ReactNode;
}

/** Asks the user to sign in with Google, then renders the screen with their access token. */
export function GoogleSignInGate({ children }: Props) {
  const accessToken = useGoogleAccessToken();
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    try {
      setGoogleAccessToken(await requestCalendarAccessToken(clientId!));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    }
  }

  if (accessToken) return <>{children(accessToken)}</>;
  return (
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
  );
}
