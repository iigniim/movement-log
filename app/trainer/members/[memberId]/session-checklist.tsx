"use client";

import { useRef, useState } from "react";
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

  function handleChecklistSubmit(e: React.FormEvent<HTMLFormElement>) {
    const boxes = checklistRef.current?.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const uncheckedCount = boxes
      ? Array.from(boxes).filter((box) => !box.checked).length
      : 0;
    if (
      uncheckedCount > 0 &&
      !window.confirm(
        `체크하지 않은 운동 ${uncheckedCount}개는 루틴에서 삭제됩니다. 계속할까요?`,
      )
    ) {
      e.preventDefault();
    }
  }

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

      {editing ? (
        <RoutineEditor
          memberId={memberId}
          routineId={routineId}
          items={items}
          onItemsChange={setItems}
          onDone={() => setEditing(false)}
        />
      ) : (
        <form
          action={completeSession.bind(null, memberId, routineId)}
          onSubmit={handleChecklistSubmit}
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
