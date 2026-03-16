// =================================
// 📅 Date Utilities
// =================================

/**
 * Parse MySQL datetime string to Date object (handles UTC)
 */
export function parseMySQLDate(dateString: string): Date {
  // If it's a MySQL datetime string (YYYY-MM-DD HH:mm:ss), treat it as UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString + "Z");
  }
  return new Date(dateString);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, locale: string = "zh-CN"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

/**
 * Format datetime to readable string
 */
export function formatDateTime(date: Date | string, locale: string = "zh-CN"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Get time ago string (e.g., "2 minutes ago")
 */
export function getTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(d);
}
