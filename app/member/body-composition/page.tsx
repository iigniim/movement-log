import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { BodyCompositionTable } from "@/components/body-composition/table";
import { BodyCompositionChart } from "@/components/body-composition/chart";
import type { BodyComposition } from "@/lib/types";

export default async function MemberBodyCompositionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getMemberForUser(supabase, user.id);
  if (!member) redirect("/trainer");

  const { data: records } = await supabase
    .from("body_composition_records")
    .select("*")
    .eq("member_id", member.id)
    .order("measured_at", { ascending: true })
    .returns<BodyComposition[]>();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">인바디 기록</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          트레이너가 측정한 최신 체성분 기록과 변화 추이를 볼 수 있어요.
        </p>
      </div>

      {!records || records.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              아직 등록된 인바디 기록이 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <BodyCompositionTable record={records[records.length - 1]} />
          {records.length >= 2 && <BodyCompositionChart records={records} />}
        </>
      )}
    </div>
  );
}
