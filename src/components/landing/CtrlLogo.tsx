/**
 * CtrlLogo - The CTRL product logo rendered as an inline SVG.
 *
 * Geometric block-letter style matching the Mindmaker brand aesthetic.
 * Each letter (C, T, R, L) is built from angular shapes with sharp cuts,
 * echoing the triangular/trapezoidal style of the favicon icon.
 */

interface CtrlLogoProps {
  className?: string;
}

export function CtrlLogo({ className }: CtrlLogoProps) {
  return (
    <svg
      viewBox="0 0 480 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CTRL"
    >
      <defs>
        <linearGradient id="ctrl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7BEBC0" />
          <stop offset="50%" stopColor="#5ED8A8" />
          <stop offset="100%" stopColor="#2DB77A" />
        </linearGradient>
      </defs>

      {/* C - Block letter with angular notch */}
      <path
        d="M0 10 Q0 0 10 0 L90 0 L90 28 L35 28 Q28 28 28 35 L28 85 Q28 92 35 92 L90 92 L90 120 L10 120 Q0 120 0 110 Z"
        fill="url(#ctrl-grad)"
      />
      {/* C - triangular cutout notch */}
      <path
        d="M55 50 L90 28 L90 72 Z"
        fill="currentColor"
        className="text-background"
      />

      {/* T - Block letter with angular base */}
      <path
        d="M105 0 L215 0 L215 28 L175 28 L175 120 L145 120 L145 28 L105 28 Z"
        fill="url(#ctrl-grad)"
      />
      {/* T - triangular accent cut */}
      <path
        d="M145 28 L160 55 L175 28 Z"
        fill="currentColor"
        className="text-background"
      />

      {/* R - Block letter with angular leg */}
      <path
        d="M230 0 L310 0 Q330 0 330 20 L330 50 Q330 65 315 68 L340 120 L308 120 L285 72 L258 72 L258 120 L230 120 Z"
        fill="url(#ctrl-grad)"
      />
      {/* R - counter (hole) */}
      <path
        d="M258 25 L298 25 Q302 25 302 30 L302 46 Q302 50 298 50 L258 50 Z"
        fill="currentColor"
        className="text-background"
      />

      {/* L - Block letter */}
      <path
        d="M355 0 L383 0 L383 92 L460 92 Q470 92 470 102 L470 120 L355 120 Z"
        fill="url(#ctrl-grad)"
      />
    </svg>
  );
}
