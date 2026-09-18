"use client";

import { Button } from "@/components/ui/button";
import { deleteMember } from "./members/actions";

export function DeleteMemberButton({ memberId }: { memberId: string }) {
  return (
    <form
      action={deleteMember.bind(null, memberId)}
      onSubmit={(e) => {
        if (
          !confirm(
            "이 회원을 삭제하시겠습니까?\n문진표·인바디·루틴·수업기록이 모두 함께 삭제되며 되돌릴 수 없습니다.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        삭제
      </Button>
    </form>
  );
}
