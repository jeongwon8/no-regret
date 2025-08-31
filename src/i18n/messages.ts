export const messages = {
    ko: {
      header: { title: "no - regret", subtitle: "완벽한 사람들을 위하여", badge: "KO" },
    },
    en: {
      header: { title: "no - regret", subtitle: "For the perfect ones", badge: "EN" },
    },
  } as const;
  
  export type Locale = keyof typeof messages;
  