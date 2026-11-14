import { useEffect, useState } from "react";
import { downloadYearlyEventsPdf, type EventsServices } from "../controllers/yearlyEventsPdfController";
import type { EventWithMiles } from "../models/event";
import { defaultEventsServices } from "../services";
import { useDistanceUnit } from "../settings/DistanceUnitContext";
import { formatDistance, totalMiles } from "../utils/distance";
import { formatEventDate } from "../utils/format";
import { DownloadPdfControl } from "./DownloadPdfControl";

interface Props {
  accessToken: string;
  services?: EventsServices;
}

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; events: EventWithMiles[] };

/** Lists this year's events with the distance traveled in the account's unit, and offers a yearly PDF download. */
export function EventsListScreen({ accessToken, services = defaultEventsServices }: Props) {
  const year = new Date().getFullYear();
  const { unit } = useDistanceUnit();
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    services
      .getCurrentPosition()
      .then((origin) => services.fetchEventsForYear(year, accessToken, origin))
      .then((events) => active && setState({ status: "ready", events }))
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
          await downloadYearlyEventsPdf(selectedYear, accessToken, services, unit);
        }}
      />
      <h3>{year}</h3>
      {state.status === "loading" && <p>Loading events…</p>}
      {state.status === "error" && <p role="alert">{state.message}</p>}
      {state.status === "ready" && state.events.length === 0 && <p>No events this year.</p>}
      {state.status === "ready" && state.events.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Distance traveled</th>
            </tr>
          </thead>
          <tbody>
            {state.events.map((event) => (
              <tr key={event.id}>
                <td>{formatEventDate(event.date)}</td>
                <td>{event.name}</td>
                <td>{formatDistance(event.miles, unit)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Total
              </th>
              <td>{formatDistance(totalMiles(state.events.map((event) => event.miles)), unit)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
