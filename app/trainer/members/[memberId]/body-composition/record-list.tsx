"use client";

import { Button } from "@/components/ui/button";
import type { BodyComposition } from "@/lib/types";
import { deleteBodyCompositionRecord } from "./actions";

export function BodyCompositionRecordList({
  memberId,
  records,
}: {
  memberId: string;
  records: BodyComposition[];
}) {
  const newestFirst = [...records].reverse();

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-foreground">전체 기록 관리</h2>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {newestFirst.map((record) => (
          <li
            key={record.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">
              {record.measured_at} · 체중 {record.weight_kg ?? "-"}kg · 체지방량{" "}
              {record.body_fat_mass_kg ?? "-"}kg · 골격근량 {record.skeletal_muscle_mass_kg ?? "-"}kg
            </span>
            <form
              action={deleteBodyCompositionRecord.bind(null, memberId, record.id)}
              onSubmit={(e) => {
                if (!confirm("이 기록을 삭제하시겠습니까? 되돌릴 수 없습니다.")) {
                  e.preventDefault();
                }
              }}
            >
              <Button type="submit" variant="destructive" size="sm">
                삭제
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
