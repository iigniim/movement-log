export function formatHealthUpdatesForPrompt(
  updates: { note: string; created_at: string }[],
): string {
  if (updates.length === 0) return "없음";
  return updates.map((u) => `- ${u.created_at.slice(0, 10)}: ${u.note}`).join("\n");
}

export function formatDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
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
