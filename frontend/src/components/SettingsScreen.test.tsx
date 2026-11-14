import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeSettingsServices, renderWithUnit } from "../testing/fakeSettingsServices";
import { SettingsScreen } from "./SettingsScreen";

describe("SettingsScreen", () => {
  it("shows a Distance unit option with the choices Miles and Kilometers", async () => {
    renderWithUnit(<SettingsScreen />, "mi");

    const unit = await screen.findByRole("combobox", { name: "Distance unit" });
    expect(within(unit).getAllByRole("option").map((option) => option.textContent)).toEqual(["Miles", "Kilometers"]);
    expect(unit).toHaveDisplayValue("Miles");
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("saves the chosen unit only when the user saves, and shows it selected when reopened", async () => {
    const services = fakeSettingsServices("mi");
    const { unmount } = renderWithUnit(<SettingsScreen />, "mi", services);

    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Distance unit" }), "Kilometers");
    expect(services.saveSettings).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Settings saved.");
    expect(services.saveSettings).toHaveBeenCalledWith({ distanceUnit: "km" });
    unmount();

    renderWithUnit(<SettingsScreen />, "mi", services);
    expect(await screen.findByRole("combobox", { name: "Distance unit" })).toHaveDisplayValue("Kilometers");
  });

  it("explains when the settings could not be saved", async () => {
    const services = fakeSettingsServices("mi");
    services.saveSettings.mockRejectedValueOnce(new Error("The server answered with status 500."));
    renderWithUnit(<SettingsScreen />, "mi", services);

    await userEvent.click(await screen.findByRole("button", { name: "Save settings" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The server answered with status 500.");
  });

  it("shows an error state when the settings cannot be loaded", async () => {
    const services = fakeSettingsServices("mi");
    services.fetchSettings.mockRejectedValue(new Error("Could not reach the server."));
    renderWithUnit(<SettingsScreen />, "mi", services);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your settings");
  });
});
