import { describe, expect, it } from "vitest";
import { validateSettingsInput } from "../src/services/settingsRules.js";

describe("validateSettingsInput", () => {
  it.each(["mi", "km"])("accepts %s as distance unit", (unit) => {
    expect(validateSettingsInput({ distanceUnit: unit })).toEqual({ ok: true, value: { distanceUnit: unit } });
  });

  it.each([undefined, null, "miles", "KM", "yd", 1])("rejects %s as distance unit", (unit) => {
    expect(validateSettingsInput({ distanceUnit: unit })).toEqual({
      ok: false,
      errors: { distanceUnit: 'Distance unit must be "mi" or "km".' },
    });
  });

  it("rejects a body that is not an object", () => {
    expect(validateSettingsInput(null).ok).toBe(false);
    expect(validateSettingsInput("km").ok).toBe(false);
  });
});
