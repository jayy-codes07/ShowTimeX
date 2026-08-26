import React, { useId } from "react";

/**
 * Tabs — one accessible implementation.
 *
 * Dashboard currently renders this control three times inline, each with a
 * four-level nested theme ternary. Roving focus + arrow keys per the WAI-ARIA
 * tabs pattern; the active tab is marked by weight and background, not by
 * colour alone.
 */
const Tabs = ({ items = [], value, onChange, ariaLabel = "View", className = "" }) => {
  const base = useId();

  const onKeyDown = (e) => {
    const i = items.findIndex((t) => t.value === value);
    if (i < 0) return;
    let next = null;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange?.(items[next].value);
    document.getElementById(`${base}-${next}`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={[
        "inline-flex gap-1 rounded-control border border-line bg-surface-sunken p-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            id={`${base}-${i}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(t.value)}
            className={[
              "min-h-touch rounded-[7px] px-3.5 py-1.5 text-body-sm",
              "transition-colors duration-base ease-out",
              "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-focusring",
              "[touch-action:manipulation]",
              active
                ? "bg-surface font-semibold text-content shadow-e1"
                : "font-medium text-content-muted hover:text-content",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
