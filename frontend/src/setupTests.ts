import "@testing-library/jest-dom/vitest";
import { act } from "@testing-library/react";
import { setGoogleAccessToken } from "./services/googleSession";

// The Google session is module state shared by every screen; each test starts signed out.
afterEach(() => act(() => setGoogleAccessToken(null)));
