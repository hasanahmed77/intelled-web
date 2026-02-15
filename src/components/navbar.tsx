import Link from "next/link";
import { getUser } from "@/lib/auth";
import { AuthButton } from "@/components/auth-button";

export async function Navbar() {
  const user = await getUser();

  return (
    <header className="border-b border-ink-800/80 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-accent shadow-glow" />
          <span className="text-sm uppercase tracking-[0.3em] text-muted">intellED</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link className="hover:text-accent" href="/pricing">
            Pricing
          </Link>
          <Link className="hover:text-accent" href="/practice">
            Practice
          </Link>
          <Link className="hover:text-accent" href="/profile">
            Profile
          </Link>
          <AuthButton isAuthed={Boolean(user)} />
        </nav>
      </div>
    </header>
  );
}
