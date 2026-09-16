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
            className="flex flex-col items-start gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">{record.measured_at}</p>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                <span>체중 {record.weight_kg ?? "-"}kg</span>
                <span>체지방량 {record.body_fat_mass_kg ?? "-"}kg</span>
                <span>골격근량 {record.skeletal_muscle_mass_kg ?? "-"}kg</span>
              </div>
            </div>
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
