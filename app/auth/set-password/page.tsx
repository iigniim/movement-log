"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // 초대 링크의 세션 토큰은 URL 해시로 전달되어 supabase-js가 마운트 시 자동으로 읽어들인다.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError(
          "초대 링크가 유효하지 않거나 만료되었습니다. 트레이너에게 다시 초대를 요청해 주세요.",
        );
      }
      setReady(true);
    });
  }, []);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    const password = String(formData.get("password") ?? "");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setSubmitting(false);
      setError(updateError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">비밀번호 설정</CardTitle>
          <CardDescription>
            Movement.log에서 사용할 비밀번호를 설정해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? null : error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <form action={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password">새 비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  minLength={8}
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "설정 중..." : "설정 완료"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
