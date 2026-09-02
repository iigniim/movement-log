import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { BodyComposition, Member } from "@/lib/types";
import { BodyCompositionTable } from "@/components/body-composition/table";
import { BodyCompositionChart } from "@/components/body-composition/chart";
import { getNextAssessmentStepUrl } from "@/lib/assessment-flow";
import { saveBodyComposition } from "./actions";
import { BodyCompositionForm } from "./body-composition-form";

export default async function BodyCompositionPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { memberId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle<Member>();
  if (!member) notFound();

  const { data: history } = await supabase
    .from("body_composition_records")
    .select("*")
    .eq("member_id", memberId)
    .order("measured_at", { ascending: true })
    .returns<BodyComposition[]>();

  const latest = history?.[history.length - 1] ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const nextStepUrl = await getNextAssessmentStepUrl(memberId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {member.name ?? "회원"} - 인바디 측정
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          검사를 시작하기 전에 최신 체성분 측정값을 입력해 주세요.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {latest && (
        <p className="text-sm text-muted-foreground">
          지난 기록: {latest.measured_at}, 체지방량 {latest.body_fat_mass_kg}kg, 골격근량{" "}
          {latest.skeletal_muscle_mass_kg}kg
        </p>
      )}

      <BodyCompositionForm
        action={saveBodyComposition.bind(null, memberId)}
        today={today}
        submitLabel={latest ? "인바디 갱신하기" : "인바디 등록하기"}
      />

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={nextStepUrl} />}
        >
          건너뛰고 검사 시작
        </Button>
      </div>

      {!history || history.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 등록된 인바디 기록이 없습니다.</p>
      ) : (
        <>
          <BodyCompositionTable record={history[history.length - 1]} />
          {history.length >= 2 && <BodyCompositionChart records={history} />}
        </>
      )}
    </div>
  );
}
