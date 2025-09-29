import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-orange-700 placeholder:text-orange-400 selection:bg-orange-200 selection:text-orange-900 bg-white border-orange-200 text-orange-900 h-9 w-full min-w-0 rounded-md border-2 px-3 py-1 text-base shadow-paper transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-content",
        "focus-visible:border-orange-400 focus-visible:ring-orange-500/20 focus-visible:ring-[3px] focus-visible:shadow-paper-lifted",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
