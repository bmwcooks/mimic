"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { FieldSheet } from "@/components/field-sheet"
import { useShelf } from "@/lib/shelf-store"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const shelf = useShelf()

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="min-w-0">
          <span className="font-heading text-2xl leading-none tracking-tight">Mimic</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Your catalog, your columns
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: pathname === "/" ? "default" : "ghost", size: "sm" }))}
          >
            Browse
          </Link>
          <Link
            href="/shelf"
            className={cn(
              buttonVariants({ variant: pathname === "/shelf" ? "default" : "ghost", size: "sm" }),
            )}
          >
            Shelf
            <span className="tabular-nums">{shelf.length}</span>
          </Link>
          <FieldSheet />
        </nav>
      </div>
    </header>
  )
}
