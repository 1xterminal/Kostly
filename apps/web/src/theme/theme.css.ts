import { createThemeContract, createTheme } from "@vanilla-extract/css";
import { colors } from "./palette.css";

export const themeVars = createThemeContract({
  accent: "",
  destructive: "",
  background: "",
  text: "",
});

export const lightTheme = createTheme(themeVars, {
  accent: colors.blue,
  destructive: colors.red,
  background: colors.gray[100],
  text: colors.gray[100],
});
