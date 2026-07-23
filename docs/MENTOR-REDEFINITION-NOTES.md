# VAM — Mentor Redefinition Notes

Companion to the Product Redefinition & Training Framework document.
Covers what was actually built for the "mentor must not behave like a
general chatbot" requirement, and what's still a documented gap.

## What changed

1. **All 4 seeded mentor personas rewritten** (migration 0025, a plain
   `UPDATE`, not a versioned re-seed — persona copy has no compliance
   requirement the way legal document text does, so it doesn't need
   `legal_documents`' append-only/audit-trail treatment). Each keeps its
   original style archetype (challenging/supportive/balanced/practice-
   first) but is now explicitly framed as an Executive Communication
   Coach, not a general assistant.

2. **A platform-wide coaching philosophy is now injected into every
   turn's system prompt** (`COACHING_PHILOSOPHY` in `src/lib/groq/
   prompts.ts`), independent of which mentor is active: never fall back
   to generic passive framing, challenge assumptions, enforce
   recommendation-first communication ("Think First. Speak Second.").
   This is a platform standard, not a per-mentor personality trait.

3. **Proactive opening** — the mentor now speaks first. `/api/chat/
   greet` is called automatically (`mentor-chat.tsx`, on mount) whenever
   a session has zero messages, using a synthetic "kick off the
   session" directive (`buildOpeningTurnDirective`) that's sent to Groq
   but never shown to the user or persisted as a real message — only
   the mentor's resulting reply is saved.

## Honest gap: "yesterday's exercise" isn't a real thing yet

The brief's example opening references a specific prior exercise and
scores ("Yesterday's exercise showed improvement in clarity..."). There
is no formal exercise/curriculum-tracking system in this codebase yet —
that's the 30-day curriculum stage, not built. What the opening
directive actually has available to reference honestly:

- `progress_snapshots.day_streak` — a real number, can say "you're on a
  4-day streak"
- The most recent `memory_items` row of type `episodic_summary` (Stage
  3's memory consolidation) — a real, if informal, note about a past
  conversation

The model is explicitly instructed not to fabricate specific exercises,
scores, or sessions it has no real data for. Once the curriculum stage
exists, this is the natural place to wire in "yesterday's assigned
exercise" as a concrete, structured input rather than an
LLM-summarized memory note.

## Still not built (by design, not oversight)

- **30-day curriculum** (weekly modules, structured program progression)
  — a separate stage, not started.
- **Industry-specific scenario content** (the brief's Accounting/
  Business Development/HR/Executive scenario examples) — depends on the
  curriculum stage existing first.
- **VA Collective Intelligence Engine** — explicitly framed by the
  brief itself as "Phase 2 strategic feature." Not touched. This one in
  particular needs its own dedicated design pass before any code: what
  "anonymized" concretely means, the actual re-identification risk
  model, and the consent-tracking mechanism, not just two new tables.

## Not live-tested

Same standing caveat as every other Groq-calling code path in this
project: `/api/chat/greet` has never been exercised against a real Groq
key. The one thing worth specifically verifying once it is: that the
opening message actually reads as proactive and specific rather than
generic — prompt instructions are a strong lever, not a guarantee, and
this is exactly the kind of behavior that's easy to get subtly wrong in
practice even when the instructions are right on paper.
