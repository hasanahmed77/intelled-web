import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";

export default function NotFound() {
  return (
    <ViewportSection center>
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold">Page not found</h1>
        <p className="text-muted">The problem set or page you are looking for does not exist.</p>
        <Link className="button button-primary" href="/">
          Back to home
        </Link>
      </div>
    </ViewportSection>
  );
}
