import { NextRequest } from "next/server"
import { parseId, shortText, tcgResults } from "@/lib/tcgcsv"
import type { CatalogRow } from "@/lib/types"

const ROW_LIMIT = 5000

function clip(value: string | null, fallback: string) {
  const text = value?.replace(/\s+/g, " ").trim()
  if (!text) return fallback
  return text.slice(0, 120)
}

type RawProduct = {
  productId: number
  name: string
  imageUrl?: string | null
  url?: string
  extendedData?: { name?: string; displayName?: string; value?: unknown }[] | null
}

type RawPrice = {
  productId: number
  lowPrice?: number | null
  midPrice?: number | null
  highPrice?: number | null
  marketPrice?: number | null
  subTypeName?: string | null
}

export async function GET(request: NextRequest) {
  const categoryId = parseId(request.nextUrl.searchParams.get("categoryId"))
  const groupId = parseId(request.nextUrl.searchParams.get("groupId"))
  const game = clip(request.nextUrl.searchParams.get("game"), "Unknown game")
  const setName = clip(request.nextUrl.searchParams.get("set"), "Unknown set")

  if (!categoryId || !groupId) {
    return Response.json({ error: "Pick a game and a set." }, { status: 400 })
  }

  try {
    const [products, prices] = await Promise.all([
      tcgResults<RawProduct>(`/${categoryId}/${groupId}/products`),
      tcgResults<RawPrice>(`/${categoryId}/${groupId}/prices`),
    ])

    if (products.length > ROW_LIMIT) {
      return Response.json(
        {
          error: `This group has ${products.length.toLocaleString()} products. Pick a smaller set.`,
        },
        { status: 400 },
      )
    }

    const pricesByProduct = new Map<number, RawPrice[]>()
    for (const price of prices) {
      const list = pricesByProduct.get(price.productId) ?? []
      list.push(price)
      pricesByProduct.set(price.productId, list)
    }

    const rows: CatalogRow[] = []
    for (const product of products) {
      if (!product.productId || !product.name) continue
      const number = shortText(product.extendedData, ["number", "#", "card number", "cardnumber"])
      const rarity = shortText(product.extendedData, ["rarity"])
      const base = {
        productId: product.productId,
        name: product.name,
        game,
        categoryId,
        setName,
        groupId,
        number,
        rarity,
        imageUrl: product.imageUrl || null,
        url: product.url || `https://www.tcgplayer.com/product/${product.productId}`,
      }
      const productPrices = pricesByProduct.get(product.productId)
      if (!productPrices?.length) {
        rows.push({
          ...base,
          key: `${product.productId}:unpriced`,
          printing: "Unpriced",
          marketPrice: null,
          lowPrice: null,
          midPrice: null,
          highPrice: null,
        })
        continue
      }
      for (const price of productPrices) {
        const printing = price.subTypeName?.trim() || "Normal"
        rows.push({
          ...base,
          key: `${product.productId}:${printing}`,
          printing,
          marketPrice: price.marketPrice ?? null,
          lowPrice: price.lowPrice ?? null,
          midPrice: price.midPrice ?? null,
          highPrice: price.highPrice ?? null,
        })
      }
    }

    rows.sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        (a.number ?? "").localeCompare(b.number ?? "", undefined, { numeric: true }) ||
        a.printing.localeCompare(b.printing),
    )

    return Response.json({ rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load products"
    return Response.json({ error: message }, { status: 502 })
  }
}
