"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        promise?: Promise<void>;
      };
    };
  }
}

export function MathText({
  content,
  className = ""
}: {
  content: string;
  className?: string;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const normalizedContent = content
    .replace(/\r\n/g, "\n")
    .replace(/^\s*[.。．]\s*$/gm, "")
    .replace(/(\\\)|\\\]|[A-Za-z0-9}])\s*\n+\s*([.,;:!?])/g, "$1$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  useEffect(() => {
    const node = elementRef.current;
    if (!node || !window.MathJax) {
      return;
    }

    const render = async () => {
      const startupPromise = window.MathJax?.startup?.promise;
      if (startupPromise) {
        await startupPromise;
      }
      await window.MathJax?.typesetPromise?.([node]);
    };

    render().catch(() => {
      // Ignore render errors and keep raw text visible as fallback.
    });
  }, [normalizedContent]);

  return (
    <div
      ref={elementRef}
      suppressHydrationWarning
      className={`whitespace-pre-wrap break-words ${className}`.trim()}
    >
      {normalizedContent}
    </div>
  );
}
