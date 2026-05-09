/// <reference types="vite/client" />

type ForgerAgent = {
  id: string;
  title: string;
  description?: string;
  initialPrompt: string;
  model?: string;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
};

type ForgerAppContext = {
  locale?: string;
  agents?: ForgerAgent[];
};

type ForgerConversationMessage = {
  messageId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

type ForgerConversationRun = {
  runId: string;
  status: "queued" | "running" | "needs_permission" | "completed" | "failed" | "canceled";
  error?: string;
  progressLog?: string[];
};

type ForgerConversation = {
  conversationId: string;
  appId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ForgerConversationMessage[];
  activeRun?: ForgerConversationRun;
};

type ForgerConversationEvent = {
  type: string;
  conversation: ForgerConversation;
  run?: ForgerConversationRun;
  message?: ForgerConversationMessage;
  progress?: string;
};

type ForgerCodexTask = {
  runId: string;
  appId: string;
  templateId: string;
  status: "queued" | "running" | "needs_permission" | "completed" | "failed" | "canceled";
  createdAt: string;
  updatedAt: string;
  resultText?: string;
  error?: string;
  progressLog?: string[];
};

type ForgerCodexTaskEvent = {
  task: ForgerCodexTask;
};

type ForgerCodexTaskArgumentValue =
  | string
  | number
  | boolean
  | null
  | { type: "string"; value: string };

interface Window {
  forgerApp?: {
    getContext: () => Promise<ForgerAppContext>;
    startCodexTask: (input: {
      templateId: string;
      locale?: string;
      arguments?: Record<string, ForgerCodexTaskArgumentValue>;
      variables?: Record<string, string | number | boolean | null>;
    }) => Promise<ForgerCodexTask>;
    getCodexTask: (runId: string) => Promise<ForgerCodexTask | null>;
    onCodexTaskUpdated: (listener: (event: ForgerCodexTaskEvent) => void) => () => void;
    createCodexConversation: (input?: {
      title?: string;
      agentId?: string;
      metadata?: Record<string, string | number | boolean | null>;
    }) => Promise<ForgerConversation>;
    sendCodexConversationMessage: (input: {
      conversationId: string;
      message: string;
      context?: string;
    }) => Promise<ForgerConversation>;
    listCodexConversations: () => Promise<ForgerConversation[]>;
    onCodexConversationEvent: (
      listener: (event: ForgerConversationEvent) => void,
    ) => () => void;
  };
}
