"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Thumb } from "@/components/thumb"
import { orderedFields } from "@/lib/fields"
import { downloadCsv, formatDate, formatMoney, toCsv } from "@/lib/format"
import { clearShelf, removeKeys, useFields, useShelf } from "@/lib/shelf-store"
import type { KeptCard } from "@/lib/types"
import { cn } from "@/lib/utils"

type SortKey = "name" | "price" | "game" | "set"

export function ShelfView() {
  const shelf = useShelf()
  const enabled = useFields()
  const fields = orderedFields(enabled, "shelf")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("name")
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = shelf.filter((row) => {
      if (!needle) return true
      return (
        row.name.toLowerCase().includes(needle) ||
        row.game.toLowerCase().includes(needle) ||
        row.setName.toLowerCase().includes(needle) ||
        (row.number ?? "").toLowerCase().includes(needle) ||
        (row.rarity ?? "").toLowerCase().includes(needle)
      )
    })
    const copy = [...rows]
    copy.sort((a, b) => compare(a, b, sort))
    return copy
  }, [shelf, query, sort])

  const priced = filtered.reduce((sum, row) => sum + (row.marketPrice ?? 0), 0)
  const pricedCount = filtered.filter((row) => row.marketPrice != null).length
  const allChecked = filtered.length > 0 && filtered.every((row) => checked.has(row.key))

  function toggle(key: string, on: boolean) {
    setChecked((current) => {
      const next = new Set(current)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })
  }

  if (!ready) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-6">
        <p className="text-sm text-muted-foreground">Opening your shelf…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl tracking-tight">Shelf</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {shelf.length === 0
              ? "Nothing saved in this browser yet."
              : `${shelf.length.toLocaleString()} saved ${shelf.length === 1 ? "row" : "rows"}. The table and the CSV use the fields you left on.`}
          </p>
        </div>
        {filtered.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Market total of {pricedCount.toLocaleString()} priced{" "}
            {pricedCount === 1 ? "row" : "rows"}:{" "}
            <span className="font-medium text-foreground tabular-nums">{formatMoney(priced)}</span>
          </p>
        ) : null}
      </div>

      {shelf.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-card p-8">
          <h2 className="font-heading text-2xl">Your shelf is empty</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Browse a set, leave on only the columns you want, and keep the rows. They stay in
            this browser until you remove them.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
          >
            Browse games
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the shelf"
              aria-label="Search the shelf"
            />
            <select
              className="h-8 rounded-lg border border-input bg-card px-2 text-sm"
              value={sort}
              aria-label="Sort shelf"
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              <option value="name">Name</option>
              <option value="price">Market price</option>
              <option value="game">Game</option>
              <option value="set">Set</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nothing on the shelf matches.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs tracking-[0.12em] text-muted-foreground uppercase">
                    <th className="w-10 px-3 py-2">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(on) => {
                          setChecked(on ? new Set(filtered.map((row) => row.key)) : new Set())
                        }}
                        aria-label="Select every matching row"
                      />
                    </th>
                    {fields.map((field) => (
                      <th key={field.id} className="px-3 py-2 font-medium">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.key}
                      className={cn("border-b last:border-0", checked.has(row.key) && "bg-accent/60")}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={checked.has(row.key)}
                          onCheckedChange={(on) => toggle(row.key, on)}
                          aria-label={`Select ${row.name}`}
                        />
                      </td>
                      {fields.map((field) => (
                        <td key={field.id} className="px-3 py-2 align-middle">
                          <ShelfCell row={row} fieldId={field.id} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="sticky bottom-3 mt-3 flex flex-wrap items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">
            <Button
              variant="outline"
              disabled={filtered.length === 0}
              onClick={() => downloadCsv("mimic-shelf.csv", toCsv(filtered, fields))}
            >
              Export CSV
            </Button>
            <Button
              variant="destructive"
              disabled={checked.size === 0}
              onClick={() => {
                removeKeys(checked)
                setChecked(new Set())
              }}
            >
              Remove selected ({checked.size})
            </Button>
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={() => {
                if (window.confirm("Remove every card from this browser's shelf?")) {
                  clearShelf()
                  setChecked(new Set())
                }
              }}
            >
              Clear shelf
            </Button>
          </div>
        </>
      )}
    </main>
  )
}

function compare(a: KeptCard, b: KeptCard, sort: SortKey) {
  if (sort === "price") return (b.marketPrice ?? -1) - (a.marketPrice ?? -1) || a.name.localeCompare(b.name)
  if (sort === "game") return a.game.localeCompare(b.game) || a.name.localeCompare(b.name)
  if (sort === "set") return a.setName.localeCompare(b.setName) || a.name.localeCompare(b.name)
  return a.name.localeCompare(b.name) || a.printing.localeCompare(b.printing)
}

function ShelfCell({ row, fieldId }: { row: KeptCard; fieldId: string }) {
  switch (fieldId) {
    case "image":
      return <Thumb src={row.imageUrl} name={row.name} />
    case "name":
      return <span className="font-medium">{row.name}</span>
    case "game":
      return row.game
    case "setName":
      return row.setName
    case "number":
      return row.number || "—"
    case "rarity":
      return row.rarity || "—"
    case "printing":
      return row.printing
    case "marketPrice":
      return <span className="tabular-nums">{formatMoney(row.marketPrice)}</span>
    case "lowPrice":
      return <span className="tabular-nums">{formatMoney(row.lowPrice)}</span>
    case "midPrice":
      return <span className="tabular-nums">{formatMoney(row.midPrice)}</span>
    case "highPrice":
      return <span className="tabular-nums">{formatMoney(row.highPrice)}</span>
    case "productId":
      return <span className="tabular-nums">{row.productId}</span>
    case "url":
      return (
        <a className="underline" href={row.url} target="_blank" rel="noreferrer">
          Open
        </a>
      )
    case "savedAt":
      return formatDate(row.savedAt)
    default:
      return "—"
  }
}
