import { useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
import type { CalendarEntry, EntryType } from "./api/focus";
import {
  createEntry,
  createEntryType,
  deleteEntry,
  deleteEntryType,
  getEntry,
  listEntries,
  listEntryTypes,
  updateEntry,
  updateEntryType,
} from "./api/focus";
import { PersonalAgentView } from "./components/agent/PersonalAgentView";
import { CalendarView } from "./components/calendar/CalendarView";
import { EntryDetailView } from "./components/entries/EntryDetailView";
import { EntryDialog } from "./components/entries/EntryDialog";
import { EmailImportView } from "./components/import/EmailImportView";
import { AppShell } from "./components/layout/AppShell";
import { AppSidebar, nextTypeColor } from "./components/layout/AppSidebar";
import { useI18n, useLocale } from "./i18n";
import type { View } from "./types";
import { calendarDays, monthBounds } from "./utils/date";
import type { EntryDraft } from "./utils/entries";
import { cleanDraft, emptyDraft, entryToDraft, groupEntriesByDay } from "./utils/entries";

export default function App() {
  const t = useI18n();
  const locale = useLocale();
  const [view, setView] = useState<View>("calendar");
  const [month, setMonth] = useState(() => new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [draft, setDraft] = useState<EntryDraft>(emptyDraft([]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newType, setNewType] = useState({ name: "", color: nextTypeColor(0) });

  const bounds = useMemo(() => monthBounds(month), [month]);
  const days = useMemo(() => calendarDays(month), [month]);
  const entriesByDay = useMemo(() => groupEntriesByDay(entries), [entries]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [entryRows, typeRows] = await Promise.all([
        listEntries(bounds),
        listEntryTypes(),
      ]);
      setEntries(entryRows);
      setEntryTypes(typeRows);
      setNewType((current) => ({ ...current, color: nextTypeColor(typeRows.length) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.loadCalendar);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.start, bounds.end]);

  function openCreate(date?: string) {
    setEditingId(null);
    setDraft(emptyDraft(entryTypes, date));
    setDialogOpen(true);
  }

  async function openDetail(id: string) {
    setError(null);
    try {
      const entry = await getEntry(id);
      setSelectedEntry(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.openEntry);
    }
  }

  function openEdit(entry: CalendarEntry) {
    setEditingId(entry.id);
    setDraft(entryToDraft(entry));
    setDialogOpen(true);
  }

  async function saveDraft() {
    if (!draft.title.trim()) {
      setError(t.errors.entryTitleRequired);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = cleanDraft(draft);
      const saved = editingId ? await updateEntry(editingId, payload) : await createEntry(payload);
      await loadAll();
      setSelectedEntry(saved);
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.saveEntry);
    } finally {
      setSaving(false);
    }
  }

  async function moveEntryToDate(entryId: string, date: string) {
    setError(null);
    try {
      const entry = await getEntry(entryId);
      await updateEntry(entryId, cleanDraft({ ...entryToDraft(entry), date }));
      await loadAll();
      if (selectedEntry?.id === entryId) setSelectedEntry(await getEntry(entryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.saveEntry);
    }
  }

  async function removeSelectedEntry() {
    if (!selectedEntry || !window.confirm(t.confirm.deleteEntry)) return;
    setSaving(true);
    try {
      await deleteEntry(selectedEntry.id);
      setSelectedEntry(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.deleteEntry);
    } finally {
      setSaving(false);
    }
  }

  async function addEntryType() {
    if (!newType.name.trim()) return;
    try {
      await createEntryType({ name: newType.name.trim(), color: newType.color });
      setNewType({ name: "", color: nextTypeColor(entryTypes.length + 1) });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.createType);
    }
  }

  async function saveEntryType(entryType: EntryType) {
    if (!entryType.name.trim()) return;
    try {
      await updateEntryType(entryType.id, {
        name: entryType.name.trim(),
        color: entryType.color,
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.updateType);
    }
  }

  async function removeEntryType(entryType: EntryType) {
    if (!window.confirm(t.confirm.deleteType(entryType.name))) return;
    try {
      await deleteEntryType(entryType.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.deleteType);
    }
  }

  function changeMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  const monthLabel = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CL", {
    month: "long",
    year: "numeric",
  }).format(month);

  const agentContext = [
    `Visible Focus entries this month: ${entries.length}`,
    `Entry types: ${entryTypes.map((entryType) => entryType.name).join(", ")}`,
  ].join("\n");

  return (
    <AppShell
      sidebar={
        <AppSidebar
          view={view}
          entryTypes={entryTypes}
          newType={newType}
          onViewChange={(next) => {
            setSelectedEntry(null);
            setView(next);
          }}
          onEntryTypeDraftChange={setEntryTypes}
          onNewTypeChange={setNewType}
          onCreateType={() => void addEntryType()}
          onSaveType={(entryType) => void saveEntryType(entryType)}
          onRemoveType={(entryType) => void removeEntryType(entryType)}
        />
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {view === "agent" && <PersonalAgentView context={agentContext} />}
      {view === "import" && <EmailImportView onImported={() => void loadAll()} />}
      {view === "calendar" && selectedEntry && (
        <EntryDetailView
          entry={selectedEntry}
          saving={saving}
          onBack={() => setSelectedEntry(null)}
          onEdit={() => openEdit(selectedEntry)}
          onDelete={removeSelectedEntry}
        />
      )}
      {view === "calendar" && !selectedEntry && (
        <CalendarView
          days={days}
          month={month}
          entriesByDay={entriesByDay}
          loading={loading}
          monthLabel={monthLabel}
          onChangeMonth={changeMonth}
          onCreate={openCreate}
          onOpen={(id) => void openDetail(id)}
          onMove={(entryId, date) => void moveEntryToDate(entryId, date)}
        />
      )}
      <EntryDialog
        open={dialogOpen}
        draft={draft}
        entryTypes={entryTypes}
        editing={Boolean(editingId)}
        saving={saving}
        onClose={() => setDialogOpen(false)}
        onSave={() => void saveDraft()}
        onChange={setDraft}
      />
    </AppShell>
  );
}
