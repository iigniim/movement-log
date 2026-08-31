import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recommendAssessmentItems } from "@/lib/assessment-recommend";
import type { Questionnaire } from "@/lib/types";

export async function POST(request: Request) {
  const { questionnaireId } = await request.json();
  if (!questionnaireId) {
    return NextResponse.json(
      { error: "questionnaireId is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: questionnaire, error: fetchError } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("id", questionnaireId)
    .single<Questionnaire>();

  if (fetchError || !questionnaire) {
    return NextResponse.json(
      { error: fetchError?.message ?? "questionnaire not found" },
      { status: 404 },
    );
  }

  const recommended = await recommendAssessmentItems({
    parqAnswers: questionnaire.parq_answers,
    injuryHistory: questionnaire.injury_history ?? "",
    surgeryHistory: questionnaire.surgery_history ?? "",
    chronicCondition: questionnaire.chronic_condition ?? "",
  });

  const { data: assessment, error: insertError } = await supabase
    .from("assessments")
    .insert({
      member_id: questionnaire.member_id,
      questionnaire_id: questionnaire.id,
      recommended_items: recommended,
    })
    .select("id")
    .single();

  if (insertError || !assessment) {
    return NextResponse.json(
      { error: insertError?.message ?? "저장에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ assessmentId: assessment.id, ...recommended });
}
