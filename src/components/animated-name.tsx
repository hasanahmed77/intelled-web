"use client";

import { useEffect, useState } from "react";

export function AnimatedName({ name }: { name: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [name]);

  return (
    <span
      className={`inline-block transition-opacity duration-150 ${
        isVisible ? "animate-name-shine opacity-100" : "opacity-0"
      }`}
    >
      {name}
    </span>
  );
}
