export type Route =
  | { name: "dashboard" }
  | { name: "trips"; page: number }
  | { name: "newTrip" }
  | { name: "editTrip"; id: number }
  | { name: "events" }
  | { name: "notFound" };

/** Maps a URL path and query string to the screen it shows. */
export function parseRoute(pathname: string, search = ""): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return { name: "dashboard" };
  if (path === "/trips") return { name: "trips", page: pageFrom(search) };
  if (path === "/trips/new") return { name: "newTrip" };
  if (path === "/events") return { name: "events" };
  const edit = path.match(/^\/trips\/(\d+)\/edit$/);
  if (edit) return { name: "editTrip", id: Number(edit[1]) };
  return { name: "notFound" };
}

/** The URL of a screen. */
export function pathFor(route: Route): string {
  switch (route.name) {
    case "dashboard":
      return "/";
    case "trips":
      return route.page > 1 ? `/trips?page=${route.page}` : "/trips";
    case "newTrip":
      return "/trips/new";
    case "editTrip":
      return `/trips/${route.id}/edit`;
    case "events":
      return "/events";
    case "notFound":
      return "/";
  }
}

function pageFrom(search: string): number {
  const page = Number(new URLSearchParams(search).get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}
