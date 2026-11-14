import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_DISTANCE_UNIT, type DistanceUnit } from "../models/distanceUnit";
import { useGoogleAccessToken } from "../services/googleSession";
import { defaultSettingsServices, type SettingsServices } from "../services/settingsApi";

interface DistanceUnitState {
  /** Unit every distance is shown in. */
  unit: DistanceUnit;
  /** Applies a unit just saved to the user's account to every screen. */
  applyUnit(unit: DistanceUnit): void;
}

const DistanceUnitContext = createContext<DistanceUnitState>({
  unit: DEFAULT_DISTANCE_UNIT,
  applyUnit: () => {},
});

interface Props {
  services?: SettingsServices;
  children: ReactNode;
}

/**
 * Loads the signed-in user's distance unit from their profile and shares it with every screen.
 * Signed out, or until the profile loads, distances are shown in the default unit.
 */
export function DistanceUnitProvider({ services = defaultSettingsServices, children }: Props) {
  const accessToken = useGoogleAccessToken();
  const [unit, setUnit] = useState<DistanceUnit>(DEFAULT_DISTANCE_UNIT);

  useEffect(() => {
    setUnit(DEFAULT_DISTANCE_UNIT);
    if (!accessToken) return;
    let active = true;
    services.fetchSettings(accessToken).then(
      (settings) => active && setUnit(settings.distanceUnit),
      // Without the profile distances stay in the default unit; screens report their own load errors.
      () => {},
    );
    return () => {
      active = false;
    };
  }, [services, accessToken]);

  const value = useMemo(() => ({ unit, applyUnit: setUnit }), [unit]);
  return <DistanceUnitContext.Provider value={value}>{children}</DistanceUnitContext.Provider>;
}

/** The account's distance unit and the action that applies a newly saved one. */
export function useDistanceUnit(): DistanceUnitState {
  return useContext(DistanceUnitContext);
}
