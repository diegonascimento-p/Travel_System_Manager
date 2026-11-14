import type { UserProfile } from "../models/UserProfile.js";
import type { UserIdentityRepository } from "../repositories/UserIdentityRepository.js";
import type { UserProfileRepository } from "../repositories/UserProfileRepository.js";
import type { Geocoder } from "./Geocoder.js";

export const MAX_BASE_ADDRESS_LENGTH = 300;

/** The profile settings were rejected; `fields` holds the message per invalid field. */
export class UserProfileValidationError extends Error {
  constructor(readonly fields: Record<string, string>) {
    super("The settings are invalid");
  }
}

const EMPTY_PROFILE: UserProfile = { baseAddress: null };

/** Reads and saves the signed-in user's profile settings. */
export class UserProfileService {
  constructor(
    private readonly identities: UserIdentityRepository,
    private readonly profiles: UserProfileRepository,
    private readonly geocoder: Geocoder,
  ) {}

  async getProfile(accessToken: string): Promise<UserProfile> {
    return (await this.getUserProfile(accessToken)).profile;
  }

  /** The signed-in user's id together with their profile. */
  async getUserProfile(accessToken: string): Promise<{ userId: string; profile: UserProfile }> {
    const userId = await this.identities.findUserId(accessToken);
    return { userId, profile: (await this.profiles.findByUserId(userId)) ?? EMPTY_PROFILE };
  }

  /** Validates and saves the settings, replacing the previous values. An empty base address clears it. */
  async updateProfile(accessToken: string, input: unknown): Promise<UserProfile> {
    const baseAddress = parseBaseAddress(input);
    if (baseAddress !== null && !(await this.geocoder.geocode(baseAddress))) {
      throw new UserProfileValidationError({ baseAddress: "Google Maps could not find this address." });
    }
    const userId = await this.identities.findUserId(accessToken);
    return this.profiles.save(userId, { baseAddress });
  }
}

/** The trimmed base address from the request body; null when it is empty (clearing it). */
export function parseBaseAddress(input: unknown): string | null {
  const value = (input as { baseAddress?: unknown } | null)?.baseAddress;
  if (value === undefined) {
    throw new UserProfileValidationError({ baseAddress: "Base address is required." });
  }
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new UserProfileValidationError({ baseAddress: "Base address must be text." });
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_BASE_ADDRESS_LENGTH) {
    throw new UserProfileValidationError({
      baseAddress: `Base address must be at most ${MAX_BASE_ADDRESS_LENGTH} characters.`,
    });
  }
  return trimmed === "" ? null : trimmed;
}
