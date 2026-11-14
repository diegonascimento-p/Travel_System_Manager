import { type FormEvent, type ReactNode, useState } from "react";
import {
  MAX_PLACE_LENGTH,
  MAX_PURPOSE_LENGTH,
  type TripFormValues,
  emptyTripForm,
  tripToForm,
  validateTripForm,
} from "../controllers/tripForm";
import { useAsync } from "../hooks/useAsync";
import type { TripField, TripFieldErrors, TripInput } from "../models/trip";
import { Link, navigate } from "../router/navigation";
import { defaultTripsServices, TripsApiError, type TripsServices } from "../services/tripsApi";
import { localDate } from "../utils/dates";
import { AppShell } from "./AppShell";
import { Card } from "./ui/Card";
import { ErrorState, Loading } from "./ui/States";

interface Props {
  /** The trip to edit; omitted to add a new trip. */
  tripId?: number;
  services?: TripsServices;
  /** Used for the default date of a new trip; defaults to now. */
  today?: Date;
}

/** Adds a new trip, or edits an existing one when `tripId` is given. Goes to the trips list once saved. */
export function TripFormScreen({ tripId, services = defaultTripsServices, today }: Props) {
  const editing = tripId !== undefined;
  return (
    <AppShell
      active={editing ? null : "newTrip"}
      title={editing ? "Edit trip" : "Add trip"}
      description={editing ? "Update the details of this trip." : "Log a trip to track its mileage."}
    >
      {editing ? (
        <EditTrip id={tripId} services={services} />
      ) : (
        <TripForm
          initial={emptyTripForm(localDate(today))}
          submitLabel="Save trip"
          onSave={(input) => services.createTrip(input)}
        />
      )}
    </AppShell>
  );
}

function EditTrip({ id, services }: { id: number; services: TripsServices }) {
  const trip = useAsync(() => services.fetchTrip(id), [services, id]);
  if (trip.status === "loading") return <Loading label="Loading the trip…" />;
  if (trip.status === "error") {
    const notFound = trip.error instanceof TripsApiError && trip.error.status === 404;
    return (
      <ErrorState
        title="Could not load the trip"
        message={trip.error.message}
        onRetry={notFound ? undefined : trip.reload}
      />
    );
  }
  return (
    <TripForm
      initial={tripToForm(trip.data)}
      submitLabel="Save changes"
      onSave={(input) => services.updateTrip(id, input)}
    />
  );
}

interface FormProps {
  initial: TripFormValues;
  submitLabel: string;
  onSave(input: TripInput): Promise<unknown>;
}

function TripForm({ initial, submitLabel, onSave }: FormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<TripFieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function change(field: TripField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    const result = validateTripForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError(event.currentTarget, result.errors);
      return;
    }
    setSaving(true);
    try {
      await onSave(result.input);
      navigate("/trips");
    } catch (error) {
      setSaving(false);
      showSaveError(error);
    }
  }

  function showSaveError(error: unknown) {
    const fields = error instanceof TripsApiError ? error.fields : {};
    if (Object.keys(fields).length > 0) setErrors(fields);
    setSaveError(error instanceof Error ? error.message : "Could not save the trip.");
  }

  const hasErrors = Object.values(errors).some(Boolean);
  const fieldProps = (field: TripField) => ({
    id: `trip-${field}`,
    name: field,
    value: values[field],
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `trip-${field}-error` : undefined,
  });

  return (
    <Card title="Trip details" description="All fields are required. Distance is in miles." className="form-card">
      <form className="trip-form" noValidate onSubmit={handleSubmit}>
        {saveError && <ErrorState title="Could not save the trip" message={saveError} />}
        {!saveError && hasErrors && (
          <p className="form-summary" role="alert">
            Please fix the highlighted fields.
          </p>
        )}
        <div className="form-grid">
          <Field field="date" label="Date" error={errors.date}>
            <input type="date" className="input" required {...fieldProps("date")} onChange={(e) => change("date", e.target.value)} />
          </Field>
          <Field field="distance" label="Distance (miles)" error={errors.distance}>
            <input
              type="text"
              inputMode="decimal"
              className="input"
              placeholder="e.g. 12.5"
              required
              {...fieldProps("distance")}
              onChange={(e) => change("distance", e.target.value)}
            />
          </Field>
          <Field field="origin" label="Origin" error={errors.origin}>
            <input
              type="text"
              className="input"
              placeholder="Where you started"
              maxLength={MAX_PLACE_LENGTH}
              required
              {...fieldProps("origin")}
              onChange={(e) => change("origin", e.target.value)}
            />
          </Field>
          <Field field="destination" label="Destination" error={errors.destination}>
            <input
              type="text"
              className="input"
              placeholder="Where you went"
              maxLength={MAX_PLACE_LENGTH}
              required
              {...fieldProps("destination")}
              onChange={(e) => change("destination", e.target.value)}
            />
          </Field>
          <Field field="purpose" label="Purpose" error={errors.purpose} wide>
            <textarea
              className="input textarea"
              rows={3}
              placeholder="e.g. Client meeting with Acme"
              maxLength={MAX_PURPOSE_LENGTH}
              required
              {...fieldProps("purpose")}
              onChange={(e) => change("purpose", e.target.value)}
            />
          </Field>
        </div>
        <div className="form-actions">
          <Link to="/trips" className="button button-outline">
            Cancel
          </Link>
          <button type="submit" className="button button-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Card>
  );
}

interface FieldProps {
  field: TripField;
  label: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}

function Field({ field, label, error, wide, children }: FieldProps) {
  return (
    <div className={`field${wide ? " field-wide" : ""}`}>
      <label htmlFor={`trip-${field}`} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`trip-${field}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

const FIELD_ORDER: TripField[] = ["date", "distance", "origin", "destination", "purpose"];

function focusFirstError(form: HTMLFormElement, errors: TripFieldErrors) {
  const first = FIELD_ORDER.find((field) => errors[field]);
  if (first) form.querySelector<HTMLElement>(`#trip-${first}`)?.focus();
}
