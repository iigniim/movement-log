"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ASSESSMENT_ITEMS } from "@/lib/assessment";

export async function saveAssessmentResults(
  assessmentId: string,
  memberId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const rows = ASSESSMENT_ITEMS.filter((item) =>
    formData.has(`result_${item.name}`),
  ).map((item) => ({
    assessment_id: assessmentId,
    item_name: item.name,
    result: String(formData.get(`result_${item.name}`)),
    trainer_note: String(formData.get(`note_${item.name}`) ?? "") || null,
  }));

  await supabase
    .from("assessment_results")
    .delete()
    .eq("assessment_id", assessmentId);

  if (rows.length) {
    await supabase.from("assessment_results").insert(rows);
  }

  redirect(
    `/trainer/members/${memberId}/categories?assessmentId=${assessmentId}`,
  );
}
