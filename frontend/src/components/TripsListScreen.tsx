import { useAsync } from "../hooks/useAsync";
import { Link } from "../router/navigation";
import { pathFor } from "../router/routes";
import { defaultTripsServices, type TripsServices } from "../services/tripsApi";
import { AppShell } from "./AppShell";
import { TripsTable } from "./TripsTable";
import { Card } from "./ui/Card";
import { PlusIcon } from "./ui/icons";
import { EmptyState, ErrorState, Loading } from "./ui/States";

export const TRIPS_PAGE_SIZE = 20;

interface Props {
  /** 1-based page number. */
  page: number;
  services?: TripsServices;
}

/** Every trip in a table, newest first, a page at a time. */
export function TripsListScreen({ page, services = defaultTripsServices }: Props) {
  const data = useAsync(() => services.fetchTrips(TRIPS_PAGE_SIZE, (page - 1) * TRIPS_PAGE_SIZE), [services, page]);

  return (
    <AppShell
      active="trips"
      title="Trips"
      description="Every trip you logged, newest first."
      actions={
        <Link to="/trips/new" className="button button-primary">
          <PlusIcon />
          <span>Add trip</span>
        </Link>
      }
    >
      <Card title="All trips">
        {data.status === "loading" && <Loading label="Loading trips…" />}
        {data.status === "error" && (
          <ErrorState title="Could not load the trips" message={data.error.message} onRetry={data.reload} />
        )}
        {data.status === "ready" && data.data.total === 0 && (
          <EmptyState title="No trips yet">
            <p>Trips you add will show up here.</p>
          </EmptyState>
        )}
        {data.status === "ready" && data.data.total > 0 && (
          <>
            {data.data.trips.length > 0 ? (
              <TripsTable trips={data.data.trips} caption="All trips" />
            ) : (
              <EmptyState title="This page is empty" />
            )}
            <Pagination page={page} total={data.data.total} />
          </>
        )}
      </Card>
    </AppShell>
  );
}

function Pagination({ page, total }: { page: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / TRIPS_PAGE_SIZE));
  const first = Math.min((page - 1) * TRIPS_PAGE_SIZE + 1, total);
  const last = Math.min(page * TRIPS_PAGE_SIZE, total);
  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="muted">
        Showing {first}–{last} of {total} {total === 1 ? "trip" : "trips"}
      </p>
      {pages > 1 && (
        <div className="pagination-buttons">
          <PageLink page={page - 1} disabled={page <= 1} label="Previous" />
          <PageLink page={page + 1} disabled={page >= pages} label="Next" />
        </div>
      )}
    </nav>
  );
}

function PageLink({ page, disabled, label }: { page: number; disabled: boolean; label: string }) {
  if (disabled) {
    return (
      <span className="button button-outline button-sm" aria-disabled="true">
        {label}
      </span>
    );
  }
  return (
    <Link to={pathFor({ name: "trips", page })} className="button button-outline button-sm">
      {label}
    </Link>
  );
}
