import { recipe } from "@vanilla-extract/recipes";
import { colors } from "@/theme/palette.css";
import { themeVars } from "@/theme/theme.css";
import { createVar } from "@vanilla-extract/css";

const accentColor = createVar();

export const ButtonStyles = recipe({
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    minHeight: "40px",
    paddingInline: "12px",
    fontWeight: 600,
    outline: "1px solid",
    outlineOffset: "-1px",
    borderRadius: "8px",
    boxSizing: "border-box",
    cursor: "pointer",
    whiteSpace: "nowrap",
    position: "relative", // Required to position the background layer
    zIndex: 1, // Ensures content stays above pseudo-elements
    overflow: "hidden", // Keeps the hover effect clipped to border-radius
    transition: "all 0.2s cubic-bezier(0.45, 0, 0.55, 1)",

    ":disabled": {
      vars: { [accentColor]: colors.gray[50] },
      opacity: 0.5,
      cursor: "not-allowed",
      boxShadow: `0 0 0px transparent`,
    }
  },

  variants: {
    action: {
      normal: {
        vars: { [accentColor]: themeVars.accent },
      },
      destructive: {
        vars: { [accentColor]: themeVars.destructive },
      },
      suggested: {
        vars: { [accentColor]: colors.green },
      },
      mono: {
        vars: { [accentColor]: colors.gray[100] },
      },
    },
    emphasis: {
      filled: {
        color: "white",
        outlineColor: `color-mix(in srgb, ${colors.gray[100]} 25%, transparent)`,
        boxShadow: `0 1px 4px color-mix(in srgb, ${accentColor} 50%, transparent)`,
        background: `linear-gradient(
            to right,
            ${accentColor} 0%,
            color-mix(in srgb, white 20%, ${accentColor}) 100%
          )`,

        // 1. Define the hover gradient on a hidden pseudo-layer
        "::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          zIndex: -1, // Sits directly behind text but above the base background
          opacity: 0,
          background: `linear-gradient(
              to right,
              color-mix(in srgb, white 10%, ${accentColor}) 0%,
              color-mix(in srgb, white 30%, ${accentColor}) 100%
            )`,
          transition: "all 0.2s cubic-bezier(0.45, 0, 0.55, 1)",
        },

        ":hover": {
          boxShadow: `0 2px 8px color-mix(in srgb, ${accentColor} 60%, transparent)`,
        },

        // 2. Fade the hover layer in when parent is hovered
        selectors: {
          ["&:hover::after"]: {
            opacity: 1,
          },
        },
      },
      outlined: {
        color: accentColor,
        outlineColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
        boxShadow: `0 1px 4px color-mix(in srgb, ${accentColor} 25%, transparent)`,
        background: `linear-gradient(
            to right,
            color-mix(in srgb, ${accentColor} 10%, white) 0%,
            color-mix(in srgb, ${accentColor} 5%, white) 100%
          )`,

        "::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          zIndex: -1, // Sits directly behind text but above the base background
          opacity: 0,
          background: `linear-gradient(
              to right,
              color-mix(in srgb, ${accentColor} 20%, white) 0%,
              color-mix(in srgb, ${accentColor} 10%, white) 100%
            )`,
          transition: "all 0.2s cubic-bezier(0.45, 0, 0.55, 1)",
        },

        ":hover": {
          boxShadow: `0 2px 8px color-mix(in srgb, ${accentColor} 30%, transparent)`,
          outlineColor: accentColor,
        },

        selectors: {
          ["&:hover::after"]: {
            opacity: 1,
          },
        },
      },
    },
  },

  defaultVariants: {
    action: "normal",
    emphasis: "filled",
  },
});

export type ButtonVariants = NonNullable<Parameters<typeof ButtonStyles>[0]>;
