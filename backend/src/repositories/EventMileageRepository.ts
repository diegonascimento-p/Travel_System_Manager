import type { EventMileage } from "../models/EventMileage.js";

export interface EventMileageRepository {
  /** The saved mileage of the user's events among `eventIds`, keyed by event id. */
  findByEventIds(userId: string, eventIds: string[]): Promise<Map<string, EventMileage>>;
  /** Creates or replaces the saved mileage of each event. */
  saveAll(userId: string, mileages: EventMileage[]): Promise<void>;
}
