"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NavBar({ displayName }: { displayName: string | null }) {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
            VA
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link href="/mentor" className="text-sm text-slate-600 hover:text-slate-900">
              Mentor
            </Link>
            <Link href="/progress" className="text-sm text-slate-600 hover:text-slate-900">
              Progress
            </Link>
            <Link href="/assessments" className="text-sm text-slate-600 hover:text-slate-900">
              Assessments
            </Link>
            <Link href="/journeys" className="text-sm text-slate-600 hover:text-slate-900">
              Journeys
            </Link>
            <Link href="/insights" className="text-sm text-slate-600 hover:text-slate-900">
              Insights
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{displayName ?? "Welcome"}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
