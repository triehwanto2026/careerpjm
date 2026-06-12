import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

export interface WebcamHandle {
  /** Capture current frame and return a data URL (jpeg). Null if camera not ready. */
  capture: () => string | null;
  isActive: () => boolean;
}

type WebcamStatus = "pending" | "active" | "error";

interface WebcamPreviewProps {
  onStatusChange?: (status: WebcamStatus) => void;
}

const WebcamPreview = forwardRef<WebcamHandle, WebcamPreviewProps>(({ onStatusChange }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(false);

  const updateStatus = (status: WebcamStatus) => {
    setIsActive(status === "active");
    setError(status === "error");
    onStatusChange?.(status);
  };

  useImperativeHandle(ref, () => ({
    capture: () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !isActive || video.readyState < 2 || video.videoWidth === 0) return null;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    },
    isActive: () => isActive,
  }), [isActive]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    const startWebcam = async () => {
      onStatusChange?.("pending");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });
        if (cancelled || !videoRef.current) return;
        stream.getVideoTracks().forEach((track) => {
          track.addEventListener("ended", () => updateStatus("error"), { once: true });
          track.addEventListener("mute", () => updateStatus("error"), { once: true });
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!cancelled) updateStatus("active");
      } catch {
        if (!cancelled) updateStatus("error");
      }
    };
    startWebcam();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
      <canvas ref={canvasRef} className="hidden" />
      {error ? (
        <div className="flex h-[120px] w-full items-center justify-center gap-2 text-muted-foreground md:h-[140px]">
          <CameraOff className="h-5 w-5" />
          <span className="text-xs">Kamera tidak tersedia</span>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay muted playsInline className="h-[120px] w-full object-cover md:h-[140px]" />
          <div className="absolute left-2 top-2 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-destructive animate-webcam-pulse" : "bg-muted-foreground"}`} />
            <span className="text-[10px] font-medium text-foreground/80">{isActive ? "REC" : "..."}</span>
          </div>
          <div className="absolute bottom-2 right-2"><Camera className="h-4 w-4 text-foreground/50" /></div>
        </>
      )}
    </div>
  );
});

WebcamPreview.displayName = "WebcamPreview";
export default WebcamPreview;
