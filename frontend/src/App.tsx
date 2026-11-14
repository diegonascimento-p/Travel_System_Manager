import { lazy, Suspense } from "react";
import { AppShell } from "./components/AppShell";
import { DashboardScreen } from "./components/DashboardScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { TripFormScreen } from "./components/TripFormScreen";
import { TripsListScreen } from "./components/TripsListScreen";
import { Loading } from "./components/ui/States";
import { Link, useLocation } from "./router/navigation";
import { parseRoute } from "./router/routes";
import { DistanceUnitProvider } from "./settings/DistanceUnitContext";

// The calendar screen pulls in Google sign-in and PDF code, so it is only downloaded when opened.
const CalendarEventsScreen = lazy(() =>
  import("./components/CalendarEventsScreen").then((module) => ({ default: module.CalendarEventsScreen })),
);

export function App() {
  return (
    <DistanceUnitProvider>
      <Screen />
    </DistanceUnitProvider>
  );
}

function Screen() {
  const location = useLocation();
  const [pathname, search = ""] = location.split(/(?=\?)/);
  const route = parseRoute(pathname, search);

  switch (route.name) {
    case "dashboard":
      return <DashboardScreen />;
    case "trips":
      return <TripsListScreen page={route.page} />;
    case "newTrip":
      return <TripFormScreen key="new" />;
    case "editTrip":
      return <TripFormScreen key={route.id} tripId={route.id} />;
    case "events":
      return (
        <Suspense fallback={<Loading label="Loading…" />}>
          <CalendarEventsScreen />
        </Suspense>
      );
    case "settings":
      return <SettingsScreen />;
    case "notFound":
      return (
        <AppShell active={null} title="Page not found">
          <p>
            This page does not exist. <Link to="/">Go to the dashboard</Link>.
          </p>
        </AppShell>
      );
  }
}
