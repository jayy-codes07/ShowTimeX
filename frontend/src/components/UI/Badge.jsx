import React from "react";

/**
 * Badge — status, always with a shape as well as a colour.
 *
 * The dot is not decoration: WCAG `color-not-only` means a status must not be
 * carried by hue alone. Pass `icon` for a stronger signal where it matters.
 */
const TONES = {
  neutral: "bg-surface-sunken text-content-muted",
  brand: "bg-brand-soft text-brand-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[11px] gap-1.5",
  md: "px-2.5 py-1 text-[11.5px] gap-1.5",
};

const Badge = ({
  children,
  tone = "neutral",
  size = "md",
  icon,
  dot = true,
  className = "",
  ...props
}) => (
  <span
    className={[
      "inline-flex items-center rounded-full font-semibold tracking-[0.03em]",
      TONES[tone] || TONES.neutral,
      SIZES[size] || SIZES.md,
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    {icon ? (
      <span className="inline-flex shrink-0" aria-hidden="true">
        {icon}
      </span>
    ) : dot ? (
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        aria-hidden="true"
      />
    ) : null}
    {children}
  </span>
);

export default Badge;
