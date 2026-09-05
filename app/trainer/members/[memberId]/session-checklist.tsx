"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatSetsReps } from "@/lib/format";
import { completeSession } from "./session/actions";
import { RoutineEditor, type RoutineEditorItem } from "./routine-editor";

export type { RoutineEditorItem as ChecklistItem } from "./routine-editor";

export function SessionChecklist({
  memberId,
  routineId,
  items: initialItems,
  justConfirmed,
  latestAssessmentId,
}: {
  memberId: string;
  routineId: string;
  items: RoutineEditorItem[];
  justConfirmed?: boolean;
  latestAssessmentId?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [freeMemo, setFreeMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleItemChecked(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setCheckedIds((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((it) => it.id)),
    );
  }

  async function handleComplete() {
    setSubmitting(true);
    setError(null);

    const result = await completeSession(memberId, routineId, {
      items: items.map((item) => ({
        exerciseId: item.exerciseId,
        sets: item.sets,
        reps: item.reps,
        durationSeconds: item.durationSeconds,
        weightKg: item.weightKg,
        cautionNote: item.cautionNote,
        checked: checkedIds.has(item.id),
      })),
      freeMemo: freeMemo.trim() || null,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
    }
    // 성공 시 completeSession이 서버에서 리다이렉트하므로 여기서 할 일은 없다.
  }

  return (
    <div className="space-y-6">
      {justConfirmed && (
        <p className="text-sm text-muted-foreground">
          루틴이 저장되었습니다. 바로 오늘 수업을 진행할 수 있어요.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/trainer/members/${memberId}/assessment`} />}
        >
          검사 다시 하기
        </Button>
      </div>

      {editing ? (
        <RoutineEditor items={items} onItemsChange={setItems} onDone={() => setEditing(false)} />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>운동 체크리스트</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll}>
                전체 선택
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <input
                    type="checkbox"
                    checked={checkedIds.has(item.id)}
                    onChange={() => toggleItemChecked(item.id)}
                    className="mt-1 size-4 rounded border-input accent-primary"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.exercise?.name_ko ?? item.exercise?.name_en ?? "알 수 없는 운동"}{" "}
                      <span className="font-normal text-muted-foreground">
                        {formatSetsReps(item.sets, item.reps, item.durationSeconds, item.weightKg)}
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
              <Button className="w-full" onClick={() => setEditing(true)}>
                운동 추가/수정
              </Button>
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
                <Textarea
                  id="free_memo"
                  rows={3}
                  value={freeMemo}
                  onChange={(e) => setFreeMemo(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button size="lg" className="w-full" disabled={submitting} onClick={handleComplete}>
            {submitting ? "저장 중..." : "수업 완료"}
          </Button>
        </div>
      )}

      {!editing && latestAssessmentId && (
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
