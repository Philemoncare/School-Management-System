import React from "react";
import { cn } from "@/lib/utils";

export function Separator(props: React.HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  const { className, orientation = "horizontal", decorative = true, ...rest } = props;
  return (
    <hr
      className={cn(
        "relative w-full shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px]" : "w-[1px]",
        className,
      )}
      aria-orientation={orientation}
      aria-hidden={decorative}
      {...rest}
    />
  );
}
