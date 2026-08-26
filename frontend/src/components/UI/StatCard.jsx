import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/**
 * StatCard — replaces 12 inline copies across Dashboard and Reports.
 *
 * Numbers use tabular figures so a column of stats stays aligned and does not
 * reflow as values change. Delta carries an arrow as well as a colour.
 */
const StatCard = ({ label, value, delta, deltaLabel, icon, className = "" }) => {
  const up = typeof delta === "number" && delta >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={`rounded-card border border-line bg-surface p-4 shadow-e1 ${className}`}
    >
      <div className="mb-2 flex items-center gap-2 text-content-muted">
        {icon ? (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="text-body-sm">{label}</span>
      </div>

      <p className="font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-content [font-variant-numeric:tabular-nums]">
        {value}
      </p>

      {typeof delta === "number" ? (
        <p
          className={`mt-2 flex items-center gap-1 text-body-sm ${up ? "text-success" : "text-error"}`}
        >
          <Arrow className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="[font-variant-numeric:tabular-nums]">
            {Math.abs(delta)}%
          </span>
          {deltaLabel ? (
            <span className="text-content-muted">{deltaLabel}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
};

export default StatCard;
