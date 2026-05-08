import { AddComment, ContentCopy, Forum, Send } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { primaryDark } from "../../constants";
import { useI18n } from "../../i18n";
import { MarkdownText } from "../common/MarkdownText";

const defaultAgent: ForgerAgent = {
  id: "personal-agent",
  title: "Personal Agent",
  description: "Reviews your Focus calendar and helps turn Gmail findings into entries.",
  initialPrompt:
    "Act as a personal assistant for Focus. Use Focus MCP tools to inspect, create, update, and delete calendar entries when the user asks. Summary entries are all-day daily summaries; inspect the date first and update the existing Summary entry instead of creating a duplicate. Use official Forger Gmail tools only when the user asks to review email. Summarize proposed changes before large edits and never send email.",
};

export function PersonalAgentView({ context }: { context: string }) {
  const t = useI18n();
  const [agent, setAgent] = useState<ForgerAgent>(defaultAgent);
  const [conversation, setConversation] = useState<ForgerConversation | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.forgerApp) return undefined;
    let unsubscribe: (() => void) | undefined;
    void window.forgerApp.getContext().then((appContext) => {
      setAgent(appContext.agents?.find((candidate) => candidate.id === defaultAgent.id) ?? defaultAgent);
    });
    void window.forgerApp.listCodexConversations().then((rows) => {
      setConversation(rows.find((row) => row.title === defaultAgent.title) ?? rows[0] ?? null);
    });
    unsubscribe = window.forgerApp.onCodexConversationEvent((event) => {
      setConversation(event.conversation);
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages.length, conversation?.activeRun?.progressLog?.length]);

  async function ensureConversation() {
    if (conversation) return conversation;
    if (!window.forgerApp) throw new Error(t.errors.agentUnavailable);
    const created = await window.forgerApp.createCodexConversation({
      title: agent.title,
      agentId: agent.id,
      metadata: { agentId: agent.id },
    });
    setConversation(created);
    return created;
  }

  async function sendMessage() {
    const trimmed = message.trim();
    if (!trimmed || !window.forgerApp || isRunning) return;
    setError(null);
    try {
      const target = await ensureConversation();
      setMessage("");
      const next = await window.forgerApp.sendCodexConversationMessage({
        conversationId: target.conversationId,
        message: trimmed,
        context,
      });
      setConversation(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.agentSend);
    }
  }

  async function newConversation() {
    if (!window.forgerApp) return;
    const created = await window.forgerApp.createCodexConversation({
      title: agent.title,
      agentId: agent.id,
      metadata: { agentId: agent.id },
    });
    setConversation(created);
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    window.setTimeout(() => setCopiedMessageId(null), 1200);
  }

  const activeRun = conversation?.activeRun;
  const isRunning =
    activeRun?.status === "queued" ||
    activeRun?.status === "running" ||
    activeRun?.status === "needs_permission";
  const progress = activeRun?.progressLog?.slice(-1)[0];

  return (
    <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.3}>
          <Typography variant="h4" fontWeight={850}>
            {agent.title}
          </Typography>
          <Typography color="text.secondary">{agent.description}</Typography>
        </Stack>
        <Button startIcon={<AddComment />} onClick={() => void newConversation()}>
          {t.agent.newChat}
        </Button>
      </Stack>
      {!window.forgerApp && <Alert severity="info">{t.agent.forgerOnly}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ flex: 1, minHeight: 0, p: 1.5, overflow: "hidden", borderRadius: 1 }}>
        <Stack ref={scrollRef} spacing={1.25} sx={{ height: "100%", overflowY: "auto" }}>
          {!conversation?.messages.length && (
            <Stack sx={{ minHeight: "100%", alignItems: "center", justifyContent: "center" }}>
              <Forum color="primary" />
              <Typography color="text.secondary">{t.agent.empty}</Typography>
            </Stack>
          )}
          {conversation?.messages.map((item) => {
            const assistant = item.role === "assistant";
            return (
              <Box
                key={item.messageId}
                sx={{
                  alignSelf: assistant ? "flex-start" : "flex-end",
                  maxWidth: "78%",
                  bgcolor: assistant ? "#f2f5f4" : primaryDark,
                  color: assistant ? "text.primary" : "#fff",
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  whiteSpace: "pre-wrap",
                }}
              >
                <Stack spacing={0.75}>
                  <MarkdownText text={item.text} inverse={!assistant} />
                  {assistant && (
                    <Tooltip title={copiedMessageId === item.messageId ? t.common.copied : t.common.copy}>
                      <IconButton size="small" onClick={() => void copy(item.text, item.messageId)}>
                        <ContentCopy fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            );
          })}
          {progress && <Typography variant="body2" color="text.secondary">{progress}</Typography>}
        </Stack>
      </Paper>
      <Stack direction="row" spacing={1}>
        <TextField
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void sendMessage();
          }}
          placeholder={t.agent.placeholder}
          fullWidth
          multiline
          maxRows={4}
          disabled={!window.forgerApp || isRunning}
        />
        <Button
          endIcon={<Send />}
          variant="contained"
          onClick={() => void sendMessage()}
          disabled={!window.forgerApp || isRunning || !message.trim()}
        >
          {t.agent.send}
        </Button>
      </Stack>
    </Stack>
  );
}
