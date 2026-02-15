import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="text-muted">The worksheet or page you are looking for does not exist.</p>
      <Link className="button button-primary" href="/">
        Back to home
      </Link>
    </div>
  );
}
