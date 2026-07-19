import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getRequiredLegalDocuments } from "@/lib/legal/acceptance";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    // DB is the source of truth; repair the fast-path cookie for a
    // user who completed onboarding on another device/browser.
    const cookieStore = await cookies();
    cookieStore.set("va_onboarding_done", "1", { path: "/" });
    redirect("/dashboard");
  }

  // Required documents are fetched here (server component, RLS-scoped
  // client) rather than hardcoded in the form, so the version a user
  // actually reads/accepts always matches what's currently published
  // (migration 0007 + docs/adr/ADR-004-legal-acceptance-audit-design.md).
  const requiredDocuments = await getRequiredLegalDocuments(supabase);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-ink dark:text-white">Let&apos;s set you up</h1>
      <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
        A couple of quick details before you meet your mentor.
      </p>
      <div className="mt-8">
        <OnboardingForm
          defaultDisplayName={profile?.display_name ?? ""}
          requiredDocuments={requiredDocuments.map((doc) => ({
            id: doc.id,
            name: doc.name,
            slug: doc.slug,
          }))}
        />
      </div>
    </div>
  );
}
