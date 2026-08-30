"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function InviteMemberForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/members/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        birthDate: formData.get("birth_date"),
        gender: formData.get("gender"),
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setError(result.error ?? "초대에 실패했습니다.");
      return;
    }

    router.push("/trainer");
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" name="email" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">생년월일</Label>
              <Input id="birth_date" type="date" name="birth_date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">성별</Label>
              <select
                id="gender"
                name="gender"
                required
                defaultValue=""
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>
                  선택
                </option>
                <option value="female">여성</option>
                <option value="male">남성</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "초대 중..." : "초대 메일 보내기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
