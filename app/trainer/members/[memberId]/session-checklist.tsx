"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { ROUTINE_CATEGORIES } from "@/lib/assessment";
import { formatSetsReps } from "@/lib/format";
import type { Exercise } from "@/lib/types";
import { addRoutineItem, completeSession, deleteRoutineItem, updateRoutineItem } from "./session/actions";

export type ChecklistItem = {
  id: string;
  exerciseId: string;
  exercise: Exercise | null;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  cautionNote: string | null;
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

export function SessionChecklist({
  memberId,
  routineId,
  items: initialItems,
  justConfirmed,
  latestAssessmentId,
}: {
  memberId: string;
  routineId: string;
  items: ChecklistItem[];
  justConfirmed?: boolean;
  latestAssessmentId?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checklistRef = useRef<HTMLDivElement>(null);

  function toggleSelectAll() {
    const boxes = checklistRef.current?.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (!boxes || boxes.length === 0) return;
    const allChecked = Array.from(boxes).every((box) => box.checked);
    boxes.forEach((box) => {
      box.checked = !allChecked;
    });
  }

  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [swapCategory, setSwapCategory] = useState("");
  const [swapExercises, setSwapExercises] = useState<Exercise[] | null>(null);

  const [adding, setAdding] = useState(false);
  const [addCategory, setAddCategory] = useState("");
  const [addExercises, setAddExercises] = useState<Exercise[] | null>(null);

  function updateItemLocal(id: string, patch: Partial<ChecklistItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function handleSetsChange(id: string, sets: number) {
    updateItemLocal(id, { sets });
    const result = await updateRoutineItem(id, { sets });
    if (!result.ok) setError(result.error);
  }

  async function handleRepsChange(id: string, reps: number) {
    updateItemLocal(id, { reps });
    const result = await updateRoutineItem(id, { reps });
    if (!result.ok) setError(result.error);
  }

  async function handleDurationChange(id: string, durationSeconds: number) {
    updateItemLocal(id, { durationSeconds });
    const result = await updateRoutineItem(id, { durationSeconds });
    if (!result.ok) setError(result.error);
  }

  function openSwap(item: ChecklistItem) {
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

    const result = await updateRoutineItem(itemId, {
      exerciseId: newExercise.id,
      cautionNote,
      ...units,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    updateItemLocal(itemId, { exerciseId: newExercise.id, exercise: newExercise, cautionNote, ...units });
    closeSwap();
  }

  async function handleDelete(itemId: string) {
    const result = await deleteRoutineItem(itemId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  async function handleAddCategoryChange(category: string) {
    setAddCategory(category);
    setAddExercises(null);
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

    const result = await addRoutineItem(routineId, { exerciseId: exercise.id, sets: 3, cautionNote, ...units });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: result.item.id,
        exerciseId: exercise.id,
        exercise,
        sets: 3,
        cautionNote,
        ...units,
      },
    ]);
    setAdding(false);
    setAddCategory("");
    setAddExercises(null);
  }

  const usedExerciseIds = new Set(items.map((it) => it.exerciseId));
  const addableExercises = (addExercises ?? []).filter((c) => !usedExerciseIds.has(c.id));

  return (
    <div className="space-y-6">
      {justConfirmed && (
        <p className="text-sm text-muted-foreground">
          루틴이 저장되었습니다. 바로 오늘 수업을 진행할 수 있어요.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setEditing((e) => !e)}>
          {editing ? "체크리스트로 돌아가기" : "운동 추가/수정"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/trainer/members/${memberId}/assessment`} />}
        >
          검사 다시 하기
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {editing ? (
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
                        onChange={(e) => handleSetsChange(item.id, Number(e.target.value) || 1)}
                        className="w-16"
                      />
                    </div>
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
                      <select
                        value=""
                        onChange={(e) => handleAddExercise(e.target.value)}
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
                    ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAdding(false);
                      setAddCategory("");
                      setAddExercises(null);
                    }}
                  >
                    취소
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <form
          action={completeSession.bind(null, memberId, routineId)}
          className="space-y-6"
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>운동 체크리스트</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll}>
                전체 선택
              </Button>
            </CardHeader>
            <CardContent className="space-y-4" ref={checklistRef}>
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <input
                    type="checkbox"
                    name={`item_${item.id}`}
                    className="mt-1 size-4 rounded border-input accent-primary"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.exercise?.name_ko ?? item.exercise?.name_en ?? "알 수 없는 운동"}{" "}
                      <span className="font-normal text-muted-foreground">
                        {formatSetsReps(item.sets, item.reps, item.durationSeconds)}
                      </span>
                    </p>
                    {item.cautionNote && (
                      <p className="text-xs text-muted-foreground">
                        주의: {item.cautionNote}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>즉흥 변형 메모</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="free_memo">
                  그날 루틴에 없던 변형 동작이 있었다면 짧게 기록해 주세요 (선택)
                </Label>
                <Textarea id="free_memo" name="free_memo" rows={3} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full">
            수업 완료
          </Button>
        </form>
      )}

      {latestAssessmentId && (
        <div className="text-center">
          <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/trainer/members/${memberId}/categories?assessmentId=${latestAssessmentId}`}
              />
            }
          >
            새 루틴 추가
          </Button>
        </div>
      )}
    </div>
  );
}
