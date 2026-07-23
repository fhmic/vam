# VAM — Coach Avatar Asset Spec

The app currently ships with **6 original, hand-illustrated SVG mascot
characters** (`src/components/avatar/coach-avatars.tsx`) — fully
functional today, no external dependency. This doc is for if/when you
want to replace them with richer AI-generated illustrations from
another tool (Midjourney, DALL-E, etc.), without touching any code.

## Why illustrated, not photorealistic

Duolingo's Duo (and most "coach mascot" products) use flat/illustrated
characters deliberately, not photoreal human faces — it avoids the
uncanny-valley effect of a "not quite right" AI face, and reads as
friendly rather than trying to pass as a real person. I'd recommend
staying in an illustrated style even with a stronger image generator,
for the same reason. That said, the system below works with either.

## The 6 characters and their personality brief

| Name | Tied to mentor | Style | Suggested look |
|---|---|---|---|
| Morgan | `the-coach` | Direct, high-energy | Confident male-coded, short hair, warm coral accent color |
| Ava | `the-guide` | Calm, structured | Warm female-coded, ponytail, deep teal accent |
| Priya | `the-strategist` | Balanced, analytical | Female-coded, side-part bob, gold accent |
| Jordan | `the-sparring-partner` | Practice-first, direct | Male-coded, textured crop, deep-ink accent |
| Riley | Module companion (neutral) | Adaptable | Neutral-coded, simple hair, teal accent |
| Nova | Module companion (neutral, playful) | Encouraging | Female-coded, playful hair (buns), gold accent |

## Prompt template

Use one prompt per character, substituting the bracketed parts from the
table above:

```
Flat, modern vector-illustration character portrait of a friendly AI
coach mascot. [Gender-coding] with [hair description], warm expression,
simple geometric shapes, no photorealism, similar in spirit to a
Duolingo-style mascot but for a professional communication-coaching
app. Shoulders-up portrait, facing forward, [accent color] as the
dominant clothing/background color. Clean flat color fills, minimal
shading, transparent background, no text, no logos.
```

Example for Morgan:
```
Flat, modern vector-illustration character portrait of a friendly AI
coach mascot. Confident male-coded character with short dark hair,
warm expression, simple geometric shapes, no photorealism, similar in
spirit to a Duolingo-style mascot but for a professional
communication-coaching app. Shoulders-up portrait, facing forward,
warm coral-orange (#FF6A45) as the dominant clothing color. Clean flat
color fills, minimal shading, transparent background, no text, no logos.
```

## File format the app expects

- **Format:** PNG or SVG, transparent background
- **Dimensions:** square, at least 240×240px (the app renders them at
  various sizes from 48px to 80px, so a bit of headroom avoids blur)
- **Naming:** save as `morgan.png`, `ava.png`, `priya.png`, `jordan.png`,
  `riley.png`, `nova.png`

## How to swap them in

1. Drop the 6 files into `public/avatars/`.
2. In `src/components/avatar/coach-avatars.tsx`, replace each SVG
   component's return with an `<img src="/avatars/morgan.png" ... />`
   (or use Next's `<Image>` component for optimization) — the
   component *names* (`AvatarMorgan`, `AvatarAva`, etc.) and their
   *exports* should stay the same, since `src/lib/avatar/registry.ts`
   imports them by name. That's the only file that needs to change —
   the shuffle logic, mentor-mapping, and every page that renders an
   avatar stay exactly as they are.
3. If you want to keep the idle "bob" animation, wrap the `<img>` in a
   `<div className="animate-avatar-bob">` the same way the SVG version
   does it now.

That's it — no database change, no other component needs to know
whether an avatar is an SVG or a PNG.
