import { describe, expect, it } from "vitest";
import { SqliteUserProfileRepository } from "../src/repositories/SqliteUserProfileRepository.js";
import { migratedDatabase } from "./tripDatabase.js";

describe("SqliteUserProfileRepository", () => {
  it("creates, replaces and clears a user's base address and stores their distance unit", async () => {
    const repository = new SqliteUserProfileRepository(migratedDatabase());

    await expect(repository.findByUserId("alice@example.com")).resolves.toBeNull();
    await repository.save("alice@example.com", { baseAddress: "1 Main St", distanceUnit: "miles" });
    await repository.save("bob@example.com", { baseAddress: "9 Elm St", distanceUnit: "kilometers" });
    await expect(repository.save("alice@example.com", { baseAddress: "2 Oak Ave", distanceUnit: "kilometers" })).resolves.toEqual({
      baseAddress: "2 Oak Ave",
      distanceUnit: "kilometers",
    });

    await expect(repository.findByUserId("alice@example.com")).resolves.toEqual({ baseAddress: "2 Oak Ave", distanceUnit: "kilometers" });
    await expect(repository.findByUserId("bob@example.com")).resolves.toEqual({ baseAddress: "9 Elm St", distanceUnit: "kilometers" });

    await repository.save("alice@example.com", { baseAddress: null, distanceUnit: "miles" });
    await expect(repository.findByUserId("alice@example.com")).resolves.toEqual({ baseAddress: null, distanceUnit: "miles" });
  });
});
