"use client";

import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

// Putih sebagai dasar, dengan gumpalan ungu lembut yang bergerak perlahan.
const FRAG = `
precision mediump float;
uniform vec2 r;
uniform float t;
float blob(vec2 p, vec2 c, float rad){ return smoothstep(rad, 0.0, length(p - c)); }
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  vec2 p = vec2(uv.x * r.x / r.y, uv.y);
  float a = blob(p, vec2(0.25 + 0.18*sin(t*0.21), 0.85 + 0.08*cos(t*0.17)), 0.75);
  float b = blob(p, vec2(1.55 + 0.20*cos(t*0.19), 0.55 + 0.15*sin(t*0.23)), 0.85);
  float c = blob(p, vec2(0.95 + 0.25*sin(t*0.15), 0.05 + 0.10*cos(t*0.27)), 0.8);
  vec3 col = vec3(1.0);
  col = mix(col, vec3(0.91, 0.84, 1.0), clamp(a * 0.55, 0.0, 1.0));
  col = mix(col, vec3(0.85, 0.74, 0.99), clamp(b * 0.38, 0.0, 1.0));
  col = mix(col, vec3(0.70, 0.45, 0.98), clamp(c * 0.16, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

export function AuroraBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = 0.5; // render setengah resolusi: halus, murah
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = () => {
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, (performance.now() - start) / 1000 + 8);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const onVisible = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) draw();
    };

    resize();
    draw();
    const onResize = () => { resize(); draw(); };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-white">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
