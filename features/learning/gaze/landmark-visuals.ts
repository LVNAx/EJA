import type { Landmark } from "./gaze-model";

// MediaPipe anatomical sides, before mirroring the video for the participant.
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];
export const EYES = {
  left: {
    contour: [
      263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388,
      466,
    ],
    iris: [474, 475, 476, 477],
    center: 473,
  },
  right: {
    contour: [
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161,
      246,
    ],
    iris: [469, 470, 471, 472],
    center: 468,
  },
} as const;
export const LANDMARK_COLORS = {
  face: "#d8b4fe",
  eyes: "#ffd166",
  iris: "#5eead4",
  points: "#ffffff",
};
export type LandmarkOptions = {
  contour: boolean;
  eyes: boolean;
  points: boolean;
};

const finite = (point?: Landmark): point is Landmark =>
  !!point && Number.isFinite(point.x) && Number.isFinite(point.y);
function outline(
  ctx: CanvasRenderingContext2D,
  points: Landmark[],
  indices: readonly number[],
  width: number,
  height: number,
  color: string,
  size: number,
) {
  if (indices.some((index) => !finite(points[index]))) return;
  ctx.beginPath();
  indices.forEach((index, i) => {
    const p = points[index];
    if (i) ctx.lineTo(p.x * width, p.y * height);
    else ctx.moveTo(p.x * width, p.y * height);
  });
  ctx.closePath();
  ctx.lineWidth = size;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function dot(
  ctx: CanvasRenderingContext2D,
  point: Landmark | undefined,
  width: number,
  height: number,
  color: string,
  radius: number,
) {
  if (!finite(point)) return;
  ctx.beginPath();
  ctx.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Canvas and video use the same source dimensions and the same CSS mirror. */
export function drawLandmarks(
  canvas: HTMLCanvasElement,
  points: Landmark[],
  width: number,
  height: number,
  options: LandmarkOptions,
) {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const stroke = Math.max(1.5, width / 320);
  if (options.points)
    points.forEach((p) =>
      dot(
        ctx,
        p,
        width,
        height,
        LANDMARK_COLORS.points,
        Math.max(1, width / 500),
      ),
    );
  if (options.contour)
    outline(
      ctx,
      points,
      FACE_OVAL,
      width,
      height,
      LANDMARK_COLORS.face,
      stroke,
    );
  if (options.eyes)
    for (const eye of Object.values(EYES)) {
      outline(
        ctx,
        points,
        eye.contour,
        width,
        height,
        LANDMARK_COLORS.eyes,
        stroke,
      );
      outline(
        ctx,
        points,
        eye.iris,
        width,
        height,
        LANDMARK_COLORS.iris,
        stroke,
      );
      dot(
        ctx,
        points[eye.center],
        width,
        height,
        LANDMARK_COLORS.iris,
        stroke * 1.8,
      );
    }
}

export function eyeCrop(
  points: Landmark[],
  side: keyof typeof EYES,
  width: number,
  height: number,
) {
  const eye = EYES[side];
  if (
    eye.contour.some((index) => !finite(points[index])) ||
    !finite(points[eye.center])
  )
    return null;
  const xs = eye.contour.map((i) => points[i].x * width);
  const ys = eye.contour.map((i) => points[i].y * height);
  const eyeWidth = Math.max(...xs) - Math.min(...xs);
  if (eyeWidth < 4 || width <= 0 || height <= 0) return null;
  const cropWidth = Math.min(width, eyeWidth * 2.5);
  const cropHeight = Math.min(height, cropWidth * 0.6);
  const x = Math.max(
    0,
    Math.min(
      width - cropWidth,
      (Math.max(...xs) + Math.min(...xs)) / 2 - cropWidth / 2,
    ),
  );
  const y = Math.max(
    0,
    Math.min(
      height - cropHeight,
      (Math.max(...ys) + Math.min(...ys)) / 2 - cropHeight / 2,
    ),
  );
  return { x, y, width: cropWidth, height: cropHeight };
}

export function drawEye(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  points: Landmark[],
  side: keyof typeof EYES,
  showMarkers = true,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const crop = eyeCrop(points, side, video.videoWidth, video.videoHeight);
  if (!crop || video.readyState < 2) return;
  ctx.drawImage(
    video,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  if (!showMarkers) return;
  const normalized = points.map((p) => ({
    x: (p.x * video.videoWidth - crop.x) / crop.width,
    y: (p.y * video.videoHeight - crop.y) / crop.height,
  }));
  const eye = EYES[side];
  outline(
    ctx,
    normalized,
    eye.contour,
    canvas.width,
    canvas.height,
    LANDMARK_COLORS.eyes,
    2,
  );
  outline(
    ctx,
    normalized,
    eye.iris,
    canvas.width,
    canvas.height,
    LANDMARK_COLORS.iris,
    2,
  );
  dot(
    ctx,
    normalized[eye.center],
    canvas.width,
    canvas.height,
    LANDMARK_COLORS.iris,
    3,
  );
}
