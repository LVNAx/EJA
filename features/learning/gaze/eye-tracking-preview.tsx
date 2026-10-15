"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Landmark } from "./gaze-model";
import { drawEye, drawLandmarks } from "./landmark-visuals";

/** Draws the existing camera stream; never requests an additional camera. */
export function EyeTrackingPreview({
  source,
  landmarks,
  lastFrame,
}: {
  source: RefObject<HTMLVideoElement>;
  landmarks: RefObject<Landmark[]>;
  lastFrame: RefObject<number>;
}) {
  const frame = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const left = useRef<HTMLCanvasElement>(null);
  const right = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    let lastPaint = -Infinity;
    const paint = (now: number) => {
      raf = requestAnimationFrame(paint);
      if (now - lastPaint < 100) return;
      lastPaint = now;
      const video = source.current;
      if (!frame.current || !overlay.current || !video || video.readyState < 2)
        return;
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;
      if (frame.current.width !== width) frame.current.width = width;
      if (frame.current.height !== height) frame.current.height = height;
      frame.current.getContext("2d")?.drawImage(video, 0, 0, width, height);
      const points =
        now - (lastFrame.current ?? -Infinity) < 600
          ? (landmarks.current ?? [])
          : [];
      drawLandmarks(overlay.current, points, width, height, {
        contour: false,
        eyes: true,
        points: false,
      });
      if (left.current) drawEye(left.current, video, points, "left");
      if (right.current) drawEye(right.current, video, points, "right");
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [source, landmarks, lastFrame]);
  return (
    <figure className="camera-eye-preview" aria-label="Pelacakan mata langsung">
      <div className="camera-eye-frame" aria-hidden="true">
        <canvas ref={frame} width={640} height={480} />
        <canvas ref={overlay} width={640} height={480} />
      </div>
      <div className="camera-eye-crops" aria-hidden="true">
        <canvas ref={left} width={300} height={180} />
        <canvas ref={right} width={300} height={180} />
      </div>
      <figcaption>Kuning: kelopak mata · Hijau: iris</figcaption>
    </figure>
  );
}
