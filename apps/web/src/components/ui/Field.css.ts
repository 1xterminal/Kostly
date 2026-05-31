// Input.css.ts
import { style } from "@vanilla-extract/css";
import { themeVars } from "@/theme/theme.css";
import { colors } from "@/theme/palette.css";

// The outer layout wrapper (manages the label + input gap)
export const base = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minHeight: "40px",
  fontFamily: "sans-serif",
});

// Top caption/label style (Frame 4)
export const label = style({
  // fontSize: "22px",
  fontWeight: "500",
  color: "#111111",
  letterSpacing: "-0.01em",
  fontSize: "14px",
  opacity: 0.5
});

// The input container frame that holds the icons and the raw input field
export const container = style({
  display: "flex",
  flex: 1,
  alignItems: "center",
  gap: "8px",
  // height: "100%",
  minHeight: "40px",
  paddingInline: "12px",
  borderRadius: "8px",
  border: "1px solid color-mix(in srgb, black 25%, transparent)",
  background: `linear-gradient(to bottom, white 0%, ${colors.gray[10]} 100%)`,

  position: "relative",

  // Replicating the smooth inset layout shadow from your design
  boxShadow: "inset 0 3px 6px rgba(0, 0, 0, 0.04)",
  transition: "all 0.2s ease-out",

  selectors: {
    // Elegant focus ring state
    "&:focus-within": {
      borderColor: themeVars.accent,
      boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.02), 0 0 0 4px color-mix(in srgb, ${themeVars.accent} 15%, transparent)`,
    },
    "&:has(input:disabled)": {
      opacity: 0.5,
    },
  },

  // ":disabled": {
  //   opacity: 0.5,
  // }
});

// The underlying native input element
export const inputField = style({
  flex: 1,
  height: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  // fontSize: "22px",
  color: "#262626",
  width: "100%",

  "::placeholder": {
    color: "#8c8c8c",
  },

  ":disabled": {
    opacity: 0.5,
  }
});

// Centered shell for icons
export const iconWrapper = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});


export const selectField = style({
  flex: 1,
  height: "100%",
  border: "none",
  background: "transparent",
  outline: "none",
  // color: "#262626",
  width: "100%",
  cursor: "pointer",

  // CRITICAL: Removes the default browser dropdown arrow
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
});

export const selectArrow = style([iconWrapper, {
  position: "absolute",
  marginInline: "12px",
  right: 0,
}]);
