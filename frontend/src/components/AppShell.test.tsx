import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("shows the sidebar navigation with the current screen highlighted, and the page header", () => {
    render(
      <AppShell active="trips" title="Trips" description="All your trips">
        content
      </AppShell>,
    );

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Trips" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Add trip" })).toHaveAttribute("href", "/trips/new");
    expect(screen.getByRole("heading", { level: 1, name: "Trips" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("content");
  });

  it("opens and closes the sidebar drawer used on mobile widths", async () => {
    const { container } = render(<AppShell active="dashboard" title="Dashboard">content</AppShell>);
    const shell = container.querySelector(".app-shell")!;
    const menu = screen.getByRole("button", { name: "Open navigation" });

    await userEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(shell).toHaveClass("menu-open");

    await userEvent.keyboard("{Escape}");
    expect(menu).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(menu);
    await userEvent.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(shell).not.toHaveClass("menu-open");
  });

  it("closes the drawer when a navigation link is followed", async () => {
    window.history.replaceState(null, "", "/");
    const { container } = render(<AppShell active="dashboard" title="Dashboard">content</AppShell>);

    await userEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    await userEvent.click(screen.getByRole("link", { name: "Trips" }));

    expect(container.querySelector(".app-shell")).not.toHaveClass("menu-open");
    expect(window.location.pathname).toBe("/trips");
  });
});
