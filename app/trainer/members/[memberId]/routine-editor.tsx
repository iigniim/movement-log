"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ROUTINE_CATEGORIES } from "@/lib/assessment";
import { needsWeightInput } from "@/lib/format";
import type { Exercise } from "@/lib/types";
import { addRoutineItem, deleteRoutineItem, updateRoutineItem } from "./session/actions";

export type RoutineEditorItem = {
  id: string;
  exerciseId: string;
  exercise: Exercise | null;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  cautionNote: string | null;
  weightKg: number | null;
};

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function defaultUnitsFor(exercise: Exercise): {
  reps: number | null;
  durationSeconds: number | null;
} {
  return exercise.unit_type === "duration"
    ? { reps: null, durationSeconds: 30 }
    : { reps: 10, durationSeconds: null };
}

// 활성 루틴의 운동 교체·삭제·추가·세트/횟수/무게 수정 UI. 체크리스트 편집
// 모드와 트레이너용 루틴 카드의 "수정" 모드가 동일한 로직(서버 액션 호출,
// 무게 미입력 경고/저지)을 공유하도록 뽑아낸 공용 컴포넌트다.
export function RoutineEditor({
  memberId,
  routineId,
  items,
  onItemsChange,
  onDone,
}: {
  memberId: string;
  routineId: string;
  items: RoutineEditorItem[];
  onItemsChange: (items: RoutineEditorItem[]) => void;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [swapCategory, setSwapCategory] = useState("");
  const [swapExercises, setSwapExercises] = useState<Exercise[] | null>(null);

  const [adding, setAdding] = useState(false);
  const [addCategory, setAddCategory] = useState("");
  const [addExercises, setAddExercises] = useState<Exercise[] | null>(null);
  const [addSelectedExerciseId, setAddSelectedExerciseId] = useState("");
  const [addWeightKg, setAddWeightKg] = useState<number | null>(null);

  function updateItemLocal(id: string, patch: Partial<RoutineEditorItem>) {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function handleSetsChange(id: string, sets: number) {
    updateItemLocal(id, { sets });
    const result = await updateRoutineItem(memberId, id, { sets });
    if (!result.ok) setError(result.error);
  }

  async function handleRepsChange(id: string, reps: number) {
    updateItemLocal(id, { reps });
    const result = await updateRoutineItem(memberId, id, { reps });
    if (!result.ok) setError(result.error);
  }

  async function handleDurationChange(id: string, durationSeconds: number) {
    updateItemLocal(id, { durationSeconds });
    const result = await updateRoutineItem(memberId, id, { durationSeconds });
    if (!result.ok) setError(result.error);
  }

  async function handleWeightChange(id: string, weightKg: number | null) {
    updateItemLocal(id, { weightKg });
    const result = await updateRoutineItem(memberId, id, { weightKg });
    if (!result.ok) setError(result.error);
  }

  function openSwap(item: RoutineEditorItem) {
    if (swappingId === item.id) {
      closeSwap();
      return;
    }
    setSwappingId(item.id);
    setSwapCategory("");
    setSwapExercises(null);
  }

  function closeSwap() {
    setSwappingId(null);
    setSwapCategory("");
    setSwapExercises(null);
  }

  async function handleSwapCategoryChange(category: string) {
    setSwapCategory(category);
    setSwapExercises(null);
    if (!category) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("exercise_library")
      .select("*")
      .eq("category", category)
      .returns<Exercise[]>();
    setSwapExercises(data ?? []);
  }

  async function handleSwapSelect(itemId: string, newExerciseId: string, options: Exercise[]) {
    const newExercise = options.find((c) => c.id === newExerciseId);
    if (!newExercise) return;
    const units = defaultUnitsFor(newExercise);
    const cautionNote = newExercise.default_caution ?? "";

    const result = await updateRoutineItem(memberId, itemId, {
      exerciseId: newExercise.id,
      cautionNote,
      weightKg: null,
      ...units,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    updateItemLocal(itemId, {
      exerciseId: newExercise.id,
      exercise: newExercise,
      cautionNote,
      weightKg: null,
      ...units,
    });
    closeSwap();
  }

  async function handleDelete(itemId: string) {
    const result = await deleteRoutineItem(memberId, itemId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onItemsChange(items.filter((it) => it.id !== itemId));
  }

  async function handleAddCategoryChange(category: string) {
    setAddCategory(category);
    setAddExercises(null);
    setAddSelectedExerciseId("");
    setAddWeightKg(null);
    if (!category) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("exercise_library")
      .select("*")
      .eq("category", category)
      .returns<Exercise[]>();
    setAddExercises(data ?? []);
  }

  async function handleAddExercise(exerciseId: string) {
    const exercise = (addExercises ?? []).find((c) => c.id === exerciseId);
    if (!exercise) return;
    const units = defaultUnitsFor(exercise);
    const cautionNote = exercise.default_caution ?? "";
    const weightKg = needsWeightInput(exercise.equipment) ? addWeightKg : null;

    const result = await addRoutineItem(memberId, routineId, {
      exerciseId: exercise.id,
      sets: 3,
      cautionNote,
      weightKg,
      ...units,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onItemsChange([
      ...items,
      {
        id: result.item.id,
        exerciseId: exercise.id,
        exercise,
        sets: 3,
        cautionNote,
        weightKg,
        ...units,
      },
    ]);
    setAdding(false);
    setAddCategory("");
    setAddExercises(null);
    setAddSelectedExerciseId("");
    setAddWeightKg(null);
  }

  const usedExerciseIds = new Set(items.map((it) => it.exerciseId));
  const addableExercises = (addExercises ?? []).filter((c) => !usedExerciseIds.has(c.id));
  const addSelectedExercise = addableExercises.find((c) => c.id === addSelectedExerciseId) ?? null;
  const addMissingWeight = needsWeightInput(addSelectedExercise?.equipment) && addWeightKg == null;
  const hasMissingWeight = items.some(
    (it) => needsWeightInput(it.exercise?.equipment) && it.weightKg == null,
  );

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {items.map((item) => {
        const swapOptions = (swapExercises ?? []).filter(
          (c) => c.id === item.exerciseId || !usedExerciseIds.has(c.id),
        );
        return (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>
                {item.exercise?.name_ko ?? item.exercise?.name_en ?? "알 수 없는 운동"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">세트</label>
                  <Input
                    type="number"
                    min={1}
                    value={item.sets ?? 1}
                    onChange={(e) => handleSetsChange(item.id, Number(e.target.value) || 1)}
                    className="w-16"
                  />
                </div>
                {needsWeightInput(item.exercise?.equipment) && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">무게(kg)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={item.weightKg ?? ""}
                      onChange={(e) =>
                        handleWeightChange(
                          item.id,
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className="w-20"
                    />
                  </div>
                )}
                {item.durationSeconds != null ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">유지 시간(초)</label>
                    <Input
                      type="number"
                      min={1}
                      value={item.durationSeconds}
                      onChange={(e) =>
                        handleDurationChange(item.id, Number(e.target.value) || 1)
                      }
                      className="w-20"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">횟수</label>
                    <Input
                      type="number"
                      min={1}
                      value={item.reps ?? 1}
                      onChange={(e) => handleRepsChange(item.id, Number(e.target.value) || 1)}
                      className="w-20"
                    />
                  </div>
                )}
              </div>

              {needsWeightInput(item.exercise?.equipment) && item.weightKg == null && (
                <p className="text-xs text-destructive/70">⚠️ 무게가 입력되지 않았습니다</p>
              )}

              {item.cautionNote && (
                <p className="text-xs text-muted-foreground">주의: {item.cautionNote}</p>
              )}

              {swappingId === item.id ? (
                <div className="space-y-2">
                  <select
                    autoFocus
                    value={swapCategory}
                    onChange={(e) => handleSwapCategoryChange(e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>
                      카테고리
                    </option>
                    {ROUTINE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {swapCategory &&
                    (swapExercises === null ? (
                      <p className="text-xs text-muted-foreground">불러오는 중...</p>
                    ) : swapOptions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        선택할 수 있는 운동이 없습니다.
                      </p>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => handleSwapSelect(item.id, e.target.value, swapOptions)}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          운동 선택
                        </option>
                        {swapOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_ko ?? c.name_en}
                          </option>
                        ))}
                      </select>
                    ))}

                  <div>
                    <Button type="button" variant="ghost" size="sm" onClick={closeSwap}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openSwap(item)}
                  >
                    다른 운동으로 교체
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="space-y-3">
          {!adding ? (
            <Button type="button" variant="outline" onClick={() => setAdding(true)}>
              운동 추가
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">카테고리</label>
                <select
                  value={addCategory}
                  onChange={(e) => handleAddCategoryChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    선택
                  </option>
                  {ROUTINE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {addCategory &&
                (addExercises === null ? (
                  <p className="text-xs text-muted-foreground">불러오는 중...</p>
                ) : addableExercises.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    추가할 수 있는 운동이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={addSelectedExerciseId}
                      onChange={(e) => {
                        setAddSelectedExerciseId(e.target.value);
                        setAddWeightKg(null);
                      }}
                      className={selectClass}
                    >
                      <option value="" disabled>
                        운동 선택
                      </option>
                      {addableExercises.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_ko ?? c.name_en}
                        </option>
                      ))}
                    </select>

                    {needsWeightInput(addSelectedExercise?.equipment) && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">무게(kg)</label>
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          value={addWeightKg ?? ""}
                          onChange={(e) =>
                            setAddWeightKg(
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          className="w-20"
                        />
                      </div>
                    )}

                    {addMissingWeight && (
                      <p className="text-xs text-destructive/70">
                        ⚠️ 무게가 입력되지 않았습니다
                      </p>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      disabled={!addSelectedExerciseId || addMissingWeight}
                      onClick={() => handleAddExercise(addSelectedExerciseId)}
                    >
                      추가
                    </Button>
                  </div>
                ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setAddCategory("");
                  setAddExercises(null);
                  setAddSelectedExerciseId("");
                  setAddWeightKg(null);
                }}
              >
                취소
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <Button size="lg" className="w-full" disabled={hasMissingWeight} onClick={onDone}>
          수정완료
        </Button>
        {hasMissingWeight && (
          <p className="text-center text-xs text-destructive/70">
            무게를 입력하지 않은 운동이 있습니다
          </p>
        )}
      </div>
    </div>
  );
}
