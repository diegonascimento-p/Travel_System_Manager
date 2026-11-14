import { useMemo, useState } from "react";
import { selectableYears } from "../utils/years";

interface Props {
  onDownload(year: number): Promise<void>;
}

export function DownloadPdfControl({ onDownload }: Props) {
  const years = useMemo(() => selectableYears(), []);
  const [year, setYear] = useState(years[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await onDownload(year);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="download-pdf">
      <label>
        Year{" "}
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>{" "}
      <button type="button" onClick={handleClick} disabled={busy} aria-busy={busy}>
        Download PDF
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
