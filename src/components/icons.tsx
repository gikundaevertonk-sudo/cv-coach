type IconProps = { className?: string };

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ArrowRight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

export function Upload({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 3v9M6.5 6.5 10 3l3.5 3.5M4 14v2.5A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={1.8}>
      <path d="M4 10.5 8 15l8-9.5" />
    </svg>
  );
}

export function Warning({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 3.5 2 17h16L10 3.5ZM10 8.5v4M10 15h.01" />
    </svg>
  );
}

export function Sparkles({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M11 3.5 12.6 8 17 9.6 12.6 11 11 15.5 9.4 11 5 9.6 9.4 8 11 3.5ZM5 3v3M3.5 4.5h3" />
    </svg>
  );
}

export function Target({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="6.5" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

export function Hash({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7.5 3 5.5 17M14.5 3l-2 14M3.5 7.5h13M3 12.5h13" />
    </svg>
  );
}

export function Steps({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 5h8M9 10h8M9 15h8M4 4.5 5 5.5 6.5 4M4 9.5l1 1L6.5 9M4 14.5l1 1L6.5 14" />
    </svg>
  );
}

export function Chat({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5V5.5Z" />
    </svg>
  );
}

export function Pencil({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 16.5 4.9 13 13 4.9a1.5 1.5 0 0 1 2.1 0l0 0a1.5 1.5 0 0 1 0 2.1L7 15l-3 1.5ZM11.5 6.5l2 2" />
    </svg>
  );
}

export function Spinner({ className = "" }: IconProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}
