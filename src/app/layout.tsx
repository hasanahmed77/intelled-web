import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "intellED",
  description: "Generate personalized worksheets with adaptive difficulty."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-grid">
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-6 py-12">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
