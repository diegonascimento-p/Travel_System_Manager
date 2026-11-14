import type { EventsServices } from "../controllers/yearlyEventsPdfController";
import { downloadEventsPdf } from "../pdf/downloadEventsPdf";
import { fetchEventsForYear } from "./eventsApi";

export const defaultEventsServices: EventsServices = {
  fetchEventsForYear,
  downloadEventsPdf,
};
