import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BodyComposition, Member } from "@/lib/types";
import { saveBodyComposition } from "./actions";

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

  const { data: latest } = await supabase
    .from("body_composition_records")
    .select("*")
    .eq("member_id", memberId)
    .eq("is_latest", true)
    .maybeSingle<BodyComposition>();

  const today = new Date().toISOString().slice(0, 10);

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

      <form action={saveBodyComposition.bind(null, memberId)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>측정값 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="measured_at">측정일</Label>
              <Input
                id="measured_at"
                name="measured_at"
                type="date"
                required
                defaultValue={today}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight_kg">체중(kg)</Label>
              <Input
                id="weight_kg"
                name="weight_kg"
                type="number"
                step="0.1"
                min="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body_fat_mass_kg">체지방량(kg)</Label>
              <Input
                id="body_fat_mass_kg"
                name="body_fat_mass_kg"
                type="number"
                step="0.1"
                min="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skeletal_muscle_mass_kg">골격근량(kg)</Label>
              <Input
                id="skeletal_muscle_mass_kg"
                name="skeletal_muscle_mass_kg"
                type="number"
                step="0.1"
                min="0"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">
          {latest ? "인바디 갱신하기" : "인바디 등록하기"}
        </Button>
      </form>
    </div>
  );
}
