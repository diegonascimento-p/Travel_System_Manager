import { useEffect, useState } from "react";
import { downloadYearlyEventsPdf, type EventsServices } from "../controllers/yearlyEventsPdfController";
import type { YearEvents } from "../models/event";
import { Link } from "../router/navigation";
import { defaultEventsServices } from "../services";
import { formatEventDate, formatMiles } from "../utils/format";
import { DownloadPdfControl } from "./DownloadPdfControl";

interface Props {
  accessToken: string;
  services?: EventsServices;
}

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & YearEvents);

/** Lists this year's events with miles traveled, and offers a yearly PDF download. */
export function EventsListScreen({ accessToken, services = defaultEventsServices }: Props) {
  const year = new Date().getFullYear();
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    services
      .fetchEventsForYear(year, accessToken)
      .then((result) => active && setState({ status: "ready", ...result }))
      .catch((e: unknown) =>
        active && setState({ status: "error", message: e instanceof Error ? e.message : "Could not load events." }),
      );
    return () => {
      active = false;
    };
  }, [accessToken, services, year]);

  return (
    <div className="events-screen">
      <h2>Events</h2>
      <DownloadPdfControl
        onDownload={async (selectedYear) => {
          await downloadYearlyEventsPdf(selectedYear, accessToken, services);
        }}
      />
      <h3>{year}</h3>
      {state.status === "loading" && <p>Loading events…</p>}
      {state.status === "error" && <p role="alert">{state.message}</p>}
      {state.status === "ready" && state.baseAddress === null && (
        <p role="note">
          Miles are measured from your base address. <Link to="/settings">Set your base address</Link> to calculate them.
        </p>
      )}
      {state.status === "ready" && state.baseAddress !== null && <p>Miles from {state.baseAddress}.</p>}
      {state.status === "ready" && state.events.length === 0 && <p>No events this year.</p>}
      {state.status === "ready" && state.events.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Miles traveled</th>
            </tr>
          </thead>
          <tbody>
            {state.events.map((event) => (
              <tr key={event.id}>
                <td>{formatEventDate(event.date)}</td>
                <td>{event.name}</td>
                <td>{formatMiles(event.miles)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
