import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="text-lg font-semibold text-slate-900">VAM-AI</span>
        <nav className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Your Vocal Acuity Mentor for Corporate Communication.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
          VAM AI train you professional presentation skill, tracks your progress over time, and picks up right where
          you left off on any device.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/sign-up">
            <Button size="lg">Start for free</Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
