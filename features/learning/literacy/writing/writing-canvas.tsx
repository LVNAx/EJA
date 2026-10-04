"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Icon } from "@/features/learning/components/icons";
import {
  evaluateTrace,
  type Point,
  type Stroke,
  writingTemplates,
} from "./tracing";

const SIZE = 300;

function draw(canvas: HTMLCanvasElement, strokes: Stroke[]): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(bounds.width * pixelRatio));
  const height = Math.max(1, Math.round(bounds.height * pixelRatio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(width / SIZE, 0, 0, height / SIZE, 0, 0);
  context.clearRect(0, 0, SIZE, SIZE);
  context.strokeStyle = "#7E22CE";
  context.fillStyle = "#7E22CE";
  context.lineWidth = 8;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    for (const point of stroke.slice(1)) context.lineTo(point.x, point.y);
    if (stroke.length === 1)
      context.arc(stroke[0].x, stroke[0].y, 4, 0, 2 * Math.PI);
    context.stroke();
  }
}

function pointerPoint(event: PointerEvent<HTMLCanvasElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(
      0,
      Math.min(SIZE, ((event.clientX - rect.left) / rect.width) * SIZE),
    ),
    y: Math.max(
      0,
      Math.min(SIZE, ((event.clientY - rect.top) / rect.height) * SIZE),
    ),
  };
}

export function WritingCanvas({
  character,
  onFinish,
  ready,
}: {
  character: string;
  onFinish: (score: number) => void;
  ready: boolean;
}) {
  const template = writingTemplates[character];
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const activeStroke = useRef<Stroke | null>(null);
  const activePointer = useRef<number | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof evaluateTrace> | null>(
    null,
  );

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const repaint = () => draw(element, strokes.current);
    repaint();
    const observer = new ResizeObserver(repaint);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const repaint = () => {
    if (canvas.current)
      draw(canvas.current, [
        ...strokes.current,
        ...(activeStroke.current ? [activeStroke.current] : []),
      ]);
  };

  const begin = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (activePointer.current !== null) return;
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStroke.current = [pointerPoint(event)];
    repaint();
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId || !activeStroke.current)
      return;
    event.preventDefault();
    activeStroke.current.push(pointerPoint(event));
    repaint();
  };

  const end = (event: PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId || !activeStroke.current)
      return;
    event.preventDefault();
    const completed = activeStroke.current;
    activeStroke.current = null;
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    strokes.current = [...strokes.current, completed];
    setStrokeCount(strokes.current.length);
    setResult(evaluateTrace(template, strokes.current));
    repaint();
  };

  const undo = () => {
    strokes.current = strokes.current.slice(0, -1);
    setStrokeCount(strokes.current.length);
    setResult(
      strokes.current.length ? evaluateTrace(template, strokes.current) : null,
    );
    repaint();
  };

  const retry = () => {
    strokes.current = [];
    activeStroke.current = null;
    setStrokeCount(0);
    setResult(null);
    setShowGuide(false);
    repaint();
  };

  const feedback = result
    ? strokeCount < template.length && result.coverage >= 0.7
      ? "Bentuknya sudah dekat. Ikuti nomor goresan satu per satu agar lebih rapi."
      : result.score >= 70
        ? "Garisnya sudah mengikuti banyak bagian contoh."
        : result.score >= 40
          ? "Beberapa bagian sudah dekat. Kamu boleh mencoba lagi."
          : "Terima kasih sudah mencoba. Lihat contoh lalu coba lagi jika mau."
    : "Mulai dari lingkaran bernomor, lalu ikuti arah panah.";

  return (
    <div className="writing-workspace">
      <div className="trace-head">
        <div>
          <span className="section-kicker">TELUSURI BENTUKNYA</span>
          <h2>
            {/^[0-9]$/.test(character) ? "Angka" : "Huruf"} {character}
          </h2>
        </div>
        <span className="trace-tag">Mouse · Sentuh · Stylus</span>
      </div>
      <div className="trace-board">
        <svg
          viewBox="0 0 300 300"
          className={`trace-guide ${showGuide ? "guide-strong" : ""}`}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="trace-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#F5723F" />
            </marker>
          </defs>
          {template.map((stroke, index) => (
            <g key={index}>
              <polyline
                points={stroke
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ")}
                fill="none"
                stroke="#D8B4FE"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={showGuide ? undefined : "4 9"}
              />
              <circle
                cx={stroke[0].x}
                cy={stroke[0].y}
                r="16"
                fill="#FFE3D6"
                stroke="#F5723F"
                strokeWidth="2"
              />
              <text
                x={stroke[0].x}
                y={stroke[0].y + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#1E0A45"
              >
                {index + 1}
              </text>
              <line
                x1={stroke[4].x}
                y1={stroke[4].y}
                x2={stroke[10].x}
                y2={stroke[10].y}
                stroke="#F5723F"
                strokeWidth="3"
                markerEnd="url(#trace-arrow)"
              />
            </g>
          ))}
        </svg>
        <canvas
          ref={canvas}
          className="writing-canvas"
          aria-label={`Area menulis ${character}`}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>
      <div className="trace-controls">
        <button
          className="button button-outline"
          onClick={() => setShowGuide((value) => !value)}
          aria-pressed={showGuide}
        >
          <Icon name="book" size={18} />{" "}
          {showGuide ? "Sembunyikan Contoh" : "Lihat Contoh"}
        </button>
        <button
          className="button button-outline"
          onClick={undo}
          disabled={!strokeCount}
        >
          Hapus
        </button>
        <button
          className="button button-outline"
          onClick={retry}
          disabled={!strokeCount}
        >
          Coba Lagi
        </button>
      </div>
      <div className="trace-feedback" role="status">
        <div>
          <strong>
            {result ? `Kecocokan jalur: ${result.score}%` : "Ayo mulai menulis"}
          </strong>
          <p>{feedback}</p>
        </div>
        <button
          className="button button-primary"
          disabled={!strokeCount || !ready}
          onClick={() => onFinish(result?.score ?? 0)}
        >
          Selesai <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
