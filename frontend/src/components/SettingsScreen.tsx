import { type FormEvent, useState } from "react";
import { useAsync } from "../hooks/useAsync";
import { MAX_BASE_ADDRESS_LENGTH } from "../models/settings";
import { signOutOfGoogle } from "../services/googleSession";
import { defaultSettingsServices, SettingsApiError, type SettingsServices } from "../services/settingsApi";
import { AppShell } from "./AppShell";
import { GoogleSignInGate } from "./GoogleSignInGate";
import { Card } from "./ui/Card";
import { ErrorState, Loading } from "./ui/States";

interface Props {
  services?: SettingsServices;
}

/** The user's settings, saved on their profile: the base address event mileage is measured from. */
export function SettingsScreen({ services = defaultSettingsServices }: Props) {
  return (
    <AppShell active="settings" title="Settings" description="Your profile settings.">
      <GoogleSignInGate>{(accessToken) => <SettingsLoader accessToken={accessToken} services={services} />}</GoogleSignInGate>
    </AppShell>
  );
}

function SettingsLoader({ accessToken, services }: { accessToken: string; services: SettingsServices }) {
  const settings = useAsync(() => services.fetchSettings(accessToken), [services, accessToken]);
  if (settings.status === "loading") return <Loading label="Loading your settings…" />;
  if (settings.status === "error") {
    return <ErrorState title="Could not load your settings" message={settings.error.message} onRetry={settings.reload} />;
  }
  return (
    <BaseAddressForm
      initial={settings.data.baseAddress ?? ""}
      onSave={async (baseAddress) => (await services.saveSettings(accessToken, { baseAddress })).baseAddress ?? ""}
    />
  );
}

interface FormProps {
  initial: string;
  /** Saves the address and returns the value stored on the profile. */
  onSave(baseAddress: string): Promise<string>;
}

function BaseAddressForm({ initial, onSave }: FormProps) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("saving");
    try {
      setValue(await onSave(value.trim()));
      setStatus("saved");
    } catch (e) {
      setStatus("idle");
      setError(e instanceof SettingsApiError ? (e.fieldError ?? e.message) : "Could not save your settings.");
    }
  }

  return (
    <Card
      title="Mileage"
      description="Miles for each calendar event are the Google Maps driving distance from this address to the event's location."
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
        <div className="form-actions">
          {status === "saved" && <p role="status">Base address saved.</p>}
          <button type="submit" className="button button-primary" disabled={status === "saving"} aria-busy={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Card>
  );
}
