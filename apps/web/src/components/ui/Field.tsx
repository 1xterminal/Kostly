import React, { useId } from "react";
import * as styles from "./Field.css";
import { Symbols } from "./MaterialSymbols";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  trailingIcon?: React.ReactNode;
  leadingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, placeholder, leadingIcon, trailingIcon, style, ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;

    return (
      <div className={styles.base} style={style}>
        {/* Render top label if provided */}
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}

        <div className={styles.container}>
          {/* Render leading icon if provided */}
          {leadingIcon && (
            <span className={styles.iconWrapper}>{leadingIcon}</span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={styles.inputField}
            placeholder={placeholder}
            {...props}
          />

          {/* Render trailing icon if provided */}
          {trailingIcon && (
            <span className={styles.iconWrapper}>{trailingIcon}</span>
          )}
        </div>
      </div>
    );
  },
);


interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "label"> {
  label?: string;
  leadingIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, leadingIcon, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = props.id || generatedId;

    return (
      <div className={styles.base}>
        {/* Reuses your input label style */}
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}

        {/* Reuses your input frame container */}
        <div className={styles.container}>
          {leadingIcon && (
            <span className={styles.iconWrapper}>{leadingIcon}</span>
          )}

          <select
            ref={ref}
            id={selectId}
            className={styles.selectField}
            {...props}
          >
            {children}
          </select>

          {/* Renders our clean custom chevron if not explicitly hidden */}
          {/*{!hideDefaultArrow && (
          )}*/}
            <span className={styles.selectArrow} style={{ pointerEvents: "none" }}>
              <Symbols name="keyboard_arrow_down" />
            </span>
        </div>
      </div>
    );
  }
);


// export default Input;
