import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { NavbarClient } from "@/components/navbar-client";
import { Footer } from "@/components/footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://intelled.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "intellED",
  title: "intellED",
  description: "Generate personalized problem sets with adaptive difficulty.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "intellED",
    title: "intellED",
    description: "Generate personalized problem sets with adaptive difficulty."
  },
  twitter: {
    card: "summary",
    title: "intellED",
    description: "Generate personalized problem sets with adaptive difficulty."
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "intellED",
    alternateName: "intelled.org",
    url: siteUrl
  };

  return (
    <html lang="en">
      <body>
        <Script
          id="website-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Script id="mathjax-config" strategy="beforeInteractive">
          {`window.MathJax = {
            tex: {
              inlineMath: [['\\\\(', '\\\\)']],
              displayMath: [['\\\\[', '\\\\]']]
            },
            chtml: {
              scale: 1,
              displayOverflow: 'linebreak',
              linebreaks: {
                automatic: true,
                width: 'container'
              }
            },
            options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
            startup: { typeset: false }
          };`}
        </Script>
        <Script
          id="mathjax-lib"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"
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
