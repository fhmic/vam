import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/progress/sparkline";
import { completionRate, summarizeFeedback, buildAssessmentTrends } from "@/lib/analytics/aggregate";

export default async function InsightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [{ data: goals }, { data: actionItems }, { data: feedback }, { data: assessmentScores }] =
    await Promise.all([
      supabase.from("goals").select("status").eq("user_id", user.id),
      supabase.from("action_plan_items").select("is_completed").eq("user_id", user.id),
      supabase.from("message_feedback").select("rating").eq("user_id", user.id),
      supabase
        .from("assessment_scores")
        .select("scores, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

  const goalsCompleted = (goals ?? []).filter((g) => g.status === "completed").length;
  const goalCompletionPct = completionRate(goalsCompleted, (goals ?? []).length);

  const actionItemsCompleted = (actionItems ?? []).filter((i) => i.is_completed).length;
  const actionCompletionPct = completionRate(actionItemsCompleted, (actionItems ?? []).length);

  const feedbackSummary = summarizeFeedback((feedback ?? []).map((f) => f.rating));

  const trends = buildAssessmentTrends(
    (assessmentScores ?? []).map((s) => s.scores as Record<string, number>),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Insights</h1>
        <p className="mt-1 text-sm text-slate-500">
          A rollup across goals, action plans, mentor feedback, and assessments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Goal completion</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{goalCompletionPct}%</p>
          <p className="mt-1 text-xs text-slate-400">
            {goalsCompleted} of {(goals ?? []).length} goals completed
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Action plan completion</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{actionCompletionPct}%</p>
          <p className="mt-1 text-xs text-slate-400">
            {actionItemsCompleted} of {(actionItems ?? []).length} items completed
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Mentor quality</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {feedbackSummary.positiveRate !== null ? `${feedbackSummary.positiveRate}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {feedbackSummary.totalRatings > 0
              ? `positive across ${feedbackSummary.totalRatings} rated replies`
              : "No ratings yet — use 👍/👎 in chat"}
          </p>
        </Card>
      </div>

      {trends.length > 0 ? (
        <div>
          <h2 className="mb-3 text-lg font-medium text-slate-900">Assessment trends</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {trends.map((trend) => (
              <Card key={trend.dimension}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium capitalize text-slate-700">
                    {trend.dimension.replace(/_/g, " ")}
                  </h3>
                  {trend.delta !== null ? (
                    <span
                      className={`text-xs font-medium ${trend.delta >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {trend.delta >= 0 ? "+" : ""}
                      {trend.delta}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2">
                  <Sparkline values={trend.values} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Take an assessment to start tracking dimension-level trends here.
        </p>
      )}
    </div>
  );
}
