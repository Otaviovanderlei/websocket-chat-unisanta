import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const systemQuery = "(prefers-color-scheme: dark)";

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem("theme");
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function preferredTheme(): Theme {
  return savedTheme() ?? (window.matchMedia(systemQuery).matches ? "dark" : "light");
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content", theme === "dark" ? "#0f172a" : "#f4f6f8",
  );
}

// Apply before mounting React so the first rendered screen uses the right theme.
export function initializeTheme() {
  applyTheme(preferredTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(preferredTheme);

  useEffect(() => {
    function synchronize() {
      const next = preferredTheme();
      applyTheme(next);
      setTheme(next);
    }
    function onStorage(event: StorageEvent) {
      if (event.storageArea === localStorage && (event.key === "theme" || event.key === null)) {
        synchronize();
      }
    }
    const system = window.matchMedia(systemQuery);
    system.addEventListener("change", synchronize);
    window.addEventListener("storage", onStorage);
    synchronize();
    return () => {
      system.removeEventListener("change", synchronize);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Keep the control usable when browser storage is unavailable.
    }
    applyTheme(next);
    setTheme(next);
  }

  return { theme, toggleTheme };
}
