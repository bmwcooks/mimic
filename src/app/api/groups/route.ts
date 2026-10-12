import { NextRequest } from "next/server"
import { parseId, tcgResults } from "@/lib/tcgcsv"
import type { CardSet } from "@/lib/types"

type RawGroup = {
  groupId: number
  name: string
  abbreviation?: string | null
  isSupplemental?: boolean
  publishedOn?: string | null
}

export async function GET(request: NextRequest) {
  const categoryId = parseId(request.nextUrl.searchParams.get("categoryId"))
  if (!categoryId) {
    return Response.json({ error: "Pick a game first." }, { status: 400 })
  }

  try {
    const results = await tcgResults<RawGroup>(`/${categoryId}/groups`)
    const groups: CardSet[] = results
      .filter((group) => group.groupId && group.name)
      .map((group) => ({
        groupId: group.groupId,
        name: group.name,
        abbreviation: group.abbreviation ?? null,
        publishedOn: group.publishedOn ?? null,
        isSupplemental: Boolean(group.isSupplemental),
      }))
      .sort((a, b) => {
        const aTime = a.publishedOn ? Date.parse(a.publishedOn) : 0
        const bTime = b.publishedOn ? Date.parse(b.publishedOn) : 0
        return bTime - aTime || a.name.localeCompare(b.name)
      })
    return Response.json({ groups })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load sets"
    return Response.json({ error: message }, { status: 502 })
  }
}
