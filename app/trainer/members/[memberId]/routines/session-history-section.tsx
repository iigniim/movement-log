"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateKorean } from "@/lib/format";
import type { SessionHistoryEntry } from "@/lib/session-history";
import { RoutineItemList } from "./routine-item-list";

const PAGE_SIZE = 10;

export function SessionHistorySection({
  entries,
  query,
}: {
  entries: SessionHistoryEntry[];
  query: string;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleEntries = entries.slice(0, visibleCount);

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {query ? "검색 결과가 없습니다." : "아직 기록된 수업이 없어요."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {visibleEntries.map(({ log, items }) => (
        <Card key={log.id}>
          <CardHeader>
            <CardTitle>{formatDateKorean(log.session_date)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RoutineItemList items={items} />

            {log.free_memo && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                오늘의 메모: {log.free_memo}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {visibleCount < entries.length && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          더 보기
        </Button>
      )}
    </div>
  );
}
