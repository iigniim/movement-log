"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="space-y-3">
        {newestFirst.map((record) => (
          <Card key={record.id}>
            <CardHeader>
              <CardTitle>{record.measured_at}</CardTitle>
              <CardAction>
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
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>체중 {record.weight_kg ?? "-"}kg</span>
                <span>체지방량 {record.body_fat_mass_kg ?? "-"}kg</span>
                <span>골격근량 {record.skeletal_muscle_mass_kg ?? "-"}kg</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
