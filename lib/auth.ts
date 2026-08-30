import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "@/lib/types";

// members.user_id가 본인이면 회원, 아니면 트레이너로 취급한다.
export async function getMemberForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Member | null> {
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<Member>();

  return data;
}
