import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyRisk } from "@/lib/risk";
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

  const { riskLevel, reasoning } = await classifyRisk({
    parqAnswers: questionnaire.parq_answers,
    injuryHistory: questionnaire.injury_history ?? "",
    surgeryHistory: questionnaire.surgery_history ?? "",
    chronicCondition: questionnaire.chronic_condition ?? "",
  });

  const { error: updateError } = await supabase
    .from("questionnaires")
    .update({ risk_level: riskLevel })
    .eq("id", questionnaireId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ riskLevel, reasoning });
}
