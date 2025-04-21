import { createTheme, MantineColorsTuple } from "@mantine/core";

// Custom primary color palette
const primary: MantineColorsTuple = [
  "#f0f9ff",
  "#e0f2fe",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9", // Primary shade 6 - Main color
  "#0284c7",
  "#0369a1",
  "#075985",
  "#0c4a6e",
];

// Custom secondary color palette
const secondary: MantineColorsTuple = [
  "#f5f3ff",
  "#ede9fe",
  "#ddd6fe",
  "#c4b5fd",
  "#a78bfa",
  "#8b5cf6", // Secondary shade 6 - Main color
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#4c1d95",
];

// Property management system theme
const theme = createTheme({
  primaryColor: "primary",
  primaryShade: 6,
  colors: {
    primary,
    secondary,
  },
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  headings: {
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "600",
  },
  defaultRadius: "md",
  // Other theme customizations
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        shadow: "sm",
        radius: "md",
        p: "lg",
      },
    },
  },
});

export default theme;
