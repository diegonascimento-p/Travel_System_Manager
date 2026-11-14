import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_DISTANCE_UNIT, type DistanceUnit } from "../models/settings";
import { defaultSettingsServices, type SettingsServices } from "../services/settingsApi";

interface DistanceUnitState {
  /** Unit every distance is shown in. */
  unit: DistanceUnit;
  /** Saves the unit to the user's account, then applies it everywhere. */
  saveUnit(unit: DistanceUnit): Promise<void>;
  services: SettingsServices;
}

const DistanceUnitContext = createContext<DistanceUnitState>({
  unit: DEFAULT_DISTANCE_UNIT,
  saveUnit: async () => {},
  services: defaultSettingsServices,
});

interface Props {
  services?: SettingsServices;
  children: ReactNode;
}

/** Loads the account's distance unit once and shares it with every screen. */
export function DistanceUnitProvider({ services = defaultSettingsServices, children }: Props) {
  const [unit, setUnit] = useState<DistanceUnit>(DEFAULT_DISTANCE_UNIT);

  useEffect(() => {
    let active = true;
    services.fetchSettings().then(
      (settings) => active && setUnit(settings.distanceUnit),
      // Without saved settings distances stay in the default unit; screens report their own load errors.
      () => {},
    );
    return () => {
      active = false;
    };
  }, [services]);

  const saveUnit = useCallback(
    async (next: DistanceUnit) => {
      const saved = await services.saveSettings({ distanceUnit: next });
      setUnit(saved.distanceUnit);
    },
    [services],
  );

  const value = useMemo(() => ({ unit, saveUnit, services }), [unit, saveUnit, services]);
  return <DistanceUnitContext.Provider value={value}>{children}</DistanceUnitContext.Provider>;
}

/** The account's distance unit and the action that saves a new one. */
export function useDistanceUnit(): DistanceUnitState {
  return useContext(DistanceUnitContext);
}
