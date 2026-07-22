import { describe, expect, it } from "vitest";
import { buildOpeningTurnDirective, buildSystemPrompt, type ProfessionalContext } from "@/lib/groq/prompts";
import type { Mentor } from "@/types/database";

const mentor: Mentor = {
  id: "id",
  slug: "the-guide",
  display_name: "Ava",
  tagline: "Calm and structured",
  persona_prompt: "You are Ava, a calm and structured communication coach.",
  mentor_style: "supportive",
  best_fit_goals: ["Improve Confidence"],
  voice_id: "voice-warm-female-01",
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

const emptyProfessional: ProfessionalContext = {
  organizationName: null,
  industryName: null,
  functionalAreaName: null,
  currentRoleName: null,
};

describe("buildSystemPrompt", () => {
  it("includes the mentor's own persona prompt verbatim as the first section", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: null },
      professional: emptyProfessional,
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt.startsWith(mentor.persona_prompt)).toBe(true);
  });

  it("includes the user's active goals but not paused/completed ones", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: null },
      professional: emptyProfessional,
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [
        { title: "Nail the quarterly review", status: "active" },
        { title: "Old abandoned goal", status: "abandoned" },
      ],
    });
    expect(prompt).toContain("Nail the quarterly review");
    expect(prompt).not.toContain("Old abandoned goal");
  });

  it("includes memory items with their type, without a raw data-dump framing", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: null },
      professional: emptyProfessional,
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [{ type: "preference", content: "Prefers direct feedback over softened language" }],
      goals: [],
    });
    expect(prompt).toContain("(preference) Prefers direct feedback over softened language");
    expect(prompt).toContain("do not read it back verbatim");
  });

  it("omits the memory section entirely when there is no memory yet", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: null },
      professional: emptyProfessional,
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt).not.toContain("Relevant things you remember");
  });

  it("includes career level and calibration guidance so scenarios aren't one-size-fits-all", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: "Executive Level" },
      professional: emptyProfessional,
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt).toContain("Executive Level");
    expect(prompt).toContain("Board-level");
  });

  it("weaves in resolved organization/industry/role/functional-area context when present", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: "Senior Level" },
      professional: {
        organizationName: "Acme Bank",
        industryName: "Banking",
        functionalAreaName: "Treasury",
        currentRoleName: "Senior Manager",
      },
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt).toContain("Senior Manager");
    expect(prompt).toContain("Treasury");
    expect(prompt).toContain("Banking");
    expect(prompt).toContain("Acme Bank");
  });

  it("omits the role-context clause entirely when nothing professional is known yet", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: null },
      professional: emptyProfessional,
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt).toContain("The user's name is Sam.");
  });

  it("always includes the platform coaching philosophy, regardless of mentor persona", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, career_level: null },
      professional: emptyProfessional,
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt).toContain("Executive Communication Coach");
    expect(prompt).toContain("What can I help you with today?");
    expect(prompt).toContain("Think First. Speak Second.");
  });
});

describe("buildOpeningTurnDirective", () => {
  it("instructs the mentor to open proactively rather than ask a generic question", () => {
    const directive = buildOpeningTurnDirective({ dayStreak: null, lastSessionNote: null });
    expect(directive).toContain("SESSION START");
    expect(directive).toContain("time-boxed challenge");
  });

  it("tells the model not to fabricate progress when there is none yet", () => {
    const directive = buildOpeningTurnDirective({ dayStreak: null, lastSessionNote: null });
    expect(directive).toContain("do not fabricate prior progress");
  });

  it("surfaces a concrete last-session note when one exists", () => {
    const directive = buildOpeningTurnDirective({
      dayStreak: 5,
      lastSessionNote: "Struggled to lead with a recommendation during a budget scenario.",
    });
    expect(directive).toContain("Struggled to lead with a recommendation during a budget scenario.");
  });

  it("acknowledges an active streak when there is no specific session note", () => {
    const directive = buildOpeningTurnDirective({ dayStreak: 4, lastSessionNote: null });
    expect(directive).toContain("4-day streak");
  });
});
