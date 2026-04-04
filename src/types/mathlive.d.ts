declare global {
  interface Window {
    mathVirtualKeyboard?: {
      visible: boolean;
      layouts?: string | string[];
      show?: () => void;
      hide?: () => void;
    };
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
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
