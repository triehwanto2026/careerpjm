import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TestTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
}

const TestTimer = ({ durationMinutes, onTimeUp }: TestTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLow = secondsLeft < 300;
  const isCritical = secondsLeft < 60;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm font-semibold transition-colors ${
        isCritical
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : isLow
          ? "border-warning/50 bg-warning/10 text-warning"
          : "border-border bg-muted text-foreground"
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

export default TestTimer;
