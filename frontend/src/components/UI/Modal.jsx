import React, { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Modal — the accessible dialog the app did not have.
 *
 * The audit found four hand-rolled `fixed inset-0` overlays, none of which
 * had a dialog role, a focus trap, Escape handling, scroll lock, or focus
 * return. One of them wasn't even `fixed` (it was `absolute` with an
 * `mt-[20%]` nudge, so it drifted off-screen on long pages).
 *
 * This one does all of it, and animates from scale so it reads as coming
 * from the thing you clicked rather than appearing out of nowhere.
 */

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  /** Set false for flows where a stray click must not discard input. */
  closeOnScrim = true,
  showClose = true,
  initialFocusRef,
  className = "",
}) => {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  /* -- remember where focus came from, restore it on close ---------------- */
  useEffect(() => {
    if (!isOpen) return undefined;
    returnFocusRef.current = document.activeElement;
    return () => {
      const el = returnFocusRef.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [isOpen]);

  /* -- lock the page behind the modal ------------------------------------- */
  useEffect(() => {
    if (!isOpen) return undefined;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`; // no layout jump

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [isOpen]);

  /* -- move focus in ------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(FOCUSABLE);
      (first || panel).focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, initialFocusRef]);

  /* -- Escape, and Tab wrapping ------------------------------------------- */
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4"
      onKeyDown={onKeyDown}
    >
      {/* scrim — strong enough to isolate the foreground */}
      <div
        className="fixed inset-0 z-scrim animate-fade-in bg-[var(--scrim)] backdrop-blur-[2px]"
        onClick={closeOnScrim ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={[
          "relative z-modal my-auto w-full animate-scale-in",
          "rounded-t-modal sm:rounded-modal",
          "border border-line bg-elevated shadow-e3",
          "max-h-[92dvh] overflow-y-auto",
          "focus:outline-none",
          SIZES[size] || SIZES.md,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title ? (
                <h2
                  id={titleId}
                  className="font-display text-h3 font-bold text-content"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p
                  id={descId}
                  className="mt-1 text-body-sm text-content-secondary"
                >
                  {description}
                </p>
              ) : null}
            </div>

            {showClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-2 -mt-1 grid h-touch w-touch shrink-0 place-items-center rounded-control text-content-muted transition-colors duration-base hover:bg-surface-hover hover:text-content focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-focusring"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}

        <div className="px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
