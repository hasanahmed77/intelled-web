import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-800/80 bg-black/80 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 text-sm text-muted md:grid-cols-4">
        <div>
          <p className="text-white">intellED</p>
          <p className="mt-2 text-xs text-zinc-400">
            Student-focused problem set generation and AI evaluation.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Company</p>
          <Link className="block hover:text-accent" href="/about">About Us</Link>
          <Link className="block hover:text-accent" href="/contact">Contact Us</Link>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Product</p>
          <Link className="block hover:text-accent" href="/practice">Practice</Link>
          <Link className="block hover:text-accent" href="/ai-practice">AI Practice</Link>
          <Link className="block hover:text-accent" href="/pricing">Pricing</Link>
          <Link className="block hover:text-accent" href="/profile">Profile</Link>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Legal</p>
          <Link className="block hover:text-accent" href="/privacy">Privacy</Link>
          <Link className="block hover:text-accent" href="/terms">Terms</Link>
          <p className="pt-2 text-xs text-zinc-500">© 2026 intellED</p>
        </div>
      </div>
    </footer>
  );
}
