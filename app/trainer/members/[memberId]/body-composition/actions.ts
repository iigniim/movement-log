"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNextAssessmentStepUrl } from "@/lib/assessment-flow";

export async function saveBodyComposition(memberId: string, formData: FormData) {
  const supabase = await createClient();

  const measuredAt = String(formData.get("measured_at") ?? "");
  const weightKg = Number(formData.get("weight_kg"));
  const bodyFatMassKg = Number(formData.get("body_fat_mass_kg"));
  const skeletalMuscleMassKg = Number(formData.get("skeletal_muscle_mass_kg"));

  const toNullableNumber = (key: string) => {
    const raw = formData.get(key);
    if (raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  };
  const bodyFatPercentage = toNullableNumber("body_fat_percentage");
  const basalMetabolicRateKcal = toNullableNumber("basal_metabolic_rate_kcal");

  await supabase
    .from("body_composition_records")
    .update({ is_latest: false })
    .eq("member_id", memberId);

  const { error } = await supabase.from("body_composition_records").insert({
    member_id: memberId,
    measured_at: measuredAt,
    weight_kg: weightKg,
    body_fat_mass_kg: bodyFatMassKg,
    skeletal_muscle_mass_kg: skeletalMuscleMassKg,
    body_fat_percentage: bodyFatPercentage,
    basal_metabolic_rate_kcal: basalMetabolicRateKcal,
    is_latest: true,
  });

  if (error) {
    redirect(
      `/trainer/members/${memberId}/body-composition?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(await getNextAssessmentStepUrl(memberId));
}
