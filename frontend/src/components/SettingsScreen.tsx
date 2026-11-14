import { type FormEvent, useState } from "react";
import { useAsync } from "../hooks/useAsync";
import type { DistanceUnit, UserSettings } from "../models/settings";
import { useDistanceUnit } from "../settings/DistanceUnitContext";
import { AppShell } from "./AppShell";
import { Card } from "./ui/Card";
import { ErrorState, Loading } from "./ui/States";

const UNIT_OPTIONS: { value: DistanceUnit; label: string }[] = [
  { value: "mi", label: "Miles" },
  { value: "km", label: "Kilometers" },
];

/** The user's account settings: the unit every distance is shown in. */
export function SettingsScreen() {
  const { services } = useDistanceUnit();
  const settings = useAsync(() => services.fetchSettings(), [services]);

  return (
    <AppShell active="settings" title="Settings" description="Preferences saved to your account.">
      {settings.status === "loading" && <Loading label="Loading your settings…" />}
      {settings.status === "error" && (
        <ErrorState title="Could not load your settings" message={settings.error.message} onRetry={settings.reload} />
      )}
      {settings.status === "ready" && <SettingsForm saved={settings.data} />}
    </AppShell>
  );
}

function SettingsForm({ saved }: { saved: UserSettings }) {
  const { saveUnit } = useDistanceUnit();
  const [unit, setUnit] = useState<DistanceUnit>(saved.distanceUnit);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      await saveUnit(unit);
      setResult({ ok: true, message: "Settings saved." });
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "Could not save the settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Display" description="How distances are shown across the app." className="form-card">
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="settings-distance-unit" className="label">
            Distance unit
          </label>
          <select
            id="settings-distance-unit"
            name="distanceUnit"
            className="input"
            value={unit}
            onChange={(e) => setUnit(e.target.value as DistanceUnit)}
          >
            {UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {result && (
          <p role={result.ok ? "status" : "alert"} className={result.ok ? "muted" : "field-error"}>
            {result.message}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="button button-primary" disabled={saving} aria-busy={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </Card>
  );
}
