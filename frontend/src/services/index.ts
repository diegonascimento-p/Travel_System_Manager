import type { EventsServices } from "../controllers/yearlyEventsPdfController";
import { downloadEventsPdf } from "../pdf/downloadEventsPdf";
import { fetchEventsForYear } from "./eventsApi";
import { getCurrentPosition } from "./geolocation";

export const defaultEventsServices: EventsServices = {
  getCurrentPosition,
  fetchEventsForYear,
  downloadEventsPdf,
};
