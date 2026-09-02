import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

export const BodyCompositionExtractSchema = z.object({
  measured_at: z.string(),
  weight_kg: z.number().nullable(),
  body_fat_mass_kg: z.number().nullable(),
  skeletal_muscle_mass_kg: z.number().nullable(),
  body_fat_percentage: z.number().nullable(),
  basal_metabolic_rate_kcal: z.number().nullable(),
});

export type BodyCompositionExtract = z.infer<typeof BodyCompositionExtractSchema>;

export async function extractBodyComposition(input: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png";
}): Promise<BodyCompositionExtract | null> {
  const today = new Date().toISOString().slice(0, 10);

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `이 사진은 InBody(체성분) 측정 결과지다. 표에서 아래 수치들을 정확히 읽어라. 추측하지 말고 사진에서 명확히 보이는 숫자만 넣고, 안 보이면 null로 남겨라. 없는 값을 지어내면 절대 안 된다.

- measured_at: 결과지에 측정일이 인쇄되어 있으면 그 날짜를 "YYYY-MM-DD" 형식으로 쓰고, 없으면 오늘 날짜(${today})를 써라.
- weight_kg, body_fat_mass_kg, skeletal_muscle_mass_kg: 각각 kg 단위 숫자. 표에서 명확히 읽히지 않으면 null.
- body_fat_percentage: 체지방률(%) 숫자.
- basal_metabolic_rate_kcal: 기초대사량(kcal) 숫자.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: input.mediaType,
              data: input.imageBase64,
            },
          },
          {
            type: "text",
            text: "이 인바디 결과지 사진에서 측정일, 체중, 체지방량, 골격근량, 체지방률, 기초대사량을 읽어줘.",
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(BodyCompositionExtractSchema) },
  });

  return response.parsed_output ?? null;
}
