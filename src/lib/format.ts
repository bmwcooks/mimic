import type { FieldId, FieldDef } from "@/lib/fields"
import type { CatalogRow, KeptCard } from "@/lib/types"

export function formatMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function plainValue(row: CatalogRow | KeptCard, field: FieldId) {
  switch (field) {
    case "image":
      return row.imageUrl ?? ""
    case "name":
      return row.name
    case "game":
      return row.game
    case "setName":
      return row.setName
    case "number":
      return row.number ?? ""
    case "rarity":
      return row.rarity ?? ""
    case "printing":
      return row.printing
    case "marketPrice":
      return row.marketPrice == null ? "" : String(row.marketPrice)
    case "lowPrice":
      return row.lowPrice == null ? "" : String(row.lowPrice)
    case "midPrice":
      return row.midPrice == null ? "" : String(row.midPrice)
    case "highPrice":
      return row.highPrice == null ? "" : String(row.highPrice)
    case "productId":
      return String(row.productId)
    case "url":
      return row.url
    case "savedAt":
      return "savedAt" in row ? row.savedAt : ""
    default:
      return ""
  }
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function toCsv(rows: Array<CatalogRow | KeptCard>, fields: FieldDef[]) {
  const header = fields.map((field) => csvCell(field.csvLabel)).join(",")
  const body = rows.map((row) =>
    fields
      .map((field) => {
        if (field.id === "savedAt" && "savedAt" in row) return csvCell(formatDate(row.savedAt))
        if (
          field.id === "marketPrice" ||
          field.id === "lowPrice" ||
          field.id === "midPrice" ||
          field.id === "highPrice"
        ) {
          const value = row[field.id]
          return csvCell(value == null ? "" : value.toFixed(2))
        }
        return csvCell(plainValue(row, field.id))
      })
      .join(","),
  )
  return [header, ...body].join("\n")
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
