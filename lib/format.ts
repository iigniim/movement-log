export function formatHealthUpdatesForPrompt(
  updates: { note: string; created_at: string }[],
): string {
  if (updates.length === 0) return "없음";
  return updates.map((u) => `- ${u.created_at.slice(0, 10)}: ${u.note}`).join("\n");
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatRoutineName(routine: {
  name: string | null;
  target_categories: string[] | null;
}): string {
  return routine.name || (routine.target_categories ?? []).join("·") || "카테고리 없음";
}

export function formatSetsReps(
  sets: number | null,
  reps: number | null,
  durationSeconds: number | null,
  weightKg?: number | null,
) {
  const detail = durationSeconds != null ? `${durationSeconds}초 유지` : `${reps}회`;
  const base = sets != null ? `${sets}세트 × ${detail}` : detail;
  return weightKg != null ? `${base} · ${weightKg}kg` : base;
}

const BODYWEIGHT_EQUIPMENT = new Set(["Bodyweight", "Bands"]);

export function needsWeightInput(equipment: string | null | undefined): boolean {
  return !!equipment && !BODYWEIGHT_EQUIPMENT.has(equipment);
}
