import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

const WebcamPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
        }
      } catch {
        setError(true);
      }
    };

    startWebcam();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
      {error ? (
        <div className="flex h-[120px] w-full items-center justify-center gap-2 text-muted-foreground md:h-[140px]">
          <CameraOff className="h-5 w-5" />
          <span className="text-xs">Kamera tidak tersedia</span>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-[120px] w-full object-cover md:h-[140px]"
          />
          <div className="absolute left-2 top-2 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-destructive animate-webcam-pulse" : "bg-muted-foreground"}`} />
            <span className="text-[10px] font-medium text-foreground/80">
              {isActive ? "REC" : "..."}
            </span>
          </div>
          <div className="absolute bottom-2 right-2">
            <Camera className="h-4 w-4 text-foreground/50" />
          </div>
        </>
      )}
    </div>
  );
};

export default WebcamPreview;
