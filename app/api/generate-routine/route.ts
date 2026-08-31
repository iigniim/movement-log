import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoutine } from "@/lib/routine-generate";
import type { AssessmentResultRow, Exercise, Questionnaire } from "@/lib/types";

export async function POST(request: Request) {
  const { memberId, assessmentId, categories } = await request.json();
  if (!memberId || !assessmentId || !Array.isArray(categories) || !categories.length) {
    return NextResponse.json(
      { error: "memberId, assessmentId, categories가 필요합니다." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: questionnaire, error: qError } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("member_id", memberId)
    .eq("is_latest", true)
    .single<Questionnaire>();

  if (qError || !questionnaire) {
    return NextResponse.json(
      { error: "문진표를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const { data: assessmentResults } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("assessment_id", assessmentId)
    .returns<AssessmentResultRow[]>();

  const { data: candidates, error: exError } = await supabase
    .from("exercise_library")
    .select("*")
    .in("category", categories)
    .returns<Exercise[]>();

  if (exError) {
    return NextResponse.json({ error: exError.message }, { status: 500 });
  }

  const draft = await generateRoutine({
    questionnaire,
    assessmentResults: assessmentResults ?? [],
    categories,
    candidates: candidates ?? [],
  });

  const candidateById = new Map((candidates ?? []).map((c) => [c.id, c]));

  return NextResponse.json({
    reasoning: draft.reasoning,
    items: draft.items.map((item) => ({
      ...item,
      exercise: candidateById.get(item.exerciseId),
    })),
  });
}
