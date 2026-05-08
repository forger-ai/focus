import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { appBackground } from "../../constants";

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box sx={{ height: "100vh", display: "flex", bgcolor: appBackground, overflow: "hidden" }}>
      {sidebar}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          minHeight: 0,
          p: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
