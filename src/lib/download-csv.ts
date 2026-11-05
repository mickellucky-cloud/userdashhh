/**
 * lib/download-csv.ts — client-side CSV export helper.
 *
 * Extracted from the copier dashboard so every admin surface (purchases,
 * activity, ...) can offer the same "CSV" button without re-implementing the
 * Blob/objectURL dance. Behavior unchanged from the original inline version:
 * headers come from the first row's keys, values are JSON.stringify-escaped,
 * and an empty row list produces no download at all.
 */
export function downloadCsv(name: string, rows: Array<Record<string, unknown>>): void {
  const first = rows[0];
  if (!first) return;
  const headers = Object.keys(first);
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
