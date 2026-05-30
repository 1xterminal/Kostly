import React from "react";
import { ButtonStyles } from "./Button.css";
import type { ButtonVariants } from "./Button.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action?: ButtonVariants["action"];
  emphasis?: ButtonVariants["emphasis"];
  onClick?: () => void;
}

export default function Button({
  emphasis,
  action,
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={ButtonStyles({ emphasis, action })}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
