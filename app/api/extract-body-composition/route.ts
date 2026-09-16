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

  // TEMP DEBUG - remove after diagnosis
  let result;
  try {
    result = await extractBodyComposition({ imageBase64, mediaType });
  } catch (error) {
    return NextResponse.json(
      { error: "인바디 값을 읽는 중 오류가 발생했습니다.", debugError: String(error) },
      { status: 500 },
    );
  }

  // TEMP DEBUG - remove after diagnosis
  const { parsed, rawContent } = result;
  if (!parsed) {
    return NextResponse.json(
      {
        error: "사진에서 인바디 수치를 읽지 못했습니다. 인바디 결과지 사진인지 확인해 주세요.",
        debugError: `parsed_output 없음 - raw content: ${JSON.stringify(rawContent)}`,
      },
      { status: 400 },
    );
  }

  if (
    parsed.weight_kg === null &&
    parsed.body_fat_mass_kg === null &&
    parsed.skeletal_muscle_mass_kg === null
  ) {
    return NextResponse.json(
      { error: "사진에서 인바디 수치를 읽지 못했습니다. 인바디 결과지 사진인지 확인해 주세요." },
      { status: 400 },
    );
  }

  return NextResponse.json(parsed);
}
