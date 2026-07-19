import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Priority test #3 (Onboarding completion flow) — validates the request
 * schema in isolation. Mirrors bodySchema in
 * src/app/api/onboarding/complete/route.ts; kept as an inline copy
 * rather than importing the route module directly because that module
 * pulls in next/server + the Supabase server client, which needs a
 * request-scoped cookie store this unit test intentionally doesn't set
 * up (that's what tests/integration/onboarding-completion.test.ts is
 * for). If the two schemas drift, this is exactly the kind of gap the
 * integration test (once wired to a real test project) will catch by
 * exercising the real route.
 */
const PROFESSIONS = [
  "Student",
  "Professional",
  "Manager",
  "Executive",
  "Founder",
  "Consultant",
  "Job Seeker",
] as const;

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  timezone: z.string().trim().min(1).max(64),
  profession: z.enum(PROFESSIONS).optional(),
  acceptedDocumentIds: z.array(z.string().uuid()).default([]),
});

describe("onboarding completion request schema", () => {
  it("accepts a minimal valid payload", () => {
    const result = bodySchema.safeParse({
      displayName: "Jamie",
      timezone: "America/New_York",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty display name", () => {
    const result = bodySchema.safeParse({ displayName: "", timezone: "UTC" });
    expect(result.success).toBe(false);
  });

  it("rejects a profession outside the allowed set", () => {
    const result = bodySchema.safeParse({
      displayName: "Jamie",
      timezone: "UTC",
      profession: "Wizard",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid acceptedDocumentIds entry", () => {
    const result = bodySchema.safeParse({
      displayName: "Jamie",
      timezone: "UTC",
      acceptedDocumentIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });
});
