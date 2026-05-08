import { del, get, post, request } from "./client";

export type EntryType = {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type CalendarEntry = {
  id: string;
  date: string;
  time?: string | null;
  title: string;
  notes?: string | null;
  entry_type_id: string;
  entry_type_name: string;
  entry_type_color: string;
  source?: string | null;
  gmail_message_id?: string | null;
  gmail_thread_id?: string | null;
  gmail_query?: string | null;
  created_at: string;
  updated_at: string;
};

export type EntryPayload = {
  date: string;
  time?: string | null;
  title: string;
  notes?: string | null;
  entry_type_id: string;
  source?: string | null;
  gmail_message_id?: string | null;
  gmail_thread_id?: string | null;
  gmail_query?: string | null;
};

export type EntryTypePayload = {
  name: string;
  color: string;
};

export function listEntries(params: {
  start: string;
  end: string;
  entry_type_id?: string;
}) {
  const query = new URLSearchParams({ start: params.start, end: params.end });
  if (params.entry_type_id) query.set("entry_type_id", params.entry_type_id);
  return get<CalendarEntry[]>(`/api/entries?${query.toString()}`);
}

export function getEntry(id: string) {
  return get<CalendarEntry>(`/api/entries/${id}`);
}

export function createEntry(payload: EntryPayload) {
  return post<CalendarEntry>("/api/entries", payload);
}

export function updateEntry(id: string, payload: EntryPayload) {
  return request<CalendarEntry>(`/api/entries/${id}`, { method: "PUT", body: payload });
}

export function deleteEntry(id: string) {
  return del<{ success: boolean }>(`/api/entries/${id}`);
}

export function listEntryTypes() {
  return get<EntryType[]>("/api/entry-types");
}

export function createEntryType(payload: EntryTypePayload) {
  return post<EntryType>("/api/entry-types", payload);
}

export function updateEntryType(id: string, payload: EntryTypePayload) {
  return request<EntryType>(`/api/entry-types/${id}`, { method: "PUT", body: payload });
}

export function deleteEntryType(id: string) {
  return del<{ success: boolean }>(`/api/entry-types/${id}`);
}
