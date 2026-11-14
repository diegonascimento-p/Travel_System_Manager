import { fetchSettings, saveSettings } from "./settingsApi";

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("settings API service", () => {
  it("loads the account's settings", async () => {
    const fetchMock = stubFetch(200, { distanceUnit: "km" });
    await expect(fetchSettings()).resolves.toEqual({ distanceUnit: "km" });
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.anything());
  });

  it("saves the settings with PUT", async () => {
    const fetchMock = stubFetch(200, { distanceUnit: "mi" });
    await expect(saveSettings({ distanceUnit: "mi" })).resolves.toEqual({ distanceUnit: "mi" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ distanceUnit: "mi" }) }),
    );
  });

  it("reports the server's error message", async () => {
    stubFetch(400, { error: "The settings are invalid" });
    await expect(saveSettings({ distanceUnit: "mi" })).rejects.toThrow("The settings are invalid");
  });

  it("reports when the server cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    await expect(fetchSettings()).rejects.toThrow("Could not reach the server");
  });
});
