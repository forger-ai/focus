import { defaultImportDays } from "../constants";

export function startEmailImportTask(days: number) {
  if (!window.forgerApp) {
    throw new Error("Forger task runner is unavailable in this browser.");
  }
  return window.forgerApp.startCodexTask({
    templateId: "email-focus-import",
    variables: {
      days: Number.isFinite(days) && days > 0 ? Math.floor(days) : defaultImportDays,
    },
  });
}
