import { Alert, Button, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useI18n } from "../../i18n";
import { MarkdownText } from "../common/MarkdownText";

export function TaskStatus({
  task,
  onRefresh,
}: {
  task: ForgerCodexTask | null;
  onRefresh: () => void;
}) {
  const t = useI18n();
  if (!task) return null;
  const running = task.status === "queued" || task.status === "running" || task.status === "needs_permission";
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography fontWeight={800}>{t.importView.latestRun}</Typography>
          <Button size="small" onClick={onRefresh}>
            {t.common.refresh}
          </Button>
        </Stack>
        {running && <LinearProgress />}
        <Typography variant="body2" color="text.secondary">
          {t.importView.status}: {task.status}
        </Typography>
        {task.progressLog?.slice(-3).map((line, index) => (
          <Typography key={`${line}-${index}`} variant="body2">
            {line}
          </Typography>
        ))}
        {task.resultText && (
          <Alert severity="success">
            <MarkdownText text={task.resultText} />
          </Alert>
        )}
        {task.error && (
          <Alert severity="error">
            <MarkdownText text={task.error} />
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
