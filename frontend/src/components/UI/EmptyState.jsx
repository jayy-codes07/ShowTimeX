import React from "react";
import { Inbox } from "lucide-react";

/**
 * EmptyState — icon, what happened, and a way forward.
 *
 * The audit found 15 empty states, 14 of which were a single line of grey
 * text ("No bookings found") with no explanation and no next step. SearchPage
 * was the exception and is the model this generalises.
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className = "",
}) => (
  <div
    className={[
      "flex flex-col items-center justify-center text-center",
      size === "sm" ? "px-4 py-10" : "px-4 py-16",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <span
      className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-content-muted"
      aria-hidden="true"
    >
      {icon || <Inbox className="h-6 w-6" />}
    </span>

    <h3 className="font-display text-h3 font-bold text-content [text-wrap:balance]">
      {title}
    </h3>

    {description ? (
      <p className="mt-2 max-w-prose text-body-sm text-content-secondary">
        {description}
      </p>
    ) : null}

    {action || secondaryAction ? (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {action}
        {secondaryAction}
      </div>
    ) : null}
  </div>
);

export default EmptyState;
