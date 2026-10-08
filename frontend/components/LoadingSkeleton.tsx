export default function LoadingSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-slate-800/70 ${className}`}
    />
  );
}
