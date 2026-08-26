import React from "react";

/**
 * Loader — an inline spinner, not a 420px logo.
 *
 * The previous Loader rendered the brand lock-up at a fixed 420–460px for
 * every state: route Suspense fallback, page load, and inline. On a 375px
 * viewport it overflowed horizontally.
 *
 * Now: a small spinner by default, and the brand lock-up only for the
 * genuine first-boot screen (`brand` + `fullScreen`), where it is responsive.
 *
 * Prefer a Skeleton over this wherever the shape of the incoming content is
 * known — a reserved layout beats a spinner.
 */

const SIZES = {
  sm: "h-5 w-5 border-2",
  small: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-11 w-11 border-4",
  large: "h-11 w-11 border-4",
};

const Spinner = ({ size = "md" }) => (
  <span
    className={[
      "inline-block animate-spin rounded-full",
      "border-line-strong border-t-brand",
      SIZES[size] || SIZES.md,
    ].join(" ")}
    aria-hidden="true"
  />
);

const Loader = ({
  fullScreen = false,
  message = "",
  size = "md",
  brand = false,
}) => {
  const body = (
    <div className="flex flex-col items-center justify-center gap-3">
      {brand && fullScreen ? (
        <span
          className="site-brand-logo site-brand-logo-loader animate-shimmer"
          role="img"
          aria-label="ShowTimeX"
        />
      ) : (
        <Spinner size={size} />
      )}
      {message ? (
        <p className="text-body-sm text-content-muted">{message}</p>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-modal grid place-items-center bg-app px-4"
        role="status"
        aria-live="polite"
        aria-label={message || "Loading"}
      >
        {body}
      </div>
    );
  }

  return (
    <div
      className="flex w-full items-center justify-center py-12"
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
    >
      {body}
    </div>
  );
};

export { Spinner };
export default Loader;
