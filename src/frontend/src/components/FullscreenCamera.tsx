import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export default function FullscreenCamera({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!active) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => {
        onClose();
      });

    return () => {
      active = false;
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
        streamRef.current = null;
      }
    };
  }, [onClose]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    onCapture(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Video fills screen */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Dark overlay with cutout illusion */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top overlay */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: "calc(50% - 125px)",
            background: "rgba(0,0,0,0.55)",
          }}
        />
        {/* Bottom overlay */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "calc(50% - 125px)",
            background: "rgba(0,0,0,0.55)",
          }}
        />
        {/* Left overlay */}
        <div
          className="absolute left-0"
          style={{
            top: "calc(50% - 125px)",
            height: "250px",
            width: "calc(50% - 125px)",
            background: "rgba(0,0,0,0.55)",
          }}
        />
        {/* Right overlay */}
        <div
          className="absolute right-0"
          style={{
            top: "calc(50% - 125px)",
            height: "250px",
            width: "calc(50% - 125px)",
            background: "rgba(0,0,0,0.55)",
          }}
        />

        {/* Corner brackets */}
        {/* Top-left */}
        <div
          className="absolute"
          style={{
            top: "calc(50% - 125px)",
            left: "calc(50% - 125px)",
            width: 40,
            height: 40,
            borderTop: "3px solid white",
            borderLeft: "3px solid white",
            borderRadius: "4px 0 0 0",
          }}
        />
        {/* Top-right */}
        <div
          className="absolute"
          style={{
            top: "calc(50% - 125px)",
            right: "calc(50% - 125px)",
            width: 40,
            height: 40,
            borderTop: "3px solid white",
            borderRight: "3px solid white",
            borderRadius: "0 4px 0 0",
          }}
        />
        {/* Bottom-left */}
        <div
          className="absolute"
          style={{
            bottom: "calc(50% - 125px)",
            left: "calc(50% - 125px)",
            width: 40,
            height: 40,
            borderBottom: "3px solid white",
            borderLeft: "3px solid white",
            borderRadius: "0 0 0 4px",
          }}
        />
        {/* Bottom-right */}
        <div
          className="absolute"
          style={{
            bottom: "calc(50% - 125px)",
            right: "calc(50% - 125px)",
            width: 40,
            height: 40,
            borderBottom: "3px solid white",
            borderRight: "3px solid white",
            borderRadius: "0 0 4px 0",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <button
          type="button"
          data-ocid="camera.close_button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <p className="text-white font-semibold text-base drop-shadow">
          Point camera at your food
        </p>
        <div className="w-10" />
      </div>

      {/* Capture button */}
      <div className="relative z-10 mt-auto mb-16 flex justify-center">
        <button
          type="button"
          data-ocid="camera.primary_button"
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}
