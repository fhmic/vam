import type { SVGProps } from "react";

/**
 * Six original, hand-illustrated coach avatars (flat-geometric style,
 * not photoreal — deliberately, to feel approachable like a mascot
 * rather than uncanny). Each is a self-contained animated SVG: gentle
 * idle bob (animate-avatar-bob) + periodic blink (animate-blink on the
 * eye group, scaleY-based so it reads as a blink rather than a wink).
 *
 * These are placeholders in the sense that richer, AI-illustrated art
 * can replace them without any code change — see
 * docs/AVATAR-ASSET-SPEC.md for the exact prompts/specs to hand to an
 * image generator, plus the file format this system expects if you
 * swap in real artwork later.
 */

type AvatarProps = SVGProps<SVGSVGElement>;

function BaseAvatar({
  skin,
  outfit,
  hair,
  children,
  ...props
}: AvatarProps & { skin: string; outfit: string; hair: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 120" className="animate-avatar-bob" {...props}>
      {/* Outfit / shoulders */}
      <path d="M20 118 C20 92 40 82 60 82 C80 82 100 92 100 118 Z" fill={outfit} />
      {/* Neck */}
      <rect x="50" y="68" width="20" height="16" fill={skin} />
      {/* Head */}
      <circle cx="60" cy="48" r="30" fill={skin} />
      {hair}
      {/* Eyes (blink group) */}
      <g className="origin-center animate-blink" style={{ transformBox: "fill-box" }}>
        <circle cx="49" cy="48" r="3.2" fill="#12151B" />
        <circle cx="71" cy="48" r="3.2" fill="#12151B" />
      </g>
      {/* Smile */}
      <path d="M48 60 Q60 68 72 60" stroke="#12151B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {children}
    </svg>
  );
}

/** Morgan — "the-coach": direct, high-energy. Short hair, coral outfit. */
export function AvatarMorgan(props: AvatarProps) {
  return (
    <BaseAvatar
      skin="#C68A5E"
      outfit="#FF6A45"
      hair={<path d="M30 40 C30 14 90 14 90 40 C90 28 30 28 30 40 Z" fill="#2B1B12" />}
      {...props}
    />
  );
}

/** Ava — "the-guide": calm, structured. Ponytail, teal outfit. */
export function AvatarAva(props: AvatarProps) {
  return (
    <BaseAvatar
      skin="#F2C9A0"
      outfit="#0B6E6B"
      hair={
        <>
          <path d="M30 42 C28 12 92 12 90 42 C88 30 32 30 30 42 Z" fill="#4A2E1D" />
          <path d="M88 40 C100 46 100 74 90 78 C96 62 92 46 88 40 Z" fill="#4A2E1D" />
        </>
      }
      {...props}
    />
  );
}

/** Priya — "the-strategist": balanced, analytical. Side-part bob, gold outfit. */
export function AvatarPriya(props: AvatarProps) {
  return (
    <BaseAvatar
      skin="#8A5A3B"
      outfit="#E7A93D"
      hair={
        <path
          d="M28 44 C26 10 70 8 92 26 C98 32 92 44 92 44 C92 30 40 22 32 34 C30 38 29 41 28 44 Z"
          fill="#15100C"
        />
      }
      {...props}
    />
  );
}

/** Jordan — "the-sparring-partner": practice-first, direct. Textured crop, deep-ink outfit. */
export function AvatarJordan(props: AvatarProps) {
  return (
    <BaseAvatar
      skin="#E8B08A"
      outfit="#1B1F27"
      hair={<path d="M31 38 C31 16 89 16 89 38 C80 30 40 30 31 38 Z" fill="#171717" />}
      {...props}
    />
  );
}

/** Riley — module companion (neutral), used outside of mentor chat. */
export function AvatarRiley(props: AvatarProps) {
  return (
    <BaseAvatar
      skin="#D9A66C"
      outfit="#5FADA9"
      hair={<path d="M29 40 C29 12 91 12 91 40 C91 22 29 22 29 40 Z" fill="#2B2118" />}
      {...props}
    />
  );
}

/** Nova — module companion (neutral, playful), used outside of mentor chat. */
export function AvatarNova(props: AvatarProps) {
  return (
    <BaseAvatar
      skin="#F2D3B3"
      outfit="#F0CA7C"
      hair={
        <>
          <circle cx="60" cy="30" r="24" fill="#6B4226" />
          <circle cx="34" cy="52" r="8" fill="#6B4226" />
          <circle cx="86" cy="52" r="8" fill="#6B4226" />
        </>
      }
      {...props}
    />
  );
}
