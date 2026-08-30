"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/auth";
import { classifyRisk } from "@/lib/risk";
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

  redirect("/member");
}
