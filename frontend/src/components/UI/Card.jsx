import React from "react";

/**
 * Card — replaces ~20 inline copies of `bg-dark-card rounded-xl p-6`.
 *
 * `interactive` renders a real <button> or <a>, not a div with onClick, so it
 * is keyboard reachable and announced correctly.
 */
const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const Card = ({
  children,
  as,
  interactive = false,
  padding = "md",
  className = "",
  href,
  onClick,
  ...props
}) => {
  const Tag = as || (href ? "a" : interactive ? "button" : "div");

  const base = [
    "rounded-card border border-line bg-surface text-content shadow-e1",
    PADDING[padding] ?? PADDING.md,
    className,
  ];

  if (interactive || href) {
    base.push(
      "block w-full text-left transition-[background-color,border-color,box-shadow,transform] duration-base ease-out",
      "hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-hover hover:shadow-e2",
      "motion-reduce:hover:translate-y-0",
      "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focusring",
      "[touch-action:manipulation]",
    );
  }

  return (
    <Tag
      href={href}
      onClick={onClick}
      type={Tag === "button" ? "button" : undefined}
      className={base.filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Card;
