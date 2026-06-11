import { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";

interface TestTimerProps {
  durationMinutes: number;
  initialSeconds?: number;
  onTimeUp: () => void;
  paused?: boolean;
}

const TestTimer = ({ durationMinutes, initialSeconds, onTimeUp, paused = false }: TestTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(
    initialSeconds ?? durationMinutes * 60
  );
  const isFirstLoad = useRef(true);
  const testKeyRef = useRef(`${durationMinutes}_${initialSeconds}`);

  useEffect(() => {
    const newTestKey = `${durationMinutes}_${initialSeconds}`;
    // Reset first-load flag jika test beralih (indicator: initialSeconds berubah ke nilai baru)
    if (testKeyRef.current !== newTestKey) {
      isFirstLoad.current = true;
      testKeyRef.current = newTestKey;
    }
    setSecondsLeft(initialSeconds ?? durationMinutes * 60);
  }, [durationMinutes, initialSeconds]);

  useEffect(() => {
    if (paused) return;

    // Jangan trigger onTimeUp pada first load jika timer sudah 0 (resume scenario)
    if (secondsLeft <= 0 && !isFirstLoad.current) {
      onTimeUp();
      return;
    }
    
    // Mark first load as done setelah selesai setup
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }

    if (secondsLeft > 0) {
      const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [secondsLeft, onTimeUp, paused]);

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
