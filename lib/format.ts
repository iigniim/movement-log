export function formatSetsReps(
  sets: number | null,
  reps: number | null,
  durationSeconds: number | null,
) {
  const detail = durationSeconds != null ? `${durationSeconds}초 유지` : `${reps}회`;
  return sets != null ? `${sets}세트 × ${detail}` : detail;
}
