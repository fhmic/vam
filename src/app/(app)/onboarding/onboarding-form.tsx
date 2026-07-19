"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-alert";
import { LEGAL_SLUG_ROUTES } from "@/lib/legal/routes";

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ["UTC"];

const PROFESSIONS = [
  "Student",
  "Professional",
  "Manager",
  "Executive",
  "Founder",
  "Consultant",
  "Job Seeker",
] as const;

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const PRIMARY_GOALS = [
  "Improve Confidence",
  "Executive Presence",
  "Ace Interviews",
  "Improve Presentations",
  "Improve Meetings",
  "Become More Persuasive",
  "Leadership Communication",
] as const;

interface RequiredDocument {
  id: string;
  name: string;
  slug: string;
}

export function OnboardingForm({
  defaultDisplayName,
  requiredDocuments,
}: {
  defaultDisplayName: string;
  requiredDocuments: RequiredDocument[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [profession, setProfession] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (requiredDocuments.length > 0 && !legalAccepted) {
      setError("Please review and accept the required agreements to continue.");
      return;
    }

    setIsLoading(true);

    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        timezone,
        profession: profession || undefined,
        experienceLevel: experienceLevel || undefined,
        primaryGoal: primaryGoal || undefined,
        acceptedDocumentIds: requiredDocuments.map((doc) => doc.id),
      }),
    });

    setIsLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <FormAlert tone="error" message={error} /> : null}

      <div>
        <Label htmlFor="displayName">What should your mentor call you?</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={80}
        />
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-11 w-full rounded-xl border border-ink/10 dark:border-white/10 px-3 text-sm outline-none
            focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="profession">Which best describes you?</Label>
        <select
          id="profession"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          className="h-11 w-full rounded-xl border border-ink/10 dark:border-white/10 px-3 text-sm outline-none
            focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30"
        >
          <option value="">Prefer not to say</option>
          {PROFESSIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="experienceLevel">Communication experience level</Label>
        <select
          id="experienceLevel"
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          className="h-11 w-full rounded-xl border border-ink/10 dark:border-white/10 px-3 text-sm outline-none
            focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30"
        >
          <option value="">Prefer not to say</option>
          {EXPERIENCE_LEVELS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="primaryGoal">What&apos;s your primary goal?</Label>
        <select
          id="primaryGoal"
          value={primaryGoal}
          onChange={(e) => setPrimaryGoal(e.target.value)}
          className="h-11 w-full rounded-xl border border-ink/10 dark:border-white/10 px-3 text-sm outline-none
            focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30"
        >
          <option value="">Prefer not to say</option>
          {PRIMARY_GOALS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {requiredDocuments.length > 0 ? (
        <div className="flex gap-3 rounded-xl border border-ink/10 dark:border-white/10 p-3">
          <input
            id="legalAccepted"
            type="checkbox"
            checked={legalAccepted}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/20 dark:border-white/20 text-signal-600
              focus:ring-signal-500"
          />
          <Label htmlFor="legalAccepted" className="mb-0 font-normal text-ink/70 dark:text-white/70">
            I have read and agree to the{" "}
            {requiredDocuments.map((doc, i) => (
              <span key={doc.id}>
                <Link
                  href={LEGAL_SLUG_ROUTES[doc.slug] ?? "#"}
                  target="_blank"
                  className="font-medium text-signal-600 underline hover:text-signal-700"
                >
                  {doc.name}
                </Link>
                {i < requiredDocuments.length - 2
                  ? ", "
                  : i === requiredDocuments.length - 2
                    ? ", and "
                    : ""}
              </span>
            ))}
            .
          </Label>
        </div>
      ) : null}

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Continue
      </Button>
    </form>
  );
}
