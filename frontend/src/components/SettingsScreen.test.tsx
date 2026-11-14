import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserSettings } from "../models/settings";
import { setGoogleAccessToken } from "../services/googleSession";
import { SettingsApiError, type SettingsServices } from "../services/settingsApi";
import { SettingsScreen } from "./SettingsScreen";

/** Profiles kept per Google account, like the API; every access token belongs to one account. */
function fakeSettingsServices(accounts: Record<string, string> = {}) {
  const profiles = new Map<string, UserSettings>();
  const account = (token: string) => accounts[token] ?? "me@example.com";
  return {
    profiles,
    fetchSettings: vi.fn(async (token: string) => profiles.get(account(token)) ?? { baseAddress: null }),
    saveSettings: vi.fn(async (token: string, settings: UserSettings) => {
      if (settings.baseAddress === "Atlantis") {
        throw new SettingsApiError("The settings are invalid", "Google Maps could not find this address.");
      }
      profiles.set(account(token), settings);
      return settings;
    }),
  } satisfies SettingsServices & { profiles: Map<string, UserSettings> };
}

const field = () => screen.findByRole("textbox", { name: "Base address" });

async function saveAddress(address: string) {
  const input = await field();
  await userEvent.clear(input);
  await userEvent.type(input, address);
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
}

afterEach(() => act(() => setGoogleAccessToken(null)));

describe("SettingsScreen", () => {
  it("asks the user to sign in with Google first", () => {
    render(<SettingsScreen services={fakeSettingsServices()} />);
    expect(screen.getByRole("heading", { name: "Connect Google Calendar" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Base address" })).not.toBeInTheDocument();
  });

  it("shows an empty Base address field to a signed-in user without one", async () => {
    setGoogleAccessToken("token");
    render(<SettingsScreen services={fakeSettingsServices()} />);
    expect(await field()).toHaveValue("");
  });

  it("saves the typed address to the profile and keeps showing it", async () => {
    setGoogleAccessToken("token");
    const services = fakeSettingsServices();
    render(<SettingsScreen services={services} />);

    await saveAddress("1 Main St, Springfield");

    expect(await screen.findByText("Base address saved.")).toBeInTheDocument();
    expect(services.saveSettings).toHaveBeenCalledWith("token", { baseAddress: "1 Main St, Springfield" });
    expect(await field()).toHaveValue("1 Main St, Springfield");
  });

  it("shows the saved address again after signing out and back in", async () => {
    setGoogleAccessToken("first-login");
    const services = fakeSettingsServices({ "first-login": "me@example.com", "second-login": "me@example.com" });
    render(<SettingsScreen services={services} />);
    await saveAddress("1 Main St, Springfield");
    await screen.findByText("Base address saved.");

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("heading", { name: "Connect Google Calendar" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Base address" })).not.toBeInTheDocument();
    act(() => setGoogleAccessToken("second-login"));

    expect(await field()).toHaveValue("1 Main St, Springfield");
    expect(services.fetchSettings).toHaveBeenLastCalledWith("second-login");
  });

  it("replaces the saved address with an edited one", async () => {
    setGoogleAccessToken("token");
    const services = fakeSettingsServices();
    services.profiles.set("me@example.com", { baseAddress: "1 Main St, Springfield" });
    render(<SettingsScreen services={services} />);
    expect(await field()).toHaveValue("1 Main St, Springfield");

    await saveAddress("2 Oak Ave, Springfield");

    await screen.findByText("Base address saved.");
    expect(services.profiles.get("me@example.com")).toEqual({ baseAddress: "2 Oak Ave, Springfield" });
    expect(await field()).toHaveValue("2 Oak Ave, Springfield");
  });

  it("explains when Google Maps cannot find the address", async () => {
    setGoogleAccessToken("token");
    render(<SettingsScreen services={fakeSettingsServices()} />);

    await saveAddress("Atlantis");

    expect(await screen.findByRole("alert")).toHaveTextContent("Google Maps could not find this address.");
    expect(await field()).toHaveAttribute("aria-invalid", "true");
  });

  it("offers a retry when the settings cannot be loaded", async () => {
    setGoogleAccessToken("token");
    const services = fakeSettingsServices();
    services.fetchSettings.mockRejectedValueOnce(new Error("Could not reach the server."));
    render(<SettingsScreen services={services} />);

    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await field()).toHaveValue("");
  });
});
