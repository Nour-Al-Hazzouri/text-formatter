import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-orange-200 bg-white placeholder:text-orange-400 text-orange-900 focus-visible:border-orange-400 focus-visible:ring-orange-500/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border-2 px-4 py-3 text-base shadow-paper transition-all outline-none focus-visible:ring-[3px] focus-visible:shadow-paper-lifted disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-content",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
