import React from "react";

/**
 * Button — the only button in the product.
 *
 * Two guarantees that matter:
 *   1. `danger` is outlined and uses --error. `primary` is filled and uses
 *      --primary. They are a different colour AND a different shape, so a
 *      destructive action can never again look like the primary one.
 *   2. Every size clears 44px of height. Touch targets are not negotiable.
 *
 * Props are backwards-compatible with the previous Button.
 */

const VARIANTS = {
  primary:
    "bg-brand text-content-on-primary border border-transparent hover:bg-brand-hover",
  secondary:
    "bg-surface text-content border border-line-control hover:bg-surface-hover",
  outline:
    "bg-transparent text-brand-text border border-line-control hover:bg-brand-soft",
  ghost:
    "bg-transparent text-brand-text border border-transparent hover:bg-brand-soft",
  danger:
    "bg-transparent text-error border border-error hover:bg-error-soft",
  "danger-solid":
    "bg-error text-content-on-primary border border-transparent hover:opacity-90",
};

const SIZES = {
  sm: "min-h-touch px-3.5 py-2 text-body-sm gap-1.5",
  md: "min-h-touch px-5 py-2.5 text-body-sm sm:text-body gap-2",
  lg: "min-h-[52px] px-6 py-3 text-body sm:text-lg gap-2.5",
};

// tolerate the older aliases still present in a few call sites
const SIZE_ALIAS = { small: "sm", medium: "md", large: "lg" };

const Spinner = () => (
  <svg
    className="h-[1.15em] w-[1.15em] animate-spin shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Button = React.forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    loadingText = "Loading…",
    disabled = false,
    onClick,
    type = "button",
    className = "",
    icon,
    iconRight,
    ariaLabel = "",
    ...props
  },
  ref,
) {
  const resolvedSize = SIZES[size] ? size : SIZE_ALIAS[size] || "md";
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel || undefined}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center rounded-control font-semibold",
        "transition-colors duration-base ease-out",
        "active:scale-[0.985] motion-reduce:active:scale-100",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focusring",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "[touch-action:manipulation]",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[resolvedSize],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon ? (
            <span className="inline-flex shrink-0" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {children}
          {iconRight ? (
            <span className="inline-flex shrink-0" aria-hidden="true">
              {iconRight}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
});

export default Button;
