"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
    `
    peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
    border-2 border-transparent transition-colors
    data-[state=checked]:bg-blue-600
    data-[state=unchecked]:bg-gray-300
    `,
    className
  )}
  {...props}
    >
      <SwitchPrimitive.Thumb
    className="
      pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg
      transition-transform data-[state=checked]:translate-x-4
      data-[state=unchecked]:translate-x-0
    "
  />
</SwitchPrimitive.Root>
  )
}

export { Switch }
