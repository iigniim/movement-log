import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ASSESSMENT_ITEMS } from "@/lib/assessment";
import { PARQ_QUESTIONS } from "@/lib/parq";
import type { ParqAnswer, RecommendedItems } from "@/lib/types";

const ITEM_NAMES = ASSESSMENT_ITEMS.map((i) => i.name) as [string, ...string[]];

const RecommendationSchema = z.object({
  items: z.array(z.enum(ITEM_NAMES)).min(2).max(3),
  reasoning: z.string(),
});

export async function recommendAssessmentItems(input: {
  parqAnswers: ParqAnswer[];
  injuryHistory: string;
  surgeryHistory: string;
  chronicCondition: string;
  healthUpdatesText?: string;
}): Promise<RecommendedItems> {
  const parqSummary = input.parqAnswers
    .map((a) => {
      const q = PARQ_QUESTIONS.find((q) => q.id === a.id);
      return `${a.id}. ${q?.text} -> ${a.answer ? "예" : "아니오"}`;
    })
    .join("\n");

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: `당신은 피트니스 트레이너를 보조하는 검사 항목 추천 도우미입니다. 회원의 사전 문진표 내용을 보고, 트레이너가 진행할 신체 기능 검사 항목을 아래 후보 중에서 2~3개 추천하세요.

[검사 항목 후보]
${ASSESSMENT_ITEMS.map((i) => `- ${i.name}`).join("\n")}

관절·근골격계 문제(무릎, 어깨, 허리 등)나 자세 관련 언급이 문진표 또는 건강 상태 업데이트 이력에 있으면 관련 검사를 우선 추천하고, 특별한 이상이 없다면 기본적인 하체·코어 검사를 추천하세요. reasoning은 한국어로 2~3문장으로 간결하게 작성하세요.`,
    messages: [
      {
        role: "user",
        content: `[PAR-Q 응답]\n${parqSummary}\n\n[부상 이력]\n${input.injuryHistory || "없음"}\n\n[수술 이력]\n${input.surgeryHistory || "없음"}\n\n[지병]\n${input.chronicCondition || "없음"}\n\n[건강 상태 업데이트 이력]\n${input.healthUpdatesText || "없음"}`,
      },
    ],
    output_config: { format: zodOutputFormat(RecommendationSchema) },
  });

  const parsed = response.parsed_output;
  return {
    items: parsed?.items ?? ITEM_NAMES.slice(0, 2),
    reasoning: parsed?.reasoning ?? "PAR-Q 및 병력 기반 기본 추천",
  };
}
