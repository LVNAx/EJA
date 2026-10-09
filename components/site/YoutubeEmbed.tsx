"use client";

import { useEffect, useRef, useState } from "react";

export function YoutubeEmbed({ id }: { id: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState(`https://www.youtube.com/embed/${id}?enablejsapi=1`);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSrc(`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&enablejsapi=1`);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);

  return (
    <div className="card overflow-hidden p-0">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          ref={ref}
          className="absolute inset-0 h-full w-full"
          src={src}
          title="EJA Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
