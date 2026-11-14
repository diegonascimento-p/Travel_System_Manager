import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DistanceUnit } from "../models/distanceUnit";
import type { UserSettings } from "../models/settings";
import { setGoogleAccessToken } from "../services/googleSession";
import type { SettingsServices } from "../services/settingsApi";
import { DistanceUnitProvider } from "../settings/DistanceUnitContext";

/** SettingsServices keeping the account's settings in memory; every method is a spy. */
export function fakeSettingsServices(initial: Partial<UserSettings> = {}) {
  const store: { saved: UserSettings } = { saved: { baseAddress: null, distanceUnit: "miles", ...initial } };
  return {
    store,
    fetchSettings: vi.fn(async (_accessToken: string): Promise<UserSettings> => ({ ...store.saved })),
    saveSettings: vi.fn(async (_accessToken: string, settings: UserSettings): Promise<UserSettings> => {
      store.saved = { ...settings };
      return { ...settings };
    }),
  } satisfies SettingsServices & { store: { saved: UserSettings } };
}

/** Renders the element for a signed-in user whose account's distance unit is `unit`. */
export function renderWithUnit(ui: ReactElement, unit: DistanceUnit, services = fakeSettingsServices({ distanceUnit: unit })) {
  setGoogleAccessToken("token");
  return render(<DistanceUnitProvider services={services}>{ui}</DistanceUnitProvider>);
}
