import * as React from "react";
import { cn, getStatusBadgeStyle } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "status" | "outline" | "secondary";
  status?: string;
}

export function Badge({ className, variant = "default", status, children, ...props }: BadgeProps) {
  if (variant === "status" && status) {
    const style = getStatusBadgeStyle(status);
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
          style.bg,
          style.text,
          style.border,
          className
        )}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
        {children || status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
        variant === "secondary" && "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        variant === "outline" && "border border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
