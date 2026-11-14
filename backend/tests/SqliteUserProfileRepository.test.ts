import { describe, expect, it } from "vitest";
import { SqliteUserProfileRepository } from "../src/repositories/SqliteUserProfileRepository.js";
import { migratedDatabase } from "./tripDatabase.js";

describe("SqliteUserProfileRepository", () => {
  it("creates, replaces and clears a user's base address", async () => {
    const repository = new SqliteUserProfileRepository(migratedDatabase());

    await expect(repository.findByUserId("alice@example.com")).resolves.toBeNull();
    await repository.save("alice@example.com", { baseAddress: "1 Main St" });
    await repository.save("bob@example.com", { baseAddress: "9 Elm St" });
    await expect(repository.save("alice@example.com", { baseAddress: "2 Oak Ave" })).resolves.toEqual({
      baseAddress: "2 Oak Ave",
    });

    await expect(repository.findByUserId("alice@example.com")).resolves.toEqual({ baseAddress: "2 Oak Ave" });
    await expect(repository.findByUserId("bob@example.com")).resolves.toEqual({ baseAddress: "9 Elm St" });

    await repository.save("alice@example.com", { baseAddress: null });
    await expect(repository.findByUserId("alice@example.com")).resolves.toEqual({ baseAddress: null });
  });
});
