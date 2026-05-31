import { createGlobalTheme } from "@vanilla-extract/css";

export const colors = createGlobalTheme(":root", {
  red: "#E33119",
  orange: "#F45712",
  yellow: "#F3D42A",
  green: "#11E468",
  cyan: "#0E9AF1",
  blue: "#4433DB",
  purple: "#9A13D9",
  pink: "#EA0EA8",

  gray: {
    10: "#fafafa",
    20: "#f5f5f5",
    30: "#e5e5e5",
    40: "#d4d4d4",
    50: "#a3a3a3",
    60: "#737373",
    70: "#525252",
    80: "#404040",
    90: "#262626",
    100: "#131313",
  },
});
