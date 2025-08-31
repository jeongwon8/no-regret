export const messages = {
  ko: {
    header: { title: "no - regret", subtitle: "완벽한 사람들을 위하여", badge: "KO" },
    home: {
      heroTitle: "no - regret",
      heroDesc: "완벽한 사람들을 위하여 — 오늘의 나를 기록하고, 내일의 나를 설계해요.",
      cta: "시작하기",
      today: "투데이",
      history: "히스토리",
    },
    today: {
      title: "오늘의 할 일",
      progress: "진행률",
    },
    history: {
      title: "히스토리",
      empty: "아직 히스토리가 없어요.",
    }
  },
  en: {
    header: { title: "no - regret", subtitle: "For the perfect ones", badge: "EN" },
    home: {
      heroTitle: "no - regret",
      heroDesc: "For the perfect ones — log today and design tomorrow.",
      cta: "Get started",
      today: "Today",
      history: "History",
    },
    today: {
      title: "Today's Tasks",
      progress: "Progress",
    },
    history: {
      title: "History",
      empty: "No history yet.",
    }
  },
} as const;

  
  export type Locale = keyof typeof messages;
  