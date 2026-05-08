import { Box, Link, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type MarkdownTextProps = {
  text: string;
  inverse?: boolean;
};

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const value = match[0];
    if (value.startsWith("**")) {
      nodes.push(
        <Box component="strong" key={`${match.index}-strong`} sx={{ fontWeight: 800 }}>
          {value.slice(2, -2)}
        </Box>,
      );
    } else if (value.startsWith("`")) {
      nodes.push(
        <Box
          component="code"
          key={`${match.index}-code`}
          sx={{
            px: 0.4,
            py: 0.1,
            borderRadius: 0.5,
            bgcolor: "rgba(0, 0, 0, 0.08)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.92em",
          }}
        >
          {value.slice(1, -1)}
        </Box>,
      );
    } else {
      const closeIndex = value.indexOf("](");
      const label = value.slice(1, closeIndex);
      const href = value.slice(closeIndex + 2, -1);
      nodes.push(
        <Link key={`${match.index}-link`} href={href} target="_blank" rel="noreferrer">
          {label}
        </Link>,
      );
    }
    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function MarkdownText({ text, inverse = false }: MarkdownTextProps) {
  const lines = text.split(/\r?\n/);
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (!listItems.length) return;
    const current = listItems;
    listItems = [];
    elements.push(
      <Box component="ul" key={`list-${elements.length}`} sx={{ my: 0.25, pl: 2.5 }}>
        {current.map((item, index) => (
          <Box component="li" key={`${item}-${index}`} sx={{ mb: 0.25 }}>
            <Typography component="span" variant="body2">
              {renderInline(item)}
            </Typography>
          </Box>
        ))}
      </Box>,
    );
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/) ?? trimmed.match(/^\d+\.\s+(.+)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      elements.push(
        <Typography
          key={`heading-${index}`}
          variant={heading[1].length === 1 ? "subtitle1" : "body1"}
          fontWeight={850}
          sx={{ mt: elements.length ? 0.5 : 0 }}
        >
          {renderInline(heading[2])}
        </Typography>,
      );
      return;
    }

    elements.push(
      <Typography key={`paragraph-${index}`} variant="body2">
        {renderInline(trimmed)}
      </Typography>,
    );
  });

  flushList();

  return (
    <Stack
      spacing={0.5}
      sx={{
        color: inverse ? "#fff" : "inherit",
        overflowWrap: "anywhere",
        "& p": { m: 0 },
      }}
    >
      {elements}
    </Stack>
  );
}
