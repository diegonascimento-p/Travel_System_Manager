import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DistanceUnit, UserSettings } from "../models/settings";
import type { SettingsServices } from "../services/settingsApi";
import { DistanceUnitProvider } from "../settings/DistanceUnitContext";

/** SettingsServices keeping the account's settings in memory; every method is a spy. */
export function fakeSettingsServices(distanceUnit: DistanceUnit = "mi") {
  const store: { saved: UserSettings } = { saved: { distanceUnit } };
  return {
    store,
    fetchSettings: vi.fn(async (): Promise<UserSettings> => ({ ...store.saved })),
    saveSettings: vi.fn(async (settings: UserSettings): Promise<UserSettings> => {
      store.saved = { ...settings };
      return { ...settings };
    }),
  } satisfies SettingsServices & { store: { saved: UserSettings } };
}

/** Renders the element with the account's distance unit set to `unit`. */
export function renderWithUnit(ui: ReactElement, unit: DistanceUnit, services = fakeSettingsServices(unit)) {
  return render(<DistanceUnitProvider services={services}>{ui}</DistanceUnitProvider>);
}
