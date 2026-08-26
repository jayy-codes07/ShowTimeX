import React, { useId } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Select — the styled, labelled counterpart to Input.
 *
 * Replaces five raw <select> elements that inherited `.input-field` and so
 * carried the wrong height, no visible label on some pages, and the native
 * arrow on top of a custom one.
 */
const Select = React.forwardRef(function Select(
  {
    label,
    name,
    value,
    onChange,
    options = [],
    placeholder,
    error,
    hint,
    required = false,
    disabled = false,
    className = "",
    children,
    ...props
  },
  ref,
) {
  const reactId = useId();
  const id = name || reactId;
  const describedBy =
    [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-2 block text-body-sm font-medium text-content"
        >
          {label}
          {required ? (
            <span className="ml-1 text-error" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="relative">
        <select
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "w-full appearance-none rounded-control bg-surface text-content",
            "min-h-touch py-3 pl-3.5 pr-10 text-[16px]",
            "border transition-colors duration-base ease-out",
            "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-focusring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[touch-action:manipulation]",
            error ? "border-error" : "border-line-control focus:border-brand",
          ].join(" ")}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
          {children}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
          aria-hidden="true"
        />
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-body-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-body-sm text-content-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
