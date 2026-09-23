"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_THEME,
  applyTheme,
  readStoredTheme,
  type Theme,
} from "@/lib/theme";

/**
 * Light / dark switch for the nav. Renders the default until mounted, then
 * syncs to the stored preference the head script already applied, so the
 * server and browser markup match on first render.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const choose = (next: Theme) => {
    if (next === theme) return;
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        type="button"
        className="theme-btn"
        aria-pressed={theme === "light"}
        onClick={() => choose("light")}
      >
        <span className="theme-btn-glyph" aria-hidden="true">
          ☀
        </span>
        Light
      </button>
      <button
        type="button"
        className="theme-btn"
        aria-pressed={theme === "dark"}
        onClick={() => choose("dark")}
      >
        <span className="theme-btn-glyph" aria-hidden="true">
          ☾
        </span>
        Dark
      </button>
    </div>
  );
}
