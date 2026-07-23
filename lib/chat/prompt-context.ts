import type { SupabaseClient } from "@supabase/supabase-js";
import { getRelevantMemories } from "@/lib/memory/retrieval";
import { pickRelevantFramework } from "@/lib/coaching/frameworks";
import { buildSystemPrompt, type ProgressSummary } from "@/lib/groq/prompts";
import type { Database, Mentor } from "@/types/database";

/**
 * Shared between /api/chat and /api/chat/greet (Product Redefinition —
 * proactive opening) so the two entry points can never silently drift
 * in what context the mentor actually sees. Loads everything
 * buildSystemPrompt needs and returns the assembled system prompt
 * string directly.
 */
export async function loadSystemPrompt(
  admin: SupabaseClient<Database>,
  userId: string,
  mentor: Mentor,
): Promise<string> {
  const [{ data: profile }, { data: preferences }, { data: goals }, { data: frameworks }, memories] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "display_name, primary_goal, career_level, organization_name, industries(name), functional_areas(name), current_roles(name)",
        )
        .eq("id", userId)
        .single(),
      admin.from("user_preferences").select("coaching_intensity, mentor_style").eq("user_id", userId).single(),
      admin.from("goals").select("title, status").eq("user_id", userId).eq("status", "active"),
      admin.from("coaching_frameworks").select("*").eq("is_active", true),
      getRelevantMemories(admin, userId),
    ]);

  if (!profile || !preferences) {
    throw new Error("failed to load profile/preferences for prompt assembly");
  }

  const framework = pickRelevantFramework(frameworks ?? [], profile.primary_goal);

  // Supabase's relational embed typing isn't fully resolved for this
  // hand-authored Database type; narrowed here rather than fighting it.
  const profileWithRelations = profile as any;

  return buildSystemPrompt({
    mentor,
    profile: {
      display_name: profile.display_name,
      primary_goal: profile.primary_goal,
      career_level: profile.career_level,
    },
    professional: {
      organizationName: profile.organization_name,
      industryName: profileWithRelations.industries?.name ?? null,
      functionalAreaName: profileWithRelations.functional_areas?.name ?? null,
      currentRoleName: profileWithRelations.current_roles?.name ?? null,
    },
    preferences,
    memories,
    goals: goals ?? [],
    framework,
  });
}

/**
 * Fetches the concrete "progress" signals the opening-turn directive
 * (buildOpeningTurnDirective) can reference — day streak and the most
 * recent episodic_summary memory item, if either exists. Deliberately
 * light-touch: this is not the full "yesterday's exercise" curriculum
 * concept from the brief (that's a distinct future stage), just what's
 * genuinely available today (progress_snapshots + memory_items).
 */
export async function loadProgressSummary(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<ProgressSummary> {
  const [{ data: streakSnapshot }, { data: recentSummary }] = await Promise.all([
    admin
      .from("progress_snapshots")
      .select("metric_value")
      .eq("user_id", userId)
      .eq("metric_key", "day_streak")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("memory_items")
      .select("content")
      .eq("user_id", userId)
      .eq("type", "episodic_summary")
      .is("superseded_by", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    dayStreak: streakSnapshot?.metric_value ?? null,
    lastSessionNote: recentSummary?.content ?? null,
  };
}
