interface BloomProps {
  size?: number;
  variant?: "gradient" | "solid" | "white" | "ink";
  className?: string;
  title?: string;
}

interface RingSpec {
  /** Distance from center to petal tip (half the ring diameter). */
  tipRadius: number;
  petals: number;
  /** Petal half-width control distance w. */
  width: number;
  /** Petal length L (root to tip). */
  length: number;
  /** Gradient color at the petal root (inner end). */
  root: string;
  /** Gradient color at the petal tip (outer end). */
  tip: string;
  /** Ring rotation offset in degrees, so adjacent rings interleave. */
  offset: number;
}

const CENTER = 100;
const SEED_RADIUS = 7; // seed Ø 14
const SEED_COLOR = "#FF2E52";

// Bloom construction spec — brandbook v2.0, p.5 "The Mark".
// Symmetry 36°, four concentric petal rings plus seed. Each ring is rotated
// by half of its own angular step relative to the previous ring, so petals
// interleave: 0° → +18° (36°/2) → +22.5° (45°/2) → +30° (60°/2).
const RINGS: RingSpec[] = [
  {
    tipRadius: 100, // R1 Ø 200
    petals: 10,
    width: 200 * 0.16,
    length: 200 * 0.45,
    root: "#D8163F",
    tip: "#FF2E52",
    offset: 0,
  },
  {
    tipRadius: 74, // R2 Ø 148
    petals: 10,
    width: 148 * 0.17,
    length: 148 * 0.45,
    root: "#FF2E52",
    tip: "#FF7E9E",
    offset: 18,
  },
  {
    tipRadius: 50, // R3 Ø 100
    petals: 8,
    width: 100 * 0.19,
    length: 100 * 0.45,
    root: "#FF7E9E",
    tip: "#FFC2D3",
    offset: 40.5,
  },
  {
    tipRadius: 27, // R4 Ø 54
    petals: 6,
    width: 54 * 0.24,
    length: 54 * 0.45,
    root: "#FFB4CA",
    tip: "#FFDCE7",
    offset: 70.5,
  },
];

const VARIANT_FILL = {
  solid: "#FF2E52",
  white: "#FFFFFF",
  ink: "#1A1216",
} as const;

/** Round to 2 decimals so the emitted SVG stays clean. */
const n = (v: number) => Number(v.toFixed(2));

/**
 * One cubic pair, mirrored: a teardrop with its root at (0, 0) and its
 * rounded tip at (0, -L), symmetric around the radial (vertical) axis.
 */
const petalPath = (w: number, l: number) => {
  const c = n(0.55 * l);
  return `M 0,0 C ${n(w)},0 ${n(w)},${-c} 0,${-n(l)} C ${-n(w)},${-c} ${-n(w)},0 0,0 Z`;
};

/**
 * The shiftbloom Bloom, drawn in code from the brandbook v2.0 construction
 * spec. Mirrors the canonical implementation in the shiftbloom site repo.
 */
export function Bloom({
  size = 200,
  variant = "gradient",
  className,
  title,
}: BloomProps) {
  const flat = variant === "gradient" ? null : VARIANT_FILL[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {variant === "gradient" ? (
        <defs>
          {RINGS.map((ring) => (
            <linearGradient
              key={`gradient-${ring.tipRadius}`}
              id={`sb-bloom-ring-${ring.tipRadius}`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={0}
              y2={-n(ring.length)}
            >
              <stop offset="0%" stopColor={ring.root} />
              <stop offset="100%" stopColor={ring.tip} />
            </linearGradient>
          ))}
        </defs>
      ) : null}
      {RINGS.map((ring) => {
        const d = petalPath(ring.width, ring.length);
        const fill = flat ?? `url(#sb-bloom-ring-${ring.tipRadius})`;
        const rootDistance = ring.tipRadius - ring.length;
        return Array.from({ length: ring.petals }, (_, p) => {
          const angle = n(ring.offset + (360 / ring.petals) * p);
          return (
            <path
              key={`petal-${ring.tipRadius}-${angle}`}
              d={d}
              fill={fill}
              transform={`translate(${CENTER} ${CENTER}) rotate(${angle}) translate(0 ${-n(rootDistance)})`}
            />
          );
        });
      })}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={SEED_RADIUS}
        fill={flat ?? SEED_COLOR}
      />
    </svg>
  );
}

export default Bloom;
