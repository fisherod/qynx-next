// =================================
// 🌐 Internationalization Configuration
// =================================

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./i18n/locales/en";
import zh from "./i18n/locales/zh";
import de from "./i18n/locales/de";
import es from "./i18n/locales/es";
import it from "./i18n/locales/it";
import fr from "./i18n/locales/fr";
import tr from "./i18n/locales/tr";
import sk from "./i18n/locales/sk";
import cs from "./i18n/locales/cs";

// Translation resources per locale
const resources = { en, zh, de, es, it, fr, tr, sk, cs };

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "zh", "de", "es", "it", "fr", "tr", "sk", "cs"],
  debug: process.env.NODE_ENV === "development",

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // Pluralization
  pluralSeparator: "_",
  contextSeparator: "_",

  // Namespace
  defaultNS: "translation",
  ns: ["translation"],
});

export default i18n;
