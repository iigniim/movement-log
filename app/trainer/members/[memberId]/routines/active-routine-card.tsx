"use client";

import Link from "next/link";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRoutineName } from "@/lib/format";
import type { Routine } from "@/lib/types";
import type { RoutineEditorItem } from "../routine-editor";
import { RoutineNameEditor } from "./routine-name-editor";
import { PinToggleButton } from "./pin-toggle-button";
import { RoutineItemList } from "./routine-item-list";

export function ActiveRoutineCard({
  memberId,
  routine,
  items,
  lastProgressedAt,
}: {
  memberId: string;
  routine: Routine;
  items: RoutineEditorItem[];
  lastProgressedAt?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <RoutineNameEditor
            memberId={memberId}
            routineId={routine.id}
            displayName={formatRoutineName(routine)}
            rawName={routine.name}
          />
        </CardTitle>
        <CardAction>
          <PinToggleButton
            memberId={memberId}
            routineId={routine.id}
            isPinned={routine.is_pinned}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <RoutineItemList items={items} emptyText="구성된 운동이 없습니다." />
        <p className="text-xs text-muted-foreground">
          {new Date(routine.created_at).toLocaleDateString("ko-KR")} 생성 · 마지막 진행:{" "}
          {lastProgressedAt ? formatDateTime(lastProgressedAt) : "아직 진행 안 함"}
        </p>
        <Button
          size="sm"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/trainer/members/${memberId}/session?routineId=${routine.id}`} />}
        >
          이 루틴으로 진행
        </Button>
      </CardContent>
    </Card>
  );
}
