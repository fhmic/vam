import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/groq/prompts";
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

describe("buildSystemPrompt", () => {
  it("includes the mentor's own persona prompt verbatim as the first section", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, experience_level: null },
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt.startsWith(mentor.persona_prompt)).toBe(true);
  });

  it("includes the user's active goals but not paused/completed ones", () => {
    const prompt = buildSystemPrompt({
      mentor,
      profile: { display_name: "Sam", primary_goal: null, experience_level: null },
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
      profile: { display_name: "Sam", primary_goal: null, experience_level: null },
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
      profile: { display_name: "Sam", primary_goal: null, experience_level: null },
      preferences: { coaching_intensity: "medium", mentor_style: "supportive" },
      memories: [],
      goals: [],
    });
    expect(prompt).not.toContain("Relevant things you remember");
  });
});
