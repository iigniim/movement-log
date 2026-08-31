"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function RecommendButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: questionnaire, error: qError } = await supabase
      .from("questionnaires")
      .select("id")
      .eq("member_id", memberId)
      .eq("is_latest", true)
      .maybeSingle();

    if (qError || !questionnaire) {
      setLoading(false);
      setError("이 회원의 문진표를 찾을 수 없습니다.");
      return;
    }

    const res = await fetch("/api/recommend-assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionnaireId: questionnaire.id }),
    });

    if (!res.ok) {
      const result = await res.json();
      setLoading(false);
      setError(result.error ?? "추천에 실패했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "추천받는 중..." : "AI 검사 항목 추천받기"}
      </Button>
    </div>
  );
}
