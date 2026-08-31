import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSetsReps } from "@/lib/format";
import type {
  Exercise,
  Questionnaire,
  Routine,
  RoutineItem,
  SessionLog,
  SessionLogItem,
} from "@/lib/types";

type SessionLogItemWithExercise = SessionLogItem & {
  routine_item: (RoutineItem & { exercise: Exercise | null }) | null;
};

type RoutineItemWithExercise = RoutineItem & { exercise: Exercise | null };
type RoutineWithItems = Routine & { items: RoutineItemWithExercise[] };

const RISK_LABEL: Record<string, string> = {
  low: "낮음",
  mid: "중간",
  high: "높음",
};

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getMemberForUser(supabase, user.id);
  if (!member) redirect("/trainer");

  const { data: questionnaire } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("member_id", member.id)
    .eq("is_latest", true)
    .maybeSingle<Questionnaire>();

  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select("*")
    .eq("member_id", member.id)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<SessionLog[]>();

  const sessionLogIds = (sessionLogs ?? []).map((s) => s.id);

  const { data: sessionLogItems } = sessionLogIds.length
    ? await supabase
        .from("session_log_items")
        .select("*, routine_item:routine_items(*, exercise:exercise_library(*))")
        .in("session_log_id", sessionLogIds)
        .returns<SessionLogItemWithExercise[]>()
    : { data: [] as SessionLogItemWithExercise[] };

  const itemsBySession = new Map<string, SessionLogItemWithExercise[]>();
  for (const item of sessionLogItems ?? []) {
    const list = itemsBySession.get(item.session_log_id) ?? [];
    list.push(item);
    itemsBySession.set(item.session_log_id, list);
  }

  // "루틴 히스토리" - 그날그날의 수업 기록(session_logs)과는 다르게, 이 시기엔
  // 어떤 방향으로 운동했는지(활성 + 지난 루틴 전체)를 보여주는 별도 섹션이다.
  const { data: routines } = await supabase
    .from("routines")
    .select("*")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false })
    .returns<Routine[]>();

  const routineIds = (routines ?? []).map((r) => r.id);
  const { data: routineItems } = routineIds.length
    ? await supabase
        .from("routine_items")
        .select("*, exercise:exercise_library(*)")
        .in("routine_id", routineIds)
        .order("sort_order")
        .returns<RoutineItemWithExercise[]>()
    : { data: [] as RoutineItemWithExercise[] };

  const itemsByRoutine = new Map<string, RoutineItemWithExercise[]>();
  for (const item of routineItems ?? []) {
    const list = itemsByRoutine.get(item.routine_id) ?? [];
    list.push(item);
    itemsByRoutine.set(item.routine_id, list);
  }

  const routinesWithItems: RoutineWithItems[] = (routines ?? []).map((r) => ({
    ...r,
    items: itemsByRoutine.get(r.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          안녕하세요, {member.name ?? "회원"}님
        </h1>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>

      <p className="rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
        이 정보는 의학적 진단이 아니며, 트레이너의 지도 하에 진행됩니다.
      </p>

      {questionnaire?.risk_level === "high" && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          ⚠️ 의료진 상담을 권장드립니다. 운동 시작 전 담당 트레이너와 상담해
          주세요.
        </div>
      )}

      <Card>
        <CardContent className="space-y-3">
          {questionnaire ? (
            <p className="text-sm text-muted-foreground">
              최근 문진표 위험도:{" "}
              <Badge
                variant={
                  questionnaire.risk_level === "high"
                    ? "destructive"
                    : questionnaire.risk_level === "mid"
                      ? "secondary"
                      : "default"
                }
              >
                {questionnaire.risk_level
                  ? RISK_LABEL[questionnaire.risk_level]
                  : "분석 중"}
              </Badge>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 제출한 문진표가 없습니다.
            </p>
          )}
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/member/questionnaire" />}
          >
            {questionnaire ? "문진표 다시 작성하기" : "문진표 작성하기"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">루틴 히스토리</h2>

        {routinesWithItems.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                아직 만들어진 루틴이 없어요.
              </p>
            </CardContent>
          </Card>
        ) : (
          routinesWithItems.map((routine) => (
            <Card key={routine.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>
                    {(routine.target_categories ?? []).join(", ") || "카테고리 없음"}
                  </span>
                  <Badge variant={routine.status === "active" ? "default" : "outline"}>
                    {routine.status === "active" ? "진행 중" : "지난 루틴"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(routine.created_at).toLocaleDateString("ko-KR")} 생성
                </p>
                <p className="text-sm text-foreground">
                  {routine.items
                    .map((i) => i.exercise?.name_ko ?? i.exercise?.name_en)
                    .filter(Boolean)
                    .join(", ") || "포함된 운동이 없습니다."}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">지난 수업 기록</h2>

        {(sessionLogs ?? []).length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                아직 기록된 수업이 없어요.
              </p>
            </CardContent>
          </Card>
        ) : (
          (sessionLogs ?? []).map((log) => {
            const items = itemsBySession.get(log.id) ?? [];
            return (
              <Card key={log.id}>
                <CardHeader>
                  <CardTitle>{log.session_date}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      기록된 운동이 없습니다.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((item) => {
                        const exercise = item.routine_item?.exercise;
                        return (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-foreground">
                              {exercise?.name_ko ?? exercise?.name_en ?? "알 수 없는 운동"}
                              {item.routine_item && (
                                <span className="ml-1.5 text-muted-foreground">
                                  {formatSetsReps(
                                    item.routine_item.sets,
                                    item.routine_item.reps,
                                    item.routine_item.duration_seconds,
                                  )}
                                </span>
                              )}
                            </span>
                            {exercise?.video_url && (
                              <a
                                href={exercise.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-xs font-medium text-primary underline underline-offset-2"
                              >
                                참고 영상 보기
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {log.free_memo && (
                    <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                      오늘의 메모: {log.free_memo}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
