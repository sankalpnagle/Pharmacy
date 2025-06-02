import translations from "@../../../public/locales/en.json";

export const t = (key: string): string => {
  return translations[key] || key;
};
