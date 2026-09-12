import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMemberByIdWithRetry } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RoutineDraft } from "./routine-draft";

export default async function NewRoutinePage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{
    assessmentId?: string;
    category?: string | string[];
  }>;
}) {
  const { memberId } = await params;
  const { assessmentId, category } = await searchParams;
  if (!assessmentId) redirect(`/trainer/members/${memberId}/assessment`);

  const categories = category ? (Array.isArray(category) ? category : [category]) : [];
  if (categories.length === 0) {
    redirect(
      `/trainer/members/${memberId}/categories?assessmentId=${assessmentId}`,
    );
  }

  const supabase = await createClient();
  const member = await getMemberByIdWithRetry(supabase, memberId);
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/trainer" />}>
        ← 회원 목록
      </Button>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {member.name ?? "회원"} - AI 루틴 초안
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          포커스 카테고리: {categories.join(", ")}
        </p>
      </div>

      <RoutineDraft memberId={memberId} assessmentId={assessmentId} categories={categories} />
    </div>
  );
}
