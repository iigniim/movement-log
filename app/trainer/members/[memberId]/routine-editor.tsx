"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ROUTINE_CATEGORIES } from "@/lib/assessment";
import { needsWeightInput } from "@/lib/format";
import type { Exercise } from "@/lib/types";

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

// 운동 교체·삭제·추가·세트/횟수/무게 수정 UI. 순수 클라이언트 로컬 상태만
// 바꾸고 서버에는 아무것도 즉시 반영하지 않는다 - 실제 저장은 이 화면을
// 감싸는 쪽(체크리스트의 "수업 완료")에서 한 번에 이뤄진다.
export function RoutineEditor({
  items,
  onItemsChange,
  onDone,
}: {
  items: RoutineEditorItem[];
  onItemsChange: (items: RoutineEditorItem[]) => void;
  onDone: () => void;
}) {
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

  function handleSwapSelect(itemId: string, newExerciseId: string, options: Exercise[]) {
    const newExercise = options.find((c) => c.id === newExerciseId);
    if (!newExercise) return;
    const units = defaultUnitsFor(newExercise);
    updateItemLocal(itemId, {
      exerciseId: newExercise.id,
      exercise: newExercise,
      cautionNote: newExercise.default_caution ?? "",
      weightKg: null,
      ...units,
    });
    closeSwap();
  }

  function handleDelete(itemId: string) {
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

  function handleAddExercise(exerciseId: string) {
    const exercise = (addExercises ?? []).find((c) => c.id === exerciseId);
    if (!exercise) return;
    const units = defaultUnitsFor(exercise);
    const weightKg = needsWeightInput(exercise.equipment) ? addWeightKg : null;

    onItemsChange([
      ...items,
      {
        id: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        exercise,
        sets: 3,
        cautionNote: exercise.default_caution ?? "",
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
                    onChange={(e) =>
                      updateItemLocal(item.id, { sets: Number(e.target.value) || 1 })
                    }
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
                        updateItemLocal(item.id, {
                          weightKg: e.target.value === "" ? null : Number(e.target.value),
                        })
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
                        updateItemLocal(item.id, {
                          durationSeconds: Number(e.target.value) || 1,
                        })
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
                      onChange={(e) =>
                        updateItemLocal(item.id, { reps: Number(e.target.value) || 1 })
                      }
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
