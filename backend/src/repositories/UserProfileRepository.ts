import type { UserProfile } from "../models/UserProfile.js";

export interface UserProfileRepository {
  /** The user's profile, or null when they never saved one. */
  findByUserId(userId: string): Promise<UserProfile | null>;
  /** Creates or replaces the user's profile and returns it. */
  save(userId: string, profile: UserProfile): Promise<UserProfile>;
}
