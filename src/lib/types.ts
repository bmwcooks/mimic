export type Game = {
  categoryId: number
  name: string
  displayName: string
}

export type CardSet = {
  groupId: number
  name: string
  abbreviation: string | null
  publishedOn: string | null
  isSupplemental: boolean
}

export type CatalogRow = {
  key: string
  productId: number
  name: string
  game: string
  categoryId: number
  setName: string
  groupId: number
  number: string | null
  rarity: string | null
  printing: string
  marketPrice: number | null
  lowPrice: number | null
  midPrice: number | null
  highPrice: number | null
  imageUrl: string | null
  url: string
}

export type KeptCard = CatalogRow & {
  savedAt: string
}
