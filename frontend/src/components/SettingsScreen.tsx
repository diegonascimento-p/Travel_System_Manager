import { type FormEvent, useState } from "react";
import { useAsync } from "../hooks/useAsync";
import type { DistanceUnit } from "../models/distanceUnit";
import { MAX_BASE_ADDRESS_LENGTH, type UserSettings } from "../models/settings";
import { signOutOfGoogle } from "../services/googleSession";
import { defaultSettingsServices, SettingsApiError, type SettingsServices } from "../services/settingsApi";
import { useDistanceUnit } from "../settings/DistanceUnitContext";
import { AppShell } from "./AppShell";
import { GoogleSignInGate } from "./GoogleSignInGate";
import { Card } from "./ui/Card";
import { ErrorState, Loading } from "./ui/States";

interface Props {
  services?: SettingsServices;
}

const UNIT_OPTIONS: { value: DistanceUnit; label: string }[] = [
  { value: "miles", label: "Miles" },
  { value: "kilometers", label: "Kilometers" },
];

/**
 * The user's settings, saved on their profile: the base address event mileage is measured from
 * and the unit every distance is shown in.
 */
export function SettingsScreen({ services = defaultSettingsServices }: Props) {
  return (
    <AppShell active="settings" title="Settings" description="Your profile settings.">
      <GoogleSignInGate>{(accessToken) => <SettingsLoader accessToken={accessToken} services={services} />}</GoogleSignInGate>
    </AppShell>
  );
}

function SettingsLoader({ accessToken, services }: { accessToken: string; services: SettingsServices }) {
  const { applyUnit } = useDistanceUnit();
  const settings = useAsync(() => services.fetchSettings(accessToken), [services, accessToken]);
  if (settings.status === "loading") return <Loading label="Loading your settings…" />;
  if (settings.status === "error") {
    return <ErrorState title="Could not load your settings" message={settings.error.message} onRetry={settings.reload} />;
  }
  return (
    <SettingsForm
      initial={settings.data}
      onSave={async (values) => {
        const saved = await services.saveSettings(accessToken, values);
        applyUnit(saved.distanceUnit);
        return saved;
      }}
    />
  );
}

interface FormProps {
  initial: UserSettings;
  /** Saves the settings and returns the values stored on the profile. */
  onSave(settings: UserSettings): Promise<UserSettings>;
}

function SettingsForm({ initial, onSave }: FormProps) {
  const [value, setValue] = useState(initial.baseAddress ?? "");
  const [unit, setUnit] = useState<DistanceUnit>(initial.distanceUnit);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("saving");
    try {
      const saved = await onSave({ baseAddress: value.trim(), distanceUnit: unit });
      setValue(saved.baseAddress ?? "");
      setUnit(saved.distanceUnit);
      setStatus("saved");
    } catch (e) {
      setStatus("idle");
      setError(e instanceof SettingsApiError ? (e.fieldError ?? e.message) : "Could not save your settings.");
    }
  }

  return (
    <Card
      title="Mileage"
      description="The distance for each calendar event is the Google Maps driving distance from this address to the event's location."
      className="form-card"
      action={
        <button type="button" className="button button-outline button-sm" onClick={signOutOfGoogle}>
          Sign out
        </button>
      }
    >
      <form className="trip-form" noValidate onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="settings-base-address" className="label">
            Base address
          </label>
          <input
            id="settings-base-address"
            name="baseAddress"
            type="text"
            className="input"
            placeholder="e.g. 1 Main St, Springfield"
            autoComplete="street-address"
            maxLength={MAX_BASE_ADDRESS_LENGTH}
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "settings-base-address-error" : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setStatus("idle");
            }}
          />
          {error && (
            <p id="settings-base-address-error" className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="settings-distance-unit" className="label">
            Distance unit
          </label>
          <select
            id="settings-distance-unit"
            name="distanceUnit"
            className="input"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as DistanceUnit);
              setStatus("idle");
            }}
          >
            {UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="muted">Every distance in the app is shown in this unit.</p>
        </div>
        <div className="form-actions">
          {status === "saved" && <p role="status">Settings saved.</p>}
          <button type="submit" className="button button-primary" disabled={status === "saving"} aria-busy={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Card>
  );
}
