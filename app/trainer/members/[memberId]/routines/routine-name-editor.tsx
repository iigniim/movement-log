"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { updateRoutineName } from "./actions";

export function RoutineNameEditor({
  memberId,
  routineId,
  displayName,
  rawName,
}: {
  memberId: string;
  routineId: string;
  displayName: string;
  rawName: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rawName ?? "");
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-sm font-medium text-foreground"
      >
        {displayName}
        <span aria-hidden className="text-xs text-muted-foreground">
          ✎
        </span>
      </button>
    );
  }

  async function save() {
    setSaving(true);
    await updateRoutineName(memberId, routineId, value);
    setSaving(false);
    setEditing(false);
  }

  return (
    <Input
      autoFocus
      value={value}
      disabled={saving}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue(rawName ?? "");
          setEditing(false);
        }
      }}
      className="h-7 max-w-48 text-sm"
    />
  );
}
