import React from "react";

/**
 * SectionHeading — one implementation of the icon + title + action row that
 * was hand-built ~12 different ways.
 *
 * `level` keeps the heading order sequential; several pages currently jump
 * straight to h2 or skip a level.
 */
const SIZES = {
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
};

const SectionHeading = ({
  title,
  description,
  icon,
  action,
  level = "h2",
  className = "",
}) => {
  const Tag = level;

  return (
    <div
      className={`mb-5 flex flex-wrap items-end justify-between gap-4 ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {icon ? (
            <span className="shrink-0 text-brand-text" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <Tag
            className={`font-display font-bold text-content [text-wrap:balance] ${SIZES[level] || SIZES.h2}`}
          >
            {title}
          </Tag>
        </div>
        {description ? (
          <p className="mt-1.5 max-w-prose text-body-sm text-content-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

export default SectionHeading;
