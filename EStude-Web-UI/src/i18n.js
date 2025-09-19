import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import vi from "./locales/vi/translation.json";
import en from "./locales/en/translation.json";

i18n
  .use(LanguageDetector) // tự nhận ngôn ngữ trình duyệt
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: "vi", // mặc định
    interpolation: {
      escapeValue: false, // react đã tự chống XSS
    },
  });

export default i18n;
