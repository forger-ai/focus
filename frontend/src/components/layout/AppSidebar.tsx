import {
  Add,
  CalendarMonth,
  DeleteOutline,
  Email,
  Forum,
  Settings,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import type { EntryType } from "../../api/focus";
import { typeColors } from "../../constants";
import { useI18n } from "../../i18n";
import type { View } from "../../types";

export function AppSidebar({
  view,
  entryTypes,
  newType,
  onViewChange,
  onEntryTypeDraftChange,
  onNewTypeChange,
  onCreateType,
  onSaveType,
  onRemoveType,
}: {
  view: View;
  entryTypes: EntryType[];
  newType: { name: string; color: string };
  onViewChange: (view: View) => void;
  onEntryTypeDraftChange: (types: EntryType[]) => void;
  onNewTypeChange: (draft: { name: string; color: string }) => void;
  onCreateType: () => void;
  onSaveType: (entryType: EntryType) => void;
  onRemoveType: (entryType: EntryType) => void;
}) {
  const t = useI18n();
  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 236, md: 280 },
        flex: "0 0 auto",
        bgcolor: "#ffffff",
        borderRight: "1px solid",
        borderColor: "divider",
        p: 2,
        overflowY: "auto",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.2}>
          <Typography variant="h5" fontWeight={850}>
            Focus
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.app.subtitle}
          </Typography>
        </Stack>
        <List dense disablePadding>
          <NavItem
            icon={<CalendarMonth />}
            label={t.nav.calendar}
            selected={view === "calendar"}
            onClick={() => onViewChange("calendar")}
          />
          <NavItem
            icon={<Forum />}
            label={t.nav.personalAgent}
            selected={view === "agent"}
            onClick={() => onViewChange("agent")}
          />
          <NavItem
            icon={<Email />}
            label={t.nav.emailImport}
            selected={view === "import"}
            onClick={() => onViewChange("import")}
          />
        </List>
        <Divider />
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Settings fontSize="small" color="action" />
            <Typography fontWeight={800}>{t.types.title}</Typography>
          </Stack>
          {entryTypes.map((entryType) => (
            <Stack key={entryType.id} direction="row" spacing={0.75} alignItems="center">
              <TextField
                size="small"
                value={entryType.name}
                onChange={(event) =>
                  onEntryTypeDraftChange(
                    entryTypes.map((item) =>
                      item.id === entryType.id ? { ...item, name: event.target.value } : item,
                    ),
                  )
                }
                onBlur={(event) => onSaveType({ ...entryType, name: event.target.value })}
                inputProps={{ "aria-label": t.types.name }}
                sx={{ flex: 1 }}
              />
              <Box
                component="input"
                type="color"
                value={entryType.color}
                aria-label={t.types.color}
                onChange={(event) => {
                  const color = event.target.value;
                  onEntryTypeDraftChange(
                    entryTypes.map((item) =>
                      item.id === entryType.id ? { ...item, color } : item,
                    ),
                  );
                  onSaveType({ ...entryType, color });
                }}
                sx={{ width: 34, height: 34, border: 0, p: 0, bgcolor: "transparent" }}
              />
              <Tooltip title={t.types.delete}>
                <IconButton size="small" onClick={() => onRemoveType(entryType)}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
          <Stack direction="row" spacing={0.75}>
            <TextField
              size="small"
              placeholder={t.types.newPlaceholder}
              value={newType.name}
              onChange={(event) => onNewTypeChange({ ...newType, name: event.target.value })}
              sx={{ flex: 1 }}
            />
            <Box
              component="input"
              type="color"
              value={newType.color}
              onChange={(event) => onNewTypeChange({ ...newType, color: event.target.value })}
              sx={{ width: 34, height: 34, border: 0, p: 0, bgcolor: "transparent" }}
            />
          </Stack>
          <Button
            size="small"
            startIcon={<Add />}
            variant="outlined"
            onClick={onCreateType}
            disabled={!newType.name.trim()}
          >
            {t.types.create}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function NavItem({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <ListItemButton selected={selected} onClick={onClick} sx={{ borderRadius: 1 }}>
      <ListItemIcon sx={{ minWidth: 34 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

export function nextTypeColor(count: number) {
  return typeColors[count % typeColors.length];
}
