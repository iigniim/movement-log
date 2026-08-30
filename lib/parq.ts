export const PARQ_QUESTIONS = [
  {
    id: 1,
    text: "의사로부터 심장질환이 있다는 진단을 받았거나, 의사가 권고하는 신체활동만 해야 한다는 말을 들은 적이 있습니까?",
    cardiac: true,
  },
  {
    id: 2,
    text: "신체활동을 할 때 가슴에 통증을 느낍니까?",
    cardiac: true,
  },
  {
    id: 3,
    text: "지난 한 달간 신체활동을 하지 않을 때도 가슴 통증을 느낀 적이 있습니까?",
    cardiac: true,
  },
  {
    id: 4,
    text: "어지러움으로 균형을 잃거나 의식을 잃은 적이 있습니까?",
    cardiac: false,
  },
  {
    id: 5,
    text: "신체활동의 변화로 악화될 수 있는 뼈나 관절 문제가 있습니까?",
    cardiac: false,
  },
  {
    id: 6,
    text: "현재 혈압이나 심장질환과 관련된 약(예: 이뇨제)을 처방받아 복용 중입니까?",
    cardiac: true,
  },
  {
    id: 7,
    text: "신체활동을 하면 안 되는 다른 이유를 알고 있습니까?",
    cardiac: false,
  },
] as const;
