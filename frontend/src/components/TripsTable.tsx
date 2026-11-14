import type { Trip } from "../models/trip";
import { Link } from "../router/navigation";
import { pathFor } from "../router/routes";
import { useDistanceUnit } from "../settings/DistanceUnitContext";
import { formatDistance } from "../utils/distance";
import { formatEventDate } from "../utils/format";
import { PencilIcon } from "./ui/icons";

interface Props {
  trips: Trip[];
  caption: string;
}

/**
 * Trips in a HireFlow-style table. On narrow screens each row stacks into a labelled block
 * (see `.data-table` in styles.css) so no column is cut off.
 */
export function TripsTable({ trips, caption }: Props) {
  const { unit } = useDistanceUnit();
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Origin</th>
            <th scope="col">Destination</th>
            <th scope="col" className="numeric">
              Distance
            </th>
            <th scope="col">Purpose</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td data-label="Date" className="nowrap">
                {formatEventDate(trip.date)}
              </td>
              <td data-label="Origin">{trip.origin}</td>
              <td data-label="Destination">{trip.destination}</td>
              <td data-label="Distance" className="numeric nowrap">
                <span className="badge">{formatDistance(trip.distance, unit)}</span>
              </td>
              <td data-label="Purpose" className="muted">
                {trip.purpose}
              </td>
              <td className="row-actions">
                <Link
                  to={pathFor({ name: "editTrip", id: trip.id })}
                  className="button button-ghost button-sm"
                  aria-label={`Edit trip from ${trip.origin} to ${trip.destination} on ${formatEventDate(trip.date)}`}
                >
                  <PencilIcon />
                  <span>Edit</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
