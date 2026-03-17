// =================================
// 📌 Application Constants
// =================================

/**
 * Payment expiry time in minutes
 */
export const PAYMENT_EXPIRY_MINUTES = 20;

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Default language
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/**
 * Rate limiting
 */
export const RATE_LIMIT_WINDOW_MS = 900000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;
