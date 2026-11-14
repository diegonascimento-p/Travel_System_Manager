import { fetchSettings, saveSettings, SettingsApiError } from "./settingsApi";

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("settings API service", () => {
  it("loads the settings with the Google access token", async () => {
    const fetchMock = stubFetch(200, { baseAddress: "1 Main St", distanceUnit: "kilometers" });

    await expect(fetchSettings("token")).resolves.toEqual({ baseAddress: "1 Main St", distanceUnit: "kilometers" });

    expect(fetchMock).toHaveBeenCalledWith("/api/settings", {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    });
  });

  it("saves the settings with a JSON PUT", async () => {
    const fetchMock = stubFetch(200, { baseAddress: "2 Oak Ave", distanceUnit: "miles" });

    await expect(saveSettings("token", { baseAddress: "2 Oak Ave", distanceUnit: "miles" })).resolves.toEqual({ baseAddress: "2 Oak Ave", distanceUnit: "miles" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ baseAddress: "2 Oak Ave", distanceUnit: "miles" }) }),
    );
  });

  it("reports why the base address was rejected", async () => {
    stubFetch(400, { error: "The settings are invalid", fields: { baseAddress: "OpenStreetMap could not find this address. Check the spelling or add the city and country." } });

    const error = await saveSettings("token", { baseAddress: "Atlantis", distanceUnit: "miles" }).catch((e) => e);

    expect(error).toBeInstanceOf(SettingsApiError);
    expect(error.fieldError).toBe("OpenStreetMap could not find this address. Check the spelling or add the city and country.");
  });

  it("asks the user to sign in again when the token expired", async () => {
    stubFetch(401, { error: "Google Calendar access was denied" });
    await expect(fetchSettings("old")).rejects.toThrow("Your Google sign-in expired. Sign in again.");
  });
});
