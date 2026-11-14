import { AppShell } from "./AppShell";
import { EventsListScreen } from "./EventsListScreen";
import { GoogleSignInGate } from "./GoogleSignInGate";
import { Card } from "./ui/Card";

/** The Google Calendar events screen from MCB-11, behind Google sign-in, inside the app shell. */
export function CalendarEventsScreen() {
  return (
    <AppShell active="events" title="Calendar events" description="Miles traveled to your Google Calendar events.">
      <GoogleSignInGate>
        {(accessToken) => (
          <Card className="legacy-card">
            <EventsListScreen accessToken={accessToken} />
          </Card>
        )}
      </GoogleSignInGate>
    </AppShell>
  );
}
