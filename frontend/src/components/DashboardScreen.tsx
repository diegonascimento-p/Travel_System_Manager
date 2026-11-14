import { useAsync } from "../hooks/useAsync";
import { Link } from "../router/navigation";
import { defaultTripsServices, type TripsServices } from "../services/tripsApi";
import { formatMonth, localMonth } from "../utils/dates";
import { useDistanceUnit } from "../settings/DistanceUnitContext";
import { formatDistance } from "../utils/distance";
import { AppShell } from "./AppShell";
import { TripsTable } from "./TripsTable";
import { Card, StatCard } from "./ui/Card";
import { GaugeIcon, PlusIcon, RouteIcon } from "./ui/icons";
import { EmptyState, ErrorState, Loading } from "./ui/States";

export const RECENT_TRIPS = 5;

interface Props {
  services?: TripsServices;
  /** Used to work out the current month in the user's time zone; defaults to now. */
  today?: Date;
}

/** This month's mileage and the most recent trips. */
export function DashboardScreen({ services = defaultTripsServices, today }: Props) {
  const month = localMonth(today);
  const { unit } = useDistanceUnit();
  const data = useAsync(
    () => Promise.all([services.fetchMonthlyMileage(month), services.fetchTrips(RECENT_TRIPS, 0)]),
    [services, month],
  );

  return (
    <AppShell
      active="dashboard"
      title="Dashboard"
      description="Your mileage at a glance."
      actions={
        <Link to="/trips/new" className="button button-primary">
          <PlusIcon />
          <span>Add trip</span>
        </Link>
      }
    >
      {data.status === "loading" && <Loading label="Loading your mileage…" />}
      {data.status === "error" && (
        <ErrorState title="Could not load the dashboard" message={data.error.message} onRetry={data.reload} />
      )}
      {data.status === "ready" && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Distance this month"
              value={formatDistance(data.data[0].totalDistance, unit)}
              hint={formatMonth(month)}
              icon={<GaugeIcon />}
            />
            <StatCard
              label="Trips this month"
              value={String(data.data[0].tripCount)}
              hint={formatMonth(month)}
              icon={<RouteIcon />}
            />
          </div>
          <Card
            title="Recent trips"
            description="Your latest trips, newest first."
            action={
              <Link to="/trips" className="button button-outline button-sm">
                View all
              </Link>
            }
          >
            {data.data[1].trips.length === 0 ? (
              <EmptyState title="No trips yet">
                <p>Log your first trip to start tracking your mileage.</p>
              </EmptyState>
            ) : (
              <TripsTable trips={data.data[1].trips} caption="Recent trips" />
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}
