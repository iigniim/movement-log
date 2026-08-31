export const ASSESSMENT_RESULTS = ["정상", "경미한 제한", "뚜렷한 문제"] as const;
export type AssessmentResult = (typeof ASSESSMENT_RESULTS)[number];

export const ASSESSMENT_ITEMS = [
  {
    name: "오버헤드 스쿼트 검사",
    tiers: {
      정상: "무릎이 발끝 방향 유지",
      "경미한 제한": "무릎이 안쪽으로 살짝 모임",
      "뚜렷한 문제": "무릎 심하게 모임·상체 과도하게 숙여짐",
    },
  },
  {
    name: "무릎 정렬 확인",
    tiers: {
      정상: "스쿼트·런지 시 무릎이 발끝과 같은 방향 유지",
      "경미한 제한": "무릎이 안쪽 또는 바깥쪽으로 약간 치우침",
      "뚜렷한 문제": "무릎 정렬이 뚜렷하게 무너지거나 좌우 비대칭이 큼",
    },
  },
  {
    name: "어깨 가동성 확인",
    tiers: {
      정상: "양팔을 등 뒤로 돌려 맞잡을 때 좌우 차이 거의 없음",
      "경미한 제한": "가동 범위가 다소 제한되거나 좌우 차이가 있음",
      "뚜렷한 문제": "가동 범위가 크게 제한되거나 통증 동반",
    },
  },
  {
    name: "코어 안정성 확인",
    tiers: {
      정상: "플랭크 자세를 30초 이상 정렬 유지하며 버팀",
      "경미한 제한": "자세가 서서히 무너지거나 유지 시간이 짧음",
      "뚜렷한 문제": "골반이 처지거나 허리가 아치형으로 무너짐",
    },
  },
] as const;

export type AssessmentItemName = (typeof ASSESSMENT_ITEMS)[number]["name"];

export const ROUTINE_CATEGORIES = ["하체", "코어", "상체", "전신"] as const;
export type RoutineCategory = (typeof ROUTINE_CATEGORIES)[number];
