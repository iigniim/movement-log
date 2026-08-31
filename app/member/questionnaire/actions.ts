"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/auth";
import { classifyRisk } from "@/lib/risk";
import { recommendAssessmentItems } from "@/lib/assessment-recommend";
import { PARQ_QUESTIONS } from "@/lib/parq";
import type { ParqAnswer } from "@/lib/types";

export async function submitQuestionnaire(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getMemberForUser(supabase, user.id);
  if (!member) redirect("/login");

  const parqAnswers: ParqAnswer[] = PARQ_QUESTIONS.map((q) => ({
    id: q.id,
    answer: formData.get(`parq_${q.id}`) === "yes",
  }));

  const injuryHistory = String(formData.get("injury_history") ?? "");
  const surgeryHistory = String(formData.get("surgery_history") ?? "");
  const chronicCondition = String(formData.get("chronic_condition") ?? "");
  const birthDate = String(formData.get("birth_date") ?? "") || null;
  const gender = String(formData.get("gender") ?? "") || null;

  await supabase
    .from("members")
    .update({ birth_date: birthDate, gender })
    .eq("id", member.id);

  await supabase
    .from("questionnaires")
    .update({ is_latest: false })
    .eq("member_id", member.id);

  const { data: inserted, error: insertError } = await supabase
    .from("questionnaires")
    .insert({
      member_id: member.id,
      parq_answers: parqAnswers,
      injury_history: injuryHistory,
      surgery_history: surgeryHistory,
      chronic_condition: chronicCondition,
      is_latest: true,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    redirect(
      `/member/questionnaire?error=${encodeURIComponent(insertError?.message ?? "저장에 실패했습니다")}`,
    );
  }

  // 문진표가 갱신되면 몸 상태를 다시 검토해야 하므로, 기존에 활성 상태였던
  // 루틴은 전부 보관 처리하고 재검사(검사 추천→입력→루틴 생성)부터 다시
  // 진행하도록 한다 - 안전을 위한 재검토 단계라 매번 무조건 실행한다.
  await supabase
    .from("routines")
    .update({ status: "archived" })
    .eq("member_id", member.id)
    .eq("status", "active");

  const { riskLevel } = await classifyRisk({
    parqAnswers,
    injuryHistory,
    surgeryHistory,
    chronicCondition,
  });

  await supabase
    .from("questionnaires")
    .update({ risk_level: riskLevel })
    .eq("id", inserted.id);

  const recommended = await recommendAssessmentItems({
    parqAnswers,
    injuryHistory,
    surgeryHistory,
    chronicCondition,
  });

  await supabase.from("assessments").insert({
    member_id: member.id,
    questionnaire_id: inserted.id,
    recommended_items: recommended,
  });

  redirect("/member");
}
