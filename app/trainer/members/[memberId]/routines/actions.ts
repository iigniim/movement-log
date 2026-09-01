"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleRoutinePin(
  memberId: string,
  routineId: string,
  pinned: boolean,
) {
  const supabase = await createClient();
  await supabase.from("routines").update({ is_pinned: pinned }).eq("id", routineId);
  revalidatePath(`/trainer/members/${memberId}/routines`);
}

export async function updateRoutineName(
  memberId: string,
  routineId: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("routines")
    .update({ name: name.trim() || null })
    .eq("id", routineId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/trainer/members/${memberId}/routines`);
  return { ok: true };
}
