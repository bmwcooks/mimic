export const FIELD_IDS = [
  "image",
  "name",
  "game",
  "setName",
  "number",
  "rarity",
  "printing",
  "marketPrice",
  "lowPrice",
  "midPrice",
  "highPrice",
  "productId",
  "url",
  "savedAt",
] as const

export type FieldId = (typeof FIELD_IDS)[number]

export type FieldDef = {
  id: FieldId
  label: string
  csvLabel: string
  group: "Identity" | "Prices" | "Reference"
  locked?: boolean
  shelfOnly?: boolean
}

export const FIELD_DEFS: FieldDef[] = [
  { id: "image", label: "Image", csvLabel: "Image URL", group: "Identity" },
  { id: "name", label: "Name", csvLabel: "Name", group: "Identity", locked: true },
  { id: "game", label: "Game", csvLabel: "Game", group: "Identity" },
  { id: "setName", label: "Set", csvLabel: "Set", group: "Identity" },
  { id: "number", label: "Collector number", csvLabel: "Collector number", group: "Identity" },
  { id: "rarity", label: "Rarity", csvLabel: "Rarity", group: "Identity" },
  { id: "printing", label: "Printing", csvLabel: "Printing", group: "Identity" },
  { id: "marketPrice", label: "Market price", csvLabel: "Market price", group: "Prices" },
  { id: "lowPrice", label: "Low price", csvLabel: "Low price", group: "Prices" },
  { id: "midPrice", label: "Mid price", csvLabel: "Mid price", group: "Prices" },
  { id: "highPrice", label: "High price", csvLabel: "High price", group: "Prices" },
  { id: "productId", label: "Product ID", csvLabel: "Product ID", group: "Reference" },
  { id: "url", label: "TCGplayer link", csvLabel: "TCGplayer URL", group: "Reference" },
  {
    id: "savedAt",
    label: "Date saved",
    csvLabel: "Date saved",
    group: "Reference",
    shelfOnly: true,
  },
]

export const DEFAULT_FIELDS: FieldId[] = [
  "image",
  "name",
  "game",
  "setName",
  "number",
  "rarity",
  "printing",
  "marketPrice",
  "url",
]

const ALLOWED = new Set<string>(FIELD_IDS)

export function sanitizeFields(value: unknown): FieldId[] {
  const picked = Array.isArray(value)
    ? value.filter((id): id is FieldId => typeof id === "string" && ALLOWED.has(id))
    : []
  const unique = [...new Set(picked)]
  if (!unique.includes("name")) unique.unshift("name")
  return unique
}

export function orderedFields(enabled: readonly FieldId[], surface: "browse" | "shelf") {
  const on = new Set(enabled)
  return FIELD_DEFS.filter((field) => {
    if (!on.has(field.id)) return false
    if (surface === "browse" && field.shelfOnly) return false
    return true
  })
}
