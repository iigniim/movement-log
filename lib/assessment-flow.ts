import { createClient } from "@/lib/supabase/server";

/**
 * 인바디 등록/건너뛰기 이후 어디로 보낼지 결정한다. 가장 최근 assessment에
 * 결과(assessment_results)가 이미 있으면 검사를 마친 것으로 보고 루틴
 * 선택 화면으로 보낸다 - 거기서 기존 루틴 선택 또는 "새 루틴 추가"로
 * 카테고리 선택을 이어갈 수 있다.
 */
export async function getNextAssessmentStepUrl(memberId: string): Promise<string> {
  const supabase = await createClient();
  const assessmentUrl = `/trainer/members/${memberId}/assessment`;

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!assessment) return assessmentUrl;

  const { count: resultsCount } = await supabase
    .from("assessment_results")
    .select("id", { count: "exact", head: true })
    .eq("assessment_id", assessment.id);

  if (!resultsCount) return assessmentUrl;

  return `/trainer/members/${memberId}/routines`;
}
