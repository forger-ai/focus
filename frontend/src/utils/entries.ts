import type { CalendarEntry, EntryPayload, EntryType } from "../api/focus";
import { isoDate } from "./date";

export type EntryDraft = EntryPayload;

export function emptyDraft(entryTypes: EntryType[], date = isoDate(new Date())): EntryDraft {
  return {
    date,
    time: null,
    title: "",
    notes: "",
    entry_type_id: entryTypes[0]?.id ?? "",
    source: "manual",
  };
}

export function entryToDraft(entry: CalendarEntry): EntryDraft {
  return {
    date: entry.date,
    time: entry.time ?? null,
    title: entry.title,
    notes: entry.notes ?? "",
    entry_type_id: entry.entry_type_id,
    source: entry.source ?? "manual",
    gmail_message_id: entry.gmail_message_id ?? null,
    gmail_thread_id: entry.gmail_thread_id ?? null,
    gmail_query: entry.gmail_query ?? null,
  };
}

export function cleanDraft(draft: EntryDraft): EntryPayload {
  return {
    ...draft,
    time: draft.time?.trim() || null,
    title: draft.title.trim(),
    notes: draft.notes?.trim() || null,
    source: draft.source?.trim() || null,
  };
}

export function sortEntries(entries: CalendarEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.date !== right.date) return left.date.localeCompare(right.date);
    const leftAllDay = left.time ? 1 : 0;
    const rightAllDay = right.time ? 1 : 0;
    if (leftAllDay !== rightAllDay) return leftAllDay - rightAllDay;
    if ((left.time ?? "") !== (right.time ?? "")) {
      return (left.time ?? "").localeCompare(right.time ?? "");
    }
    return left.created_at.localeCompare(right.created_at);
  });
}

export function groupEntriesByDay(entries: CalendarEntry[]) {
  const grouped = new Map<string, CalendarEntry[]>();
  for (const entry of sortEntries(entries)) {
    grouped.set(entry.date, [...(grouped.get(entry.date) ?? []), entry]);
  }
  return grouped;
}
