import { NextResponse } from "next/server";
import { extractBodyComposition } from "@/lib/body-composition-extract";

export async function POST(request: Request) {
  const { imageBase64, mediaType } = await request.json();

  if (!imageBase64 || (mediaType !== "image/jpeg" && mediaType !== "image/png")) {
    return NextResponse.json(
      { error: "imageBase64와 mediaType(image/jpeg 또는 image/png)이 필요합니다." },
      { status: 400 },
    );
  }

  const result = await extractBodyComposition({ imageBase64, mediaType });

  if (
    !result ||
    (result.weight_kg === null &&
      result.body_fat_mass_kg === null &&
      result.skeletal_muscle_mass_kg === null)
  ) {
    return NextResponse.json(
      { error: "사진에서 인바디 수치를 읽지 못했습니다. 인바디 결과지 사진인지 확인해 주세요." },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
