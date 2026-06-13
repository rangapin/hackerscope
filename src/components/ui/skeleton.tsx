import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-terracotta-DEFAULT/10",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
