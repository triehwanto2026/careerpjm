import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const next = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <button
      onClick={next}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={`Tema: ${theme === "dark" ? "Gelap" : theme === "light" ? "Terang" : "Sistem"}`}
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
