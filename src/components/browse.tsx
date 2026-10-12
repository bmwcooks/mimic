"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Thumb } from "@/components/thumb"
import { orderedFields } from "@/lib/fields"
import { formatMoney } from "@/lib/format"
import { keepRows, useFields, useShelf } from "@/lib/shelf-store"
import type { CardSet, CatalogRow, Game } from "@/lib/types"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 30

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const body = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) {
    throw new Error(body.error || "Request failed")
  }
  return body
}

export function Browse() {
  const enabled = useFields()
  const shelf = useShelf()
  const fields = orderedFields(enabled, "browse")
  const kept = useMemo(() => new Set(shelf.map((item) => item.key)), [shelf])

  const [games, setGames] = useState<Game[] | null>(null)
  const [gamesError, setGamesError] = useState<string | null>(null)
  const [gamesAttempt, setGamesAttempt] = useState(0)
  const [gameQuery, setGameQuery] = useState("")
  const [game, setGame] = useState<Game | null>(null)

  const [sets, setSets] = useState<CardSet[] | null>(null)
  const [setsError, setSetsError] = useState<string | null>(null)
  const [setsLoading, setSetsLoading] = useState(false)
  const [setsAttempt, setSetsAttempt] = useState(0)
  const [setQuery, setSetQuery] = useState("")
  const [mainSetsOnly, setMainSetsOnly] = useState(true)
  const [cardSet, setCardSet] = useState<CardSet | null>(null)

  const [rows, setRows] = useState<CatalogRow[] | null>(null)
  const [rowsError, setRowsError] = useState<string | null>(null)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [rowsAttempt, setRowsAttempt] = useState(0)
  const [rowQuery, setRowQuery] = useState("")
  const [rarity, setRarity] = useState("all")
  const [printing, setPrinting] = useState("all")
  const [page, setPage] = useState(1)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    readJson<{ categories: Game[] }>("/api/categories")
      .then((body) => {
        if (!cancelled) setGames(body.categories)
      })
      .catch((error: unknown) => {
        if (!cancelled) setGamesError(error instanceof Error ? error.message : "Could not load games")
      })
    return () => {
      cancelled = true
    }
  }, [gamesAttempt])

  useEffect(() => {
    if (!game) return
    let cancelled = false
    readJson<{ groups: CardSet[] }>(`/api/groups?categoryId=${game.categoryId}`)
      .then((body) => {
        if (!cancelled) setSets(body.groups)
      })
      .catch((error: unknown) => {
        if (!cancelled) setSetsError(error instanceof Error ? error.message : "Could not load sets")
      })
      .finally(() => {
        if (!cancelled) setSetsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [game, setsAttempt])

  useEffect(() => {
    if (!game || !cardSet) return
    let cancelled = false
    const params = new URLSearchParams({
      categoryId: String(game.categoryId),
      groupId: String(cardSet.groupId),
      game: game.displayName,
      set: cardSet.name,
    })
    readJson<{ rows: CatalogRow[] }>(`/api/products?${params}`)
      .then((body) => {
        if (!cancelled) setRows(body.rows)
      })
      .catch((error: unknown) => {
        if (!cancelled) setRowsError(error instanceof Error ? error.message : "Could not load products")
      })
      .finally(() => {
        if (!cancelled) setRowsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [game, cardSet, rowsAttempt])

  const visibleGames = useMemo(() => {
    const query = gameQuery.trim().toLowerCase()
    return (games ?? []).filter((item) => {
      if (!query) return true
      return (
        item.displayName.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
      )
    })
  }, [games, gameQuery])

  const visibleSets = useMemo(() => {
    const query = setQuery.trim().toLowerCase()
    return (sets ?? []).filter((item) => {
      if (mainSetsOnly && item.isSupplemental) return false
      if (!query) return true
      return item.name.toLowerCase().includes(query)
    })
  }, [sets, setQuery, mainSetsOnly])

  const rarities = useMemo(() => {
    const values = new Set<string>()
    for (const row of rows ?? []) {
      if (row.rarity) values.add(row.rarity)
    }
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const printings = useMemo(() => {
    const values = new Set<string>()
    for (const row of rows ?? []) values.add(row.printing)
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = rowQuery.trim().toLowerCase()
    return (rows ?? []).filter((row) => {
      if (rarity !== "all" && row.rarity !== rarity) return false
      if (printing !== "all" && row.printing !== printing) return false
      if (!query) return true
      return (
        row.name.toLowerCase().includes(query) ||
        (row.number ?? "").toLowerCase().includes(query) ||
        (row.rarity ?? "").toLowerCase().includes(query)
      )
    })
  }, [rows, rowQuery, rarity, printing])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageKeys = pageRows.map((row) => row.key)
  const allPageChecked = pageKeys.length > 0 && pageKeys.every((key) => checked.has(key))

  function chooseGame(next: Game) {
    setGame(next)
    setCardSet(null)
    setRows(null)
    setRowsError(null)
    setSets(null)
    setSetsError(null)
    setSetsLoading(true)
    setSetQuery("")
    setRowQuery("")
    setNotice(null)
  }

  function chooseSet(next: CardSet) {
    setCardSet(next)
    setRowQuery("")
    setRows(null)
    setRowsError(null)
    setRowsLoading(true)
    setChecked(new Set())
    setPage(1)
    setRarity("all")
    setPrinting("all")
    setNotice(null)
  }

  function toggleChecked(key: string, on: boolean) {
    setChecked((current) => {
      const next = new Set(current)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function togglePage(on: boolean) {
    setChecked((current) => {
      const next = new Set(current)
      for (const key of pageKeys) {
        if (on) next.add(key)
        else next.delete(key)
      }
      return next
    })
  }

  function keep(list: CatalogRow[]) {
    if (!list.length) return
    const result = keepRows(list)
    setNotice(
      result.updated
        ? `Kept ${result.added} new ${result.added === 1 ? "row" : "rows"} and refreshed ${result.updated} already on the shelf.`
        : `Kept ${result.added} ${result.added === 1 ? "row" : "rows"}.`,
    )
    setChecked(new Set())
  }

  return (
    <main
      className={cn(
        "mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 lg:px-6",
        game && cardSet
          ? "lg:grid-cols-[220px_250px_minmax(0,1fr)]"
          : game
            ? "lg:grid-cols-[220px_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]",
      )}
    >
      <section className={cn("flex min-h-0 flex-col", game && "hidden lg:flex")}>
        <div className="mb-3">
          <h1 className="font-heading text-3xl tracking-tight">Games</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            TCGplayer categories, most collected first.
          </p>
        </div>
        <Input
          value={gameQuery}
          onChange={(event) => setGameQuery(event.target.value)}
          placeholder="Search games"
          aria-label="Search games"
        />
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
          {gamesError ? (
            <div className="rounded-lg border border-destructive/30 bg-card p-3 text-sm">
              <p className="text-destructive">{gamesError}</p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => {
                  setGames(null)
                  setGamesError(null)
                  setGamesAttempt((n) => n + 1)
                }}
              >
                Try again
              </Button>
            </div>
          ) : games == null ? (
            <p className="text-sm text-muted-foreground">Loading games…</p>
          ) : visibleGames.length === 0 ? (
            <p className="text-sm text-muted-foreground">No games match that search.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {visibleGames.map((item) => {
                const selected = game?.categoryId === item.categoryId
                return (
                  <li key={item.categoryId}>
                    <button
                      type="button"
                      onClick={() => chooseGame(item)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-card",
                      )}
                    >
                      {item.displayName}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {!game ? (
        <section className="hidden rounded-2xl border bg-card p-8 lg:block">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Personal catalog</p>
          <h2 className="mt-2 max-w-xl font-heading text-4xl leading-tight">
            Keep the TCGplayer rows you care about, and leave the rest behind.
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Pick a game, then a set. Turn columns on or off with Fields. Checked rows land on
            your shelf in this browser, ready to export as a CSV of only those columns.
          </p>
          <p className="mt-6 max-w-xl text-sm text-muted-foreground">
            Prices come from the public TCGCSV cache of TCGplayer catalog data, so they can lag
            the live marketplace by about a day. This is your own list, not a storefront.
          </p>
        </section>
      ) : null}

      {game ? (
        <section className={cn("flex min-h-0 flex-col", cardSet && "hidden lg:flex")}>
          <button
            type="button"
            className="mb-2 text-left text-sm text-primary lg:hidden"
            onClick={() => {
              setGame(null)
              setCardSet(null)
            }}
          >
            All games
          </button>
          <h2 className="font-heading text-2xl tracking-tight">{game.displayName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {setsLoading
              ? "Loading sets…"
              : sets
                ? `${visibleSets.length.toLocaleString()} sets`
                : "Sets"}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Input
              value={setQuery}
              onChange={(event) => setSetQuery(event.target.value)}
              placeholder="Search sets"
              aria-label="Search sets"
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={mainSetsOnly}
                onCheckedChange={(checked) => setMainSetsOnly(checked)}
              />
              Main sets only
            </label>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto lg:max-h-[calc(100vh-16rem)]">
            {setsError ? (
              <div className="rounded-lg border border-destructive/30 bg-card p-3 text-sm">
                <p className="text-destructive">{setsError}</p>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => {
                    setSets(null)
                    setSetsError(null)
                    setSetsLoading(true)
                    setSetsAttempt((n) => n + 1)
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : setsLoading || sets == null ? (
              <p className="text-sm text-muted-foreground">Loading sets…</p>
            ) : visibleSets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sets match. Try the full list, including promos and extras.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {visibleSets.map((item) => {
                  const selected = cardSet?.groupId === item.groupId
                  const year = item.publishedOn ? item.publishedOn.slice(0, 4) : null
                  return (
                    <li key={item.groupId}>
                      <button
                        type="button"
                        onClick={() => chooseSet(item)}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          selected ? "bg-accent text-accent-foreground" : "hover:bg-card",
                        )}
                      >
                        <span className="block">{item.name}</span>
                        <span className="text-xs opacity-70">
                          {[year, item.isSupplemental ? "Extra" : null].filter(Boolean).join(" · ") ||
                            "Set"}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {game && cardSet ? (
        <section className="flex min-w-0 flex-col">
          <button
            type="button"
            className="mb-2 text-left text-sm text-primary lg:hidden"
            onClick={() => setCardSet(null)}
          >
            All sets
          </button>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                {game.displayName}
              </p>
              <h2 className="font-heading text-3xl tracking-tight">{cardSet.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {rowsLoading
                ? "Loading products…"
                : rows
                  ? `${filteredRows.length.toLocaleString()} rows`
                  : null}
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_140px]">
            <Input
              value={rowQuery}
              onChange={(event) => {
                setRowQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search name or number"
              aria-label="Search products"
            />
            <select
              className="h-8 rounded-lg border border-input bg-card px-2 text-sm"
              value={rarity}
              aria-label="Filter by rarity"
              onChange={(event) => {
                setRarity(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">All rarities</option>
              {rarities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-lg border border-input bg-card px-2 text-sm"
              value={printing}
              aria-label="Filter by printing"
              onChange={(event) => {
                setPrinting(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">All printings</option>
              {printings.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {notice ? <p className="mt-3 text-sm text-primary">{notice}</p> : null}

          <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
            {rowsError ? (
              <div className="p-4 text-sm">
                <p className="text-destructive">{rowsError}</p>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => {
                    setRows(null)
                    setRowsError(null)
                    setRowsLoading(true)
                    setRowsAttempt((n) => n + 1)
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : rowsLoading || rows == null ? (
              <p className="p-4 text-sm text-muted-foreground">Pulling products and prices…</p>
            ) : filteredRows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nothing in this set matches.</p>
            ) : (
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs tracking-[0.12em] text-muted-foreground uppercase">
                    <th className="w-10 px-3 py-2">
                      <Checkbox
                        checked={allPageChecked}
                        onCheckedChange={(on) => togglePage(on)}
                        aria-label="Select every row on this page"
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
                  {pageRows.map((row) => {
                    const selected = checked.has(row.key)
                    return (
                      <tr
                        key={row.key}
                        className={cn("border-b last:border-0", selected && "bg-accent/60")}
                      >
                        <td className="px-3 py-2 align-middle">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(on) => toggleChecked(row.key, on)}
                            aria-label={`Select ${row.name}`}
                          />
                        </td>
                        {fields.map((field) => (
                          <td key={field.id} className="px-3 py-2 align-middle">
                            <RowCell row={row} fieldId={field.id} kept={kept.has(row.key)} />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="sticky bottom-3 mt-3 flex flex-wrap items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">
            <Button
              disabled={checked.size === 0}
              onClick={() => keep(filteredRows.filter((row) => checked.has(row.key)))}
            >
              Keep selected ({checked.size})
            </Button>
            <Button
              variant="outline"
              disabled={filteredRows.length === 0}
              onClick={() => keep(filteredRows)}
            >
              Keep filtered ({filteredRows.length})
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage(Math.max(1, safePage - 1))}
              >
                Previous
              </Button>
              <span className="tabular-nums text-muted-foreground">
                {safePage} / {pageCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={safePage >= pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Market, low, mid, and high prices are catalog figures from{" "}
            <a className="underline" href="https://tcgcsv.com/" target="_blank" rel="noreferrer">
              TCGCSV
            </a>
            , a public cache of TCGplayer data. They are not live seller listings.
          </p>
        </section>
      ) : null}
    </main>
  )
}

function RowCell({
  row,
  fieldId,
  kept,
}: {
  row: CatalogRow
  fieldId: string
  kept: boolean
}) {
  switch (fieldId) {
    case "image":
      return <Thumb src={row.imageUrl} name={row.name} />
    case "name":
      return (
        <span className="font-medium">
          {row.name}
          {kept ? <span className="ml-2 text-xs font-normal text-primary">On shelf</span> : null}
        </span>
      )
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
    default:
      return "—"
  }
}
