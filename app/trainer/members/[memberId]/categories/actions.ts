"use server";

import { redirect } from "next/navigation";

export async function selectCategories(
  memberId: string,
  assessmentId: string,
  formData: FormData,
) {
  const categories = formData.getAll("category").map(String);

  if (categories.length === 0) {
    redirect(
      `/trainer/members/${memberId}/categories?assessmentId=${assessmentId}&error=${encodeURIComponent("카테고리를 하나 이상 선택해 주세요.")}`,
    );
  }

  const params = new URLSearchParams({ assessmentId });
  for (const category of categories) {
    params.append("category", category);
  }

  redirect(`/trainer/members/${memberId}/routine/new?${params.toString()}`);
}
