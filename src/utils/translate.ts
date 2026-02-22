import translations from "../locales/en.json";

export const t = (key: string): string => {
  return translations[key] || key;
};
