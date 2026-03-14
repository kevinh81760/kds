type SkeletonTone = "soft" | "base" | "strong";

type SkeletonProps = {
  className?: string;
  tone?: SkeletonTone;
};

export function Skeleton({ className = "", tone = "base" }: SkeletonProps) {
  const toneClassName =
    tone === "soft" ? "kds-skeleton--soft" : tone === "strong" ? "kds-skeleton--strong" : "kds-skeleton--base";

  return <div aria-hidden className={`kds-skeleton ${toneClassName} ${className}`.trim()} />;
}
