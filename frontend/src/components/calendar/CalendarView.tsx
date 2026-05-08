import { Add, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import type { CalendarEntry } from "../../api/focus";
import { calendarHeader, primary, primaryDark, surfaceBorder, todayFill } from "../../constants";
import { useI18n } from "../../i18n";
import { isoDate } from "../../utils/date";

export function CalendarView({
  days,
  month,
  entriesByDay,
  loading,
  monthLabel,
  onChangeMonth,
  onCreate,
  onOpen,
  onMove,
}: {
  days: Date[];
  month: Date;
  entriesByDay: Map<string, CalendarEntry[]>;
  loading: boolean;
  monthLabel: string;
  onChangeMonth: (delta: number) => void;
  onCreate: (date?: string) => void;
  onOpen: (id: string) => void;
  onMove: (entryId: string, date: string) => void;
}) {
  const t = useI18n();
  return (
    <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title={t.calendar.previousMonth}>
            <IconButton onClick={() => onChangeMonth(-1)}>
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Typography variant="h5" fontWeight={850} sx={{ textTransform: "capitalize" }}>
            {monthLabel}
          </Typography>
          <Tooltip title={t.calendar.nextMonth}>
            <IconButton onClick={() => onChangeMonth(1)}>
              <ChevronRight />
            </IconButton>
          </Tooltip>
        </Stack>
        <Button startIcon={<Add />} variant="contained" onClick={() => onCreate()}>
          {t.common.create}
        </Button>
      </Stack>
      {loading ? (
        <Paper sx={{ p: 4, textAlign: "center", flex: 1, minHeight: 0 }}>
          {t.calendar.loading}
        </Paper>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}>
          <CalendarGrid
            days={days}
            month={month}
            entriesByDay={entriesByDay}
            onCreate={onCreate}
            onOpen={onOpen}
            onMove={onMove}
          />
        </Box>
      )}
    </Stack>
  );
}

function CalendarGrid({
  days,
  month,
  entriesByDay,
  onCreate,
  onOpen,
  onMove,
}: {
  days: Date[];
  month: Date;
  entriesByDay: Map<string, CalendarEntry[]>;
  onCreate: (date: string) => void;
  onOpen: (id: string) => void;
  onMove: (entryId: string, date: string) => void;
}) {
  const t = useI18n();
  const today = isoDate(new Date());
  return (
    <Paper
      sx={{
        width: "100%",
        maxHeight: "100%",
        alignSelf: "flex-start",
        overflow: "auto",
        border: `1px solid ${surfaceBorder}`,
        borderRadius: 1,
        bgcolor: "#fff",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          bgcolor: calendarHeader,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        {t.calendar.weekdays.map((day) => (
          <Box key={day} sx={{ p: 1, fontWeight: 800, fontSize: 13 }}>
            {day}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {days.map((day, index) => {
          const key = isoDate(day);
          const dayEntries = entriesByDay.get(key) ?? [];
          const outside = day.getMonth() !== month.getMonth();
          const isToday = key === today;
          const isLastColumn = index % 7 === 6;
          const isLastRow = index >= days.length - 7;
          return (
            <Box
              key={key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const entryId = event.dataTransfer.getData("text/focus-entry-id");
                if (entryId) onMove(entryId, key);
              }}
              sx={{
                minHeight: 118,
                p: 1,
                borderTop: `1px solid ${surfaceBorder}`,
                borderRight: isLastColumn ? "none" : `1px solid ${surfaceBorder}`,
                borderBottom: isLastRow ? "none" : `1px solid ${surfaceBorder}`,
                bgcolor: isToday ? todayFill : outside ? "#f9fbfa" : "#fff",
                boxShadow: isToday ? `inset 0 0 0 2px ${primary}` : "none",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isToday ? 900 : 600,
                    bgcolor: isToday ? primary : "transparent",
                    color: isToday ? "#fff" : outside ? "text.disabled" : "text.primary",
                    px: isToday ? 0.75 : 0,
                    borderRadius: 10,
                  }}
                >
                  {day.getDate()}
                </Typography>
                <Tooltip title={t.calendar.createEntry}>
                  <IconButton size="small" onClick={() => onCreate(key)}>
                    <Add fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {dayEntries.map((entry) => (
                  <Button
                    key={entry.id}
                    size="small"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/focus-entry-id", entry.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onOpen(entry.id)}
                    sx={{
                      minHeight: 34,
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 0.65,
                      px: 1,
                      py: 0.5,
                      color: "#fff",
                      bgcolor: entry.entry_type_color || primaryDark,
                      textTransform: "none",
                      fontSize: 12,
                      lineHeight: 1.2,
                      "&:hover": { bgcolor: entry.entry_type_color || primaryDark },
                    }}
                  >
                    {entry.time && (
                      <Box component="span" sx={{ flex: "0 0 auto", fontWeight: 850 }}>
                        {entry.time}
                      </Box>
                    )}
                    <Box
                      component="span"
                      sx={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                        textAlign: "left",
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {entry.title}
                    </Box>
                  </Button>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
