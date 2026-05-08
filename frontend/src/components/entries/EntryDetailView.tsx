import { ArrowBack, CalendarMonth, DeleteOutline, Edit } from "@mui/icons-material";
import { Box, Button, Chip, Divider, IconButton, Paper, Stack, Typography } from "@mui/material";
import type { CalendarEntry } from "../../api/focus";
import { useI18n } from "../../i18n";
import { MarkdownText } from "../common/MarkdownText";

export function EntryDetailView({
  entry,
  saving,
  onBack,
  onEdit,
  onDelete,
}: {
  entry: CalendarEntry;
  saving: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useI18n();
  return (
    <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button startIcon={<ArrowBack />} onClick={onBack}>
          {t.common.back}
        </Button>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Edit />} variant="outlined" onClick={onEdit}>
            {t.common.edit}
          </Button>
          <IconButton color="error" onClick={onDelete} disabled={saving}>
            <DeleteOutline />
          </IconButton>
        </Stack>
      </Stack>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 1 }}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight={850}>
              {entry.title}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={entry.entry_type_name}
                sx={{ bgcolor: entry.entry_type_color, color: "#fff", fontWeight: 700 }}
              />
              <Chip
                icon={<CalendarMonth />}
                label={entry.time ? `${entry.date} ${entry.time}` : `${entry.date} ${t.entry.allDay}`}
                variant="outlined"
              />
              {entry.source && <Chip label={entry.source} variant="outlined" />}
            </Stack>
          </Stack>
          <Divider />
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t.entry.notes}
            </Typography>
            {entry.notes?.trim() ? (
              <MarkdownText text={entry.notes} />
            ) : (
              <Typography>{t.entry.noNotes}</Typography>
            )}
          </Box>
          {(entry.gmail_thread_id || entry.gmail_message_id) && (
            <>
              <Divider />
              <Stack spacing={0.5}>
                <Typography variant="overline" color="text.secondary">
                  Gmail
                </Typography>
                {entry.gmail_thread_id && (
                  <Typography variant="body2">Thread: {entry.gmail_thread_id}</Typography>
                )}
                {entry.gmail_message_id && (
                  <Typography variant="body2">Message: {entry.gmail_message_id}</Typography>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
