"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { FIELD_DEFS } from "@/lib/fields"
import { resetFields, toggleField, useFields } from "@/lib/shelf-store"
import { cn } from "@/lib/utils"

const GROUPS = ["Identity", "Prices", "Reference"] as const

export function FieldSheet() {
  const enabled = useFields()
  const on = new Set(enabled)

  return (
    <Sheet>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Fields
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">Fields to keep</SheetTitle>
          <SheetDescription>
            Browse, the shelf, and CSV export show only the columns you turn on. Saved cards
            still remember the rest, so a column can come back later.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
          {GROUPS.map((group) => (
            <section key={group}>
              <h3 className="mb-1 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {group}
              </h3>
              <ul>
                {FIELD_DEFS.filter((field) => field.group === group).map((field) => (
                  <li key={field.id}>
                    <label className="flex items-center gap-3 py-1.5 text-sm">
                      <Checkbox
                        checked={on.has(field.id)}
                        disabled={field.locked}
                        onCheckedChange={(checked) => toggleField(field.id, checked)}
                      />
                      <span>
                        {field.label}
                        {field.shelfOnly ? (
                          <span className="ml-2 text-xs text-muted-foreground">Shelf only</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-auto border-t p-4">
          <Button variant="outline" className="w-full" onClick={resetFields}>
            Reset to the usual columns
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
