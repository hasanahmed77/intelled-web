declare global {
  interface Window {
    mathVirtualKeyboard?: {
      visible: boolean;
      layouts?: string | string[];
      show?: () => void;
      hide?: () => void;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "math-virtual-keyboard-policy"?: "auto" | "manual" | "sandboxed";
          "virtual-keyboard-mode"?: "onfocus" | "off";
        },
        HTMLElement
      >;
    }
  }
}

export {};
