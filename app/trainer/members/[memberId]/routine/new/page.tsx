import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";
import { RoutineDraft } from "./routine-draft";

export default async function NewRoutinePage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{
    assessmentId?: string;
    category?: string | string[];
    restartFrom?: string;
  }>;
}) {
  const { memberId } = await params;
  const { assessmentId, category, restartFrom } = await searchParams;
  if (!assessmentId) redirect(`/trainer/members/${memberId}/assessment`);

  const categories = category ? (Array.isArray(category) ? category : [category]) : [];
  if (categories.length === 0) {
    redirect(
      `/trainer/members/${memberId}/categories?assessmentId=${assessmentId}`,
    );
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle<Member>();
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {member.name ?? "회원"} - AI 루틴 초안
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          포커스 카테고리: {categories.join(", ")}
        </p>
      </div>

      <RoutineDraft
        memberId={memberId}
        assessmentId={assessmentId}
        categories={categories}
        restartFrom={restartFrom}
      />
    </div>
  );
}
