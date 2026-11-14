import { emptyTripForm, tripToForm, validateTripForm } from "./tripForm";

const values = {
  date: "2026-11-03",
  origin: "Office",
  destination: "Acme HQ",
  distance: "42.5",
  purpose: "Client visit",
};

describe("validateTripForm", () => {
  it("converts a complete form into a trip, trimming text and parsing the distance", () => {
    expect(validateTripForm({ ...values, origin: " Office ", distance: " 42.5 " })).toEqual({
      ok: true,
      input: { date: "2026-11-03", origin: "Office", destination: "Acme HQ", distance: 42.5, purpose: "Client visit" },
    });
  });

  it("requires every field", () => {
    expect(validateTripForm({ date: "", origin: "", destination: " ", distance: "", purpose: "" })).toEqual({
      ok: false,
      errors: {
        date: "Date is required.",
        origin: "Origin is required.",
        destination: "Destination is required.",
        distance: "Distance is required.",
        purpose: "Purpose is required.",
      },
    });
  });

  it.each([["abc"], ["12 miles"], ["1,5"], ["--1"], ["Infinity"]])("rejects the non-numeric distance %s", (distance) => {
    expect(validateTripForm({ ...values, distance })).toEqual({
      ok: false,
      errors: { distance: "Distance must be a number." },
    });
  });

  it.each([["0"], ["-4"]])("rejects the non-positive distance %s", (distance) => {
    expect(validateTripForm({ ...values, distance })).toEqual({
      ok: false,
      errors: { distance: "Distance must be greater than zero." },
    });
  });

  it("accepts decimal distances up to 100,000 miles", () => {
    expect(validateTripForm({ ...values, distance: ".5" }).ok).toBe(true);
    expect(validateTripForm({ ...values, distance: "100000" }).ok).toBe(true);
    expect(validateTripForm({ ...values, distance: "100000.1" }).ok).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(validateTripForm({ ...values, date: "2026-02-30" })).toEqual({
      ok: false,
      errors: { date: "Enter a valid date." },
    });
  });

  it("limits text lengths like the API", () => {
    const result = validateTripForm({ ...values, origin: "x".repeat(201), purpose: "y".repeat(501) });
    expect(!result.ok && Object.keys(result.errors)).toEqual(["origin", "purpose"]);
  });
});

describe("form values", () => {
  it("starts empty on the given date", () => {
    expect(emptyTripForm("2026-11-14")).toEqual({ date: "2026-11-14", origin: "", destination: "", distance: "", purpose: "" });
  });

  it("fills the form from an existing trip", () => {
    const trip = { id: 7, date: "2026-11-03", origin: "Office", destination: "Acme HQ", distance: 42.5, purpose: "Client visit" };
    expect(tripToForm(trip)).toEqual(values);
  });
});
