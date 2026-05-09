import { defaultImportDays } from "../constants";
import type { Locale } from "../i18n";

export function startEmailImportTask(days: number, locale: Locale) {
  if (!window.forgerApp) {
    throw new Error("Forger task runner is unavailable in this browser.");
  }
  return window.forgerApp.startCodexTask({
    templateId: "email-focus-import",
    locale,
    variables: {
      days: Number.isFinite(days) && days > 0 ? Math.floor(days) : defaultImportDays,
      locale,
    },
  });
}
