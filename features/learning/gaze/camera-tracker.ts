import { eyeFeatures, type Landmark } from "./gaze-model";

export type Tracker = { stop: () => void };
export type TrackerFactory = (
  video: HTMLVideoElement,
  onFrame: (features: number[] | null, at: number) => void,
  onError: (error: unknown) => void,
  signal: AbortSignal,
  onLandmarks?: (landmarks: Landmark[], at: number) => void,
) => Promise<Tracker>;

/** All camera processing stays in this browser. No audio, storage, or video upload. */
export const createCameraTracker: TrackerFactory = async (
  video,
  onFrame,
  onError,
  signal,
  onLandmarks,
) => {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
    throw new Error("camera-unavailable");
  let stream: MediaStream | null = null;
  let detector: import("@mediapipe/tasks-vision").FaceLandmarker | null = null;
  let raf = 0;
  let closed = false;
  const stop = () => {
    closed = true;
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    if (video.srcObject === stream) video.srcObject = null;
    detector?.close();
    detector = null;
    signal.removeEventListener("abort", stop);
  };
  const assertActive = () => {
    if (closed || signal.aborted)
      throw new DOMException("Cancelled", "AbortError");
  };
  signal.addEventListener("abort", stop, { once: true });
  try {
    assertActive();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15, max: 20 },
      },
    });
    if (closed || signal.aborted) {
      stream.getTracks().forEach((track) => track.stop());
      assertActive();
    }
    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        if (!closed) onError(new Error("camera-ended"));
      };
    });
    video.srcObject = stream;
    await video.play();
    assertActive();
    const { FaceLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );
    assertActive();
    const files = await FilesetResolver.forVisionTasks(
      "/models/face-landmarker/wasm",
    );
    assertActive();
    detector = await FaceLandmarker.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: "/models/face-landmarker/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.6,
      minFacePresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    assertActive();
    let lastAt = -Infinity;
    let lastTime = -1;
    const frame = (now: number) => {
      if (closed) return;
      raf = requestAnimationFrame(frame);
      if (
        now - lastAt < 100 ||
        video.readyState < 2 ||
        video.currentTime === lastTime
      )
        return;
      lastAt = now;
      lastTime = video.currentTime;
      try {
        const result = detector!.detectForVideo(video, now);
        onLandmarks?.(result.faceLandmarks[0] ?? [], performance.now());
        onFrame(
          result.faceLandmarks[0] ? eyeFeatures(result.faceLandmarks[0]) : null,
          performance.now(),
        );
      } catch (error) {
        stop();
        onError(error);
      }
    };
    raf = requestAnimationFrame(frame);
    return { stop };
  } catch (error) {
    stop();
    throw error;
  }
};
