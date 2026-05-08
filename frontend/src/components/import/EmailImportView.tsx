import { Email } from "@mui/icons-material";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { defaultImportDays } from "../../constants";
import { useI18n } from "../../i18n";
import { startEmailImportTask } from "../../utils/forgerTasks";
import { TaskStatus } from "../tasks/TaskStatus";

export function EmailImportView({ onImported }: { onImported: () => void }) {
  const t = useI18n();
  const [days, setDays] = useState(defaultImportDays);
  const [task, setTask] = useState<ForgerCodexTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running =
    task?.status === "queued" || task?.status === "running" || task?.status === "needs_permission";

  useEffect(() => {
    if (!window.forgerApp || !task) return undefined;
    const unsubscribe = window.forgerApp.onCodexTaskUpdated((event) => {
      if (event.task.runId !== task.runId) return;
      setTask(event.task);
      if (event.task.status === "completed") onImported();
    });
    return unsubscribe;
  }, [onImported, task]);

  async function startImport() {
    setError(null);
    try {
      const started = await startEmailImportTask(days);
      setTask(started);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.importStart);
    }
  }

  async function refreshTask() {
    if (!task || !window.forgerApp) return;
    const updated = await window.forgerApp.getCodexTask(task.runId);
    if (updated) setTask(updated);
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 820, width: "100%", mx: "auto", overflowY: "auto" }}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={850}>
          {t.importView.title}
        </Typography>
        <Typography color="text.secondary">{t.importView.description}</Typography>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!window.forgerApp && <Alert severity="info">{t.importView.forgerOnly}</Alert>}
      <Paper sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
          <TextField
            label={t.importView.days}
            type="number"
            value={days}
            inputProps={{ min: 1, max: 30 }}
            onChange={(event) => setDays(Number(event.target.value))}
            sx={{ width: { xs: "100%", sm: 160 } }}
          />
          <Button
            startIcon={<Email />}
            variant="contained"
            onClick={startImport}
            disabled={!window.forgerApp || running}
          >
            {running ? t.importView.running : t.importView.start}
          </Button>
        </Stack>
      </Paper>
      <TaskStatus task={task} onRefresh={() => void refreshTask()} />
    </Stack>
  );
}
