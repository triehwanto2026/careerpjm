import { useT } from "@/lib/i18n";
import { Globe } from "lucide-react";

const LanguageToggle = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
  const { lang, setLang } = useT();
  const isDark = variant === "dark";
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border p-1 ${
        isDark
          ? "border-white/10 bg-white/5 backdrop-blur"
          : "border-border bg-card"
      }`}
      role="group"
      aria-label="Language switcher"
    >
      <Globe className={`ml-2 mr-1 h-3.5 w-3.5 ${isDark ? "text-[#5cbdb9]" : "text-primary"}`} />
      <button
        onClick={() => setLang("id")}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
          lang === "id"
            ? "bg-[#5cbdb9] text-[#0c2340] shadow"
            : isDark ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={lang === "id"}
      >
        ID
      </button>
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
          lang === "en"
            ? "bg-[#5cbdb9] text-[#0c2340] shadow"
            : isDark ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;
