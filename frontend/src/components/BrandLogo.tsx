type Props = {
  size?: number;
  className?: string;
};

/** QualifyBot lettermark — Q ring in blue → green */
export function BrandLogo({ size = 56, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="qb-bg" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#qb-bg)" />
      <circle cx="30" cy="30" r="14" stroke="white" strokeWidth="4.5" fill="none" />
      <path
        d="M40 40 L48 50"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="30" cy="30" r="5" fill="white" />
    </svg>
  );
}
