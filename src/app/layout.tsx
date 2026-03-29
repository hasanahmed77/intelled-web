import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { NavbarClient } from "@/components/navbar-client";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "intellED",
  description: "Generate personalized worksheets with adaptive difficulty.",
  icons: {
    icon: "/brand/logo.svg",
    shortcut: "/brand/logo.svg",
    apple: "/brand/logo.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Script id="mathjax-config" strategy="beforeInteractive">
          {`window.MathJax = {
            tex: {
              inlineMath: [['\\\\(', '\\\\)']],
              displayMath: [['\\\\[', '\\\\]']]
            },
            svg: { fontCache: 'global' },
            options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
            startup: { typeset: false }
          };`}
        </Script>
        <Script
          id="mathjax-lib"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          strategy="afterInteractive"
        />
        <Script
          id="mathlive-lib"
          src="https://cdn.jsdelivr.net/npm/mathlive"
          strategy="afterInteractive"
        />
        <div className="flex min-h-screen flex-col bg-grid">
          <div className="relative z-10 flex min-h-screen flex-col">
            <NavbarClient />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-0 pt-0">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
