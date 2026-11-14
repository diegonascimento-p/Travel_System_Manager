import { type DependencyList, useCallback, useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; data: T };

/** Runs `load` when the dependencies change and tracks its result; `reload` runs it again. */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> & { reload(): void } {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    load().then(
      (data) => active && setState({ status: "ready", data }),
      (error: unknown) =>
        active && setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      active = false;
    };
    // `load` is recreated on every render; the caller lists what it depends on in `deps`.
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
