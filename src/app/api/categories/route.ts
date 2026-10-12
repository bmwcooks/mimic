import { tcgResults } from "@/lib/tcgcsv"
import type { Game } from "@/lib/types"

type RawCategory = {
  categoryId: number
  name: string
  displayName?: string
  popularity?: number
}

export async function GET() {
  try {
    const results = await tcgResults<RawCategory>("/categories")
    const categories: Game[] = results
      .filter((category) => category.categoryId && category.name)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.name.localeCompare(b.name))
      .map((category) => ({
        categoryId: category.categoryId,
        name: category.name,
        displayName: category.displayName?.trim() || category.name,
      }))
    return Response.json({ categories })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load games"
    return Response.json({ error: message }, { status: 502 })
  }
}
