type Props = { score: number };

export function ScoreDial({ score }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  const tone =
    clamped >= 75 ? "#10b981" : clamped >= 50 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke={tone}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[1.75rem] font-semibold leading-none tabular-nums">
          {clamped}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          fit
        </span>
      </div>
    </div>
  );
}
