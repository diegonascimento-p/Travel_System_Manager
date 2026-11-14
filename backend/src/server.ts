import { createApp } from "./app.js";
import { GoogleCalendarEventRepository } from "./repositories/GoogleCalendarEventRepository.js";
import { GoogleGeocoder } from "./services/GoogleGeocoder.js";

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_MAPS_API_KEY must be set");
}

const port = Number(process.env.PORT ?? 3001);
const app = createApp({
  eventRepository: new GoogleCalendarEventRepository(),
  geocoder: new GoogleGeocoder(apiKey),
});

app.listen(port, () => {
  console.log(`Travel System Manager API listening on port ${port}`);
});
