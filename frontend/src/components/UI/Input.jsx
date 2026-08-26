import React, { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Input — labelled, autofillable, 44px tall, with a real password toggle.
 *
 * Fixes carried in from the audit:
 *   · `autoComplete` existed nowhere in the app (0 occurrences)
 *   · no password field had a show/hide toggle
 *   · borders sat at ~1.3:1 — below the 3:1 WCAG 1.4.11 floor for the
 *     boundary of a control. --border-control is 3.83:1 / 4.39:1.
 *
 * Backwards-compatible with the previous Input.
 */
const Input = React.forwardRef(function Input(
  {
    label,
    name,
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    hint,
    required = false,
    disabled = false,
    readOnly = false,
    icon,
    className = "",
    inputClassName = "",
    autoComplete,
    inputMode,
    ...props
  },
  ref,
) {
  const reactId = useId();
  const id = name || reactId;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  // Give mobile the right keyboard without the caller having to think about it.
  const resolvedInputMode =
    inputMode ||
    (type === "email" ? "email" : type === "tel" ? "tel" : type === "number" ? "numeric" : undefined);

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
        {icon ? (
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-content-muted"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          inputMode={resolvedInputMode}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "w-full rounded-control bg-surface text-content",
            "min-h-touch px-3.5 py-3 text-[16px]", // 16px: stops iOS auto-zoom
            "border transition-colors duration-base ease-out",
            "placeholder:text-content-muted",
            "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-focusring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "read-only:bg-surface-sunken",
            "[touch-action:manipulation]",
            error ? "border-error" : "border-line-control focus:border-brand",
            icon ? "pl-11" : "",
            isPassword ? "pr-12" : "",
            inputClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-1 top-1/2 grid h-touch w-touch -translate-y-1/2 place-items-center rounded-control text-content-muted transition-colors duration-base hover:text-content focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-focusring"
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            tabIndex={disabled ? -1 : 0}
          >
            {revealed ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-body-sm text-error"
        >
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

export default Input;
