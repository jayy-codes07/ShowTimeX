/** @type {import('tailwindcss').Config} */

/* Every colour below resolves to a semantic token defined in
   src/styles/tokens.css ("Gallery" — premium, light, single-theme).
   Components write `bg-surface`, `text-content-muted`, `border-line-control` —
   never a hex, never a Tailwind palette colour, never a theme ternary. */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  // Single theme — there is no dark variant to target.

  theme: {
    extend: {
      colors: {
        // ---- ground & structure ----
        app: "var(--bg)",
        elevated: "var(--bg-elevated)",
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          sunken: "var(--surface-sunken)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          control: "var(--border-control)",
        },

        // ---- text ----
        content: {
          DEFAULT: "var(--text)",
          secondary: "var(--text-secondary)",
          muted: "var(--muted)",
          "on-primary": "var(--text-on-primary)",
          "on-accent": "var(--text-on-accent)",
          // text on posters/backdrops — never flips with the theme
          media: "var(--on-media)",
          "media-secondary": "var(--on-media-secondary)",
        },

        // ---- brand ----
        brand: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          text: "var(--primary-text)",
          soft: "var(--primary-soft)",
          "soft-strong": "var(--primary-soft-strong)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },

        // ---- state ----
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
        error: { DEFAULT: "var(--error)", soft: "var(--error-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
        focusring: "var(--focus)",

        // ---- the seat map ----
        seat: {
          panel: "var(--seat-panel)",
          available: "var(--seat-available)",
          "available-label": "var(--seat-available-label)",
          selected: "var(--seat-selected)",
          "selected-label": "var(--seat-selected-label)",
          locked: "var(--seat-locked)",
          "locked-label": "var(--seat-locked-label)",
          "booked-border": "var(--seat-booked-border)",
        },

        // ---- LEGACY: still referenced by unmigrated pages -----------------
        // Kept so those files keep compiling; both resolve to the new tokens
        // via legacy-shim.css. Removed once every page has migrated.
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-hover)",
          light: "var(--primary-hover)",
          border: "var(--border)",
        },
        dark: {
          DEFAULT: "var(--bg)",
          lighter: "var(--surface-hover)",
          card: "var(--surface)",
        },
      },

      fontFamily: {
        // Instrument Serif states, Archivo explains.
        // The serif is for display sizes only (>=24px); Archivo takes h3 down.
        display: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Archivo", "system-ui", "sans-serif"],
      },

      fontSize: {
        // Serif roles run large and airy; Archivo roles are tighter.
        display: ["3.5rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        h1: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        h2: ["1.625rem", { lineHeight: "1.18", letterSpacing: "-0.012em" }],
        h3: ["1.0625rem", { lineHeight: "1.35", letterSpacing: "-0.005em" }],
        body: ["1rem", { lineHeight: "1.65" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
        caption: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.12em" }],
      },

      borderRadius: {
        // Near-square. Crisp corners read considered; rounded read friendly.
        control: "var(--r-control)",
        card: "var(--r-card)",
        poster: "var(--r-poster)",
        modal: "var(--r-modal)",
        seat: "3px 3px 1px 1px",
      },

      boxShadow: {
        e1: "var(--shadow-e1)",
        e2: "var(--shadow-e2)",
        e3: "var(--shadow-e3)",
      },

      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        fast: "120ms",
        base: "220ms",
        slow: "340ms",
        exit: "200ms",
      },

      zIndex: {
        sticky: "20",
        header: "50",
        scrim: "100",
        modal: "110",
        toast: "200",
      },

      minHeight: {
        touch: "44px", // the floor for every interactive element
      },
      minWidth: {
        touch: "44px",
      },

      maxWidth: {
        prose: "65ch",
      },

      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.32s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scaleIn 0.32s cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },

  plugins: [],
};
