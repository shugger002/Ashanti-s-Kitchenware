"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ak_theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button type="button" className="inline-flex size-11 items-center justify-center" onClick={toggle} aria-label={ready && dark ? "Switch to light mode" : "Switch to dark mode"}>
      {ready && dark ? <Sun className="h-5 w-5" strokeWidth={1.5} /> : <Moon className="h-5 w-5" strokeWidth={1.5} />}
    </button>
  );
}
