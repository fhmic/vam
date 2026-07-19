import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoachCompanion } from "@/components/avatar/coach-companion";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, plan, created_at")
    .eq("id", user.id)
    .single();

  const { data: assignment } = await supabase
    .from("user_mentor_assignments")
    .select("mentors(display_name, tagline)")
    .eq("user_id", user.id)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: streakSnapshot } = await supabase
    .from("progress_snapshots")
    .select("metric_value")
    .eq("user_id", user.id)
    .eq("metric_key", "day_streak")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Supabase's relational embed typing isn't fully resolved for this
  // hand-authored Database type; narrowed here rather than fighting it.
  const mentor = (assignment as any)?.mentors as { display_name: string; tagline: string } | undefined;
  const streak = streakSnapshot?.metric_value ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium text-ink dark:text-white">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
          {mentor
            ? `${mentor.display_name} is ready when you are.`
            : "Your mentor will be matched to you when you start your first conversation."}
        </p>
      </div>

      <CoachCompanion moduleKey="dashboard" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="text-sm font-medium text-ink/50 dark:text-white/50">Plan</h2>
          <p className="mt-2 text-lg font-semibold capitalize text-ink dark:text-white">{profile?.plan}</p>
        </Card>
        <Card className={streak > 0 ? "border-gold-500/40" : ""}>
          <h2 className="text-sm font-medium text-ink/50 dark:text-white/50">Day streak</h2>
          <p className="mt-2 font-mono text-2xl font-semibold text-gold-600 dark:text-gold-300">
            {streak} {streak === 1 ? "day" : "days"}
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-ink/50 dark:text-white/50">Mentor</h2>
          <p className="mt-2 text-lg font-semibold text-ink dark:text-white">
            {mentor?.display_name ?? "Not matched yet"}
          </p>
          {mentor?.tagline ? (
            <p className="mt-1 text-xs text-ink/50 dark:text-white/50">{mentor.tagline}</p>
          ) : null}
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/mentor">
          <Button>Talk to your mentor</Button>
        </Link>
        <Link href="/progress">
          <Button variant="secondary">View progress</Button>
        </Link>
      </div>
    </div>
  );
}
