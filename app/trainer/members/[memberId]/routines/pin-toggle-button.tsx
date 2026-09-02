"use client";

import { startTransition, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import { toggleRoutinePin } from "./actions";

export function PinToggleButton({
  memberId,
  routineId,
  isPinned,
}: {
  memberId: string;
  routineId: string;
  isPinned: boolean;
}) {
  const [optimisticPinned, setOptimisticPinned] = useOptimistic(
    isPinned,
    (_state, next: boolean) => next,
  );

  function handleClick() {
    const next = !isPinned;
    startTransition(async () => {
      setOptimisticPinned(next);
      try {
        await toggleRoutinePin(memberId, routineId, next);
      } catch (err) {
        console.error(err);
        alert("고정 상태를 변경하지 못했습니다. 다시 시도해 주세요.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant={optimisticPinned ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={optimisticPinned ? "고정 해제" : "상단 고정"}
      title={optimisticPinned ? "고정 해제" : "상단 고정"}
      onClick={handleClick}
    >
      📌
    </Button>
  );
}
