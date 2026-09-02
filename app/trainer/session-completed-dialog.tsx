"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SessionCompletedDialog({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);

  if (!visible) return null;

  function close() {
    // router.replace would re-fetch /trainer's server component, which loops
    // admin.auth.admin.getUserById per member (N+1) - just clean up the URL instead.
    window.history.replaceState(null, "", "/trainer");
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">✅</CardTitle>
          <CardTitle className="text-center">수업 완료</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            오늘 수업 기록이 저장되었습니다.
          </p>
          <Button size="lg" className="w-full" onClick={close}>
            확인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
