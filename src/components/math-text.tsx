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

  const autoWrapPlainMath = (value: string) => {
    const protectedBlocks: string[] = [];
    const withPlaceholders = value.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, (match) => {
      const token = `@@MATH_BLOCK_${protectedBlocks.length}@@`;
      protectedBlocks.push(match);
      return token;
    });

    const autoWrapped = withPlaceholders.replace(
      /(^|[\s:(])([0-9√(][^,.;:!?\\n]*?(?:√|\^|×|÷|=)[^,.;:!?\\n]*?)(?=([)\s,.;:!?\\n]|$))/g,
      (_match, prefix: string, expression: string) => {
        const latexExpression = expression
          .trim()
          .replace(/−/g, "-")
          .replace(/×/g, "\\times ")
          .replace(/÷/g, "\\div ")
          .replace(/√([A-Za-z0-9.]+)/g, "\\sqrt{$1}")
          .replace(/([A-Za-z0-9.)]+)\^(-?[A-Za-z0-9.]+)/g, "$1^{$2}")
          .replace(/\s{2,}/g, " ")
          .trim();

        return `${prefix}\\(${latexExpression}\\)`;
      }
    );

    return autoWrapped.replace(/@@MATH_BLOCK_(\d+)@@/g, (_match, index: string) => {
      return protectedBlocks[Number(index)] ?? "";
    });
  };

  const normalizedContent = autoWrapPlainMath(content)
    .replace(/\r\n/g, "\n")
    .replace(/^\s*[.。．]\s*$/gm, "")
    .replace(/(\\\)|\\\]|[A-Za-z0-9}])\s*\n+\s*([.,;:!?])/g, "$1$2")
    .replace(/\n{3,}/g, "\n\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[^\S\n]*\n[^\S\n]*/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
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
      className={`whitespace-normal break-words ${className}`.trim()}
    >
      {normalizedContent}
    </div>
  );
}
