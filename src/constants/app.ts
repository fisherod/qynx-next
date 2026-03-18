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

/**
 * ROI
 */
export const ROI_MONTHLY = 0.11; // 11%
export const ROI_WEEKLY = ROI_MONTHLY / 4;
export const ROI_DAILY = ROI_WEEKLY / 7;

/**
 * Referral ratio
 */
export const REFERRAL_RATIO = 0.1; // 10%
