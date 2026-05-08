import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import type { EntryType } from "../../api/focus";
import { useI18n } from "../../i18n";
import type { EntryDraft } from "../../utils/entries";

export function EntryDialog({
  open,
  draft,
  entryTypes,
  editing,
  saving,
  onClose,
  onSave,
  onChange,
}: {
  open: boolean;
  draft: EntryDraft;
  entryTypes: EntryType[];
  editing: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (draft: EntryDraft) => void;
}) {
  const t = useI18n();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? t.entry.edit : t.entry.create}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t.entry.title}
            value={draft.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            autoFocus
            required
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label={t.entry.date}
              type="date"
              value={draft.date}
              onChange={(event) => onChange({ ...draft, date: event.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              label={t.entry.time}
              type="time"
              value={draft.time ?? ""}
              onChange={(event) => onChange({ ...draft, time: event.target.value || null })}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>
          <FormControl fullWidth>
            <InputLabel>{t.entry.type}</InputLabel>
            <Select
              label={t.entry.type}
              value={draft.entry_type_id}
              onChange={(event) => onChange({ ...draft, entry_type_id: event.target.value })}
            >
              {entryTypes.map((entryType) => (
                <MenuItem key={entryType.id} value={entryType.id}>
                  {entryType.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t.entry.notes}
            value={draft.notes ?? ""}
            onChange={(event) => onChange({ ...draft, notes: event.target.value })}
            multiline
            minRows={6}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.common.cancel}</Button>
        <Button variant="contained" onClick={onSave} disabled={saving || !draft.title.trim()}>
          {saving ? t.common.saving : t.common.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
