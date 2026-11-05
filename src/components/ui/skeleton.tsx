import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "card" | "circle" | "pill"
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "skeleton-shimmer animate-pulse bg-[var(--line)]/65 dark:bg-white/[0.07]",
        variant === "default" && "rounded-lg",
        variant === "card" && "rounded-[22px] border border-[var(--line)]/60 bg-[var(--s1)]",
        variant === "circle" && "rounded-full",
        variant === "pill" && "rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
