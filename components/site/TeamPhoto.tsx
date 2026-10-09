"use client";

import { useState } from "react";

export function TeamPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-48 w-full items-center justify-center bg-brand-50 text-5xl font-bold text-brand-300">
        {name[0]}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="h-48 w-full object-cover"
      style={{ objectPosition: "center 25%" }}
      onError={() => setFailed(true)}
    />
  );
}
