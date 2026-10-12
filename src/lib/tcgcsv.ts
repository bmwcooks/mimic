const BASE = "https://tcgcsv.com/tcgplayer"

type Envelope<T> = {
  success?: boolean
  errors?: unknown[]
  results?: T[]
}

function failureMessage(errors: unknown[] | undefined, fallback: string) {
  const first = errors?.[0]
  if (typeof first === "string" && first.trim()) return first
  if (first && typeof first === "object" && "message" in first) {
    const message = (first as { message: unknown }).message
    if (typeof message === "string" && message.trim()) return message
  }
  return fallback
}

export async function tcgResults<T>(path: string): Promise<T[]> {
  const response = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MimicShelf/1.0 (personal catalog; public TCGCSV cache)",
    },
    next: { revalidate: 60 * 60 },
  })

  if (!response.ok) {
    throw new Error(`Catalog request failed (${response.status})`)
  }

  const body = (await response.json()) as Envelope<T>
  if (body.success === false) {
    throw new Error(failureMessage(body.errors, "Catalog request failed"))
  }
  return body.results ?? []
}

export function parseId(value: string | null) {
  if (!value || !/^\d{1,7}$/.test(value)) return null
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  return id
}

export function shortText(
  extended: { name?: string; displayName?: string; value?: unknown }[] | null | undefined,
  keys: string[],
) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()))
  for (const entry of extended ?? []) {
    const names = [entry.name, entry.displayName]
      .filter((name): name is string => typeof name === "string")
      .map((name) => name.toLowerCase())
    if (!names.some((name) => wanted.has(name))) continue
    const value = String(entry.value ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    if (value && value.length <= 40) return value
  }
  return null
}
