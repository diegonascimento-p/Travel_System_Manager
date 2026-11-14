import { parseRoute, pathFor } from "./routes";

describe("parseRoute", () => {
  it.each([
    ["/", "", { name: "dashboard" }],
    ["/trips", "", { name: "trips", page: 1 }],
    ["/trips/", "?page=3", { name: "trips", page: 3 }],
    ["/trips", "?page=abc", { name: "trips", page: 1 }],
    ["/trips/new", "", { name: "newTrip" }],
    ["/trips/12/edit", "", { name: "editTrip", id: 12 }],
    ["/events", "", { name: "events" }],
    ["/settings", "", { name: "settings" }],
    ["/trips/abc/edit", "", { name: "notFound" }],
    ["/candidates", "", { name: "notFound" }],
  ])("maps %s%s to its screen", (path, search, route) => {
    expect(parseRoute(path, search)).toEqual(route);
  });
});

describe("pathFor", () => {
  it("builds the URL of each screen", () => {
    expect(pathFor({ name: "trips", page: 1 })).toBe("/trips");
    expect(pathFor({ name: "trips", page: 2 })).toBe("/trips?page=2");
    expect(pathFor({ name: "editTrip", id: 4 })).toBe("/trips/4/edit");
  });
});
